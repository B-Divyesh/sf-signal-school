import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { copyFileSync, existsSync, mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { WebSocket, WebSocketServer } from 'ws';

const roles = [
  ['Relay runner', 'You can see West relay capacity, but not the weather marks.'],
  ['Weather reader', 'You can see the weather marks, but not message priority.'],
  ['Harbor clerk', 'You can see message priority at Harbor, but not cable condition.'],
  ['Signal keeper', 'You can see status flags, but not each relay queue.']
] as const;

type PlanId = 'split' | 'west' | 'hold';
type RoomPlan = { id: PlanId; label: string; detail: string };
type SharedRound = { goal: string; correct: PlanId; plans: RoomPlan[]; intel: Record<string, string> };
type SharedScenario = { name: string; topology: string; rounds: SharedRound[] };

const roomScenarios: SharedScenario[] = [
  {
    name: 'Tide Lines', topology: 'Two relays meet at a narrow harbor cable.',
    rounds: [
      { goal: 'Deliver two tide notes before West fills.', correct: 'split', plans: [{ id: 'split', label: 'Split tide notes', detail: 'One note on each relay.' }, { id: 'west', label: 'Fill West', detail: 'Send both through West.' }, { id: 'hold', label: 'Hold at Shore', detail: 'Wait for another report.' }], intel: { 'Relay runner': 'West has one free slot.', 'Weather reader': 'East has no fog mark.', 'Harbor clerk': 'Both notes have equal priority.', 'Signal keeper': 'East raised a clear flag.' } },
      { goal: 'Move two route cards while the direct cable frays.', correct: 'west', plans: [{ id: 'split', label: 'Use both cables', detail: 'Divide the cards.' }, { id: 'west', label: 'Use the ready relay', detail: 'Send both through East.' }, { id: 'hold', label: 'Wait for calm', detail: 'Keep both cards at Shore.' }], intel: { 'Relay runner': 'East relay has two empty slots.', 'Weather reader': 'West cable has a coral fray mark.', 'Harbor clerk': 'Both cards must arrive this round.', 'Signal keeper': 'The West status flag just changed to red.' } },
      { goal: 'Deliver two final notes after a status update.', correct: 'hold', plans: [{ id: 'split', label: 'Repeat the split', detail: 'Use the older map.' }, { id: 'west', label: 'Use East first', detail: 'Commit before the update.' }, { id: 'hold', label: 'Read the new flag', detail: 'Wait for the current status.' }], intel: { 'Relay runner': 'The relay queue cleared after the update.', 'Weather reader': 'A squall is leaving the east cable.', 'Harbor clerk': 'Harbor remains open for both notes.', 'Signal keeper': 'The new flag says wait for the clear signal, then route.' } }
    ]
  },
  {
    name: 'Fog Junction', topology: 'A triangle relay crosses a fogged channel.',
    rounds: [
      { goal: 'Send two fog notices through the junction.', correct: 'west', plans: [{ id: 'split', label: 'Share the triangle', detail: 'Use the marked routes.' }, { id: 'west', label: 'Use the south leg', detail: 'Keep both notices below fog.' }, { id: 'hold', label: 'Wait for visibility', detail: 'Stop at the junction.' }], intel: { 'Relay runner': 'The south leg holds two notices.', 'Weather reader': 'North is fogged; south is clear.', 'Harbor clerk': 'Neither notice can wait.', 'Signal keeper': 'The south signal flag is steady.' } },
      { goal: 'Keep two route checks moving after a link breaks.', correct: 'hold', plans: [{ id: 'split', label: 'Use remaining links', detail: 'Send one on each.' }, { id: 'west', label: 'Chase the old link', detail: 'Use the route that broke.' }, { id: 'hold', label: 'Confirm the backup', detail: 'Read the spare-link flag.' }], intel: { 'Relay runner': 'The spare relay answered a fresh ping.', 'Weather reader': 'The broken link still has fog around it.', 'Harbor clerk': 'Harbor can accept a delayed second check.', 'Signal keeper': 'The backup flag is gold; the old link is red.' } },
      { goal: 'Deliver two harbor confirmations before fog returns.', correct: 'split', plans: [{ id: 'split', label: 'Use both clear legs', detail: 'Keep a backup path.' }, { id: 'west', label: 'Use south twice', detail: 'Send both along one leg.' }, { id: 'hold', label: 'Store confirmations', detail: 'Wait for perfect weather.' }], intel: { 'Relay runner': 'North and south each have one slot.', 'Weather reader': 'Fog is still away from both clear legs.', 'Harbor clerk': 'The two confirmations have the same deadline.', 'Signal keeper': 'Both clear-leg flags are green.' } }
    ]
  },
  {
    name: 'Headland Loop', topology: 'A looping headland relay returns harbor echoes.',
    rounds: [
      { goal: 'Deliver two high-priority messages after an echo.', correct: 'hold', plans: [{ id: 'split', label: 'Use both paths now', detail: 'Route before the echo.' }, { id: 'west', label: 'Use the visible path', detail: 'Ignore the loop.' }, { id: 'hold', label: 'Read the echo', detail: 'Wait for the return flag.' }], intel: { 'Relay runner': 'The outer relay opens when the echo arrives.', 'Weather reader': 'The visible path has incoming spray.', 'Harbor clerk': 'Both messages are high priority.', 'Signal keeper': 'The return flag is one pulse away.' } },
      { goal: 'Route two updates after the harbor changes its echo.', correct: 'split', plans: [{ id: 'split', label: 'Use echo + loop', detail: 'Send one through each live route.' }, { id: 'west', label: 'Repeat the first route', detail: 'Follow the old route.' }, { id: 'hold', label: 'Keep both updates', detail: 'Wait without routing.' }], intel: { 'Relay runner': 'The loop relay is empty now.', 'Weather reader': 'The outer cable is clear this round.', 'Harbor clerk': 'The second update is still useful now.', 'Signal keeper': 'The new echo marks both routes live.' } },
      { goal: 'Send two acknowledgements before the loop closes.', correct: 'west', plans: [{ id: 'split', label: 'Split acknowledgements', detail: 'Use the old balance.' }, { id: 'west', label: 'Use the shore return', detail: 'Send both on the fresh return.' }, { id: 'hold', label: 'Wait for another echo', detail: 'Risk the close.' }], intel: { 'Relay runner': 'The shore return has two free slots.', 'Weather reader': 'The loop cable is closing in spray.', 'Harbor clerk': 'Harbor needs both acknowledgements together.', 'Signal keeper': 'The last echo points to the shore return.' } }
    ]
  }
];

const roomScenario = (index: number) => roomScenarios[index % roomScenarios.length];
const roleFor = (scenario: number, playerIndex: number) => roles[(playerIndex + scenario) % roles.length][0];
const roomRetentionMs = 24 * 60 * 60 * 1000;

type Phase = 'lobby' | 'active' | 'ended';
type RoomRow = { code: string; scenario: number; phase: Phase; round: number; delivered: number; end: 'won' | 'lost' | null; note: string; choices: string; created_at: number; updated_at: number };
type PlayerRow = { room_code: string; client_id: string; name: string; role: string; connected: number; is_host: number };
type Connection = { socket: WebSocket; clientId?: string; code?: string };
type RateBucket = { count: number; reset: number };

export type RealtimeOptions = { port?: number; databasePath?: string; buildSha?: string; now?: () => number };
export type RealtimeInstance = { server: HttpServer; close: () => Promise<void>; port: () => number };

const json = (value: unknown) => JSON.stringify(value);
const shortCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const validName = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 24;
const validId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value);
const validCode = (value: unknown) => typeof value === 'string' && /^[A-Z0-9]{6}$/.test(value);

function durableDataPath() {
  const candidate = process.env.DATA_DIR || (existsSync('/data') ? '/data' : resolve('realtime/data'));
  mkdirSync(candidate, { recursive: true });
  return join(candidate, 'rooms.sqlite');
}

function openPaths(explicitPath?: string) {
  if (explicitPath) return { workingPath: explicitPath, durablePath: null as string | null };
  const durablePath = durableDataPath();
  const workingDirectory = '/tmp/signal-school-realtime';
  const workingPath = join(workingDirectory, 'rooms.sqlite');
  mkdirSync(workingDirectory, { recursive: true });
  if (existsSync(durablePath) && statSync(durablePath).size > 0) copyFileSync(durablePath, workingPath);
  return { workingPath, durablePath };
}

function requestIp(request: IncomingMessage) {
  const forwarded = request.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.socket.remoteAddress || 'unknown';
}

function originAllowed(origin: string | undefined) {
  return !origin || origin === 'https://signal-school.sociobot.in' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function createRealtimeServer(options: RealtimeOptions = {}): RealtimeInstance {
  const clock = options.now || Date.now;
  const { workingPath, durablePath } = openPaths(options.databasePath);
  mkdirSync(dirname(workingPath), { recursive: true });
  const db = new Database(workingPath);
  db.pragma('locking_mode = EXCLUSIVE');
  db.pragma('journal_mode = DELETE');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY, scenario INTEGER NOT NULL, phase TEXT NOT NULL, round INTEGER NOT NULL,
      delivered INTEGER NOT NULL, end TEXT, note TEXT NOT NULL, choices TEXT NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS players (
      room_code TEXT NOT NULL, client_id TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL,
      connected INTEGER NOT NULL, is_host INTEGER NOT NULL, PRIMARY KEY(room_code, client_id),
      FOREIGN KEY(room_code) REFERENCES rooms(code)
    );
    CREATE INDEX IF NOT EXISTS players_by_room ON players(room_code);
  `);
  const expiry = clock() - roomRetentionMs;
  db.prepare('DELETE FROM players WHERE room_code IN (SELECT code FROM rooms WHERE updated_at < ?)').run(expiry);
  db.prepare('DELETE FROM rooms WHERE updated_at < ?').run(expiry);
  // A process restart closes every WebSocket. Do not carry stale connections
  // into the next room host; returning clients explicitly resume their slot.
  db.prepare('UPDATE players SET connected = 0 WHERE connected != 0').run();
  const persist = () => {
    if (!durablePath) return;
    const stagingPath = `${durablePath}.next`;
    writeFileSync(stagingPath, db.serialize());
    renameSync(stagingPath, durablePath);
  };
  persist();

  const rooms = {
    get: db.prepare('SELECT * FROM rooms WHERE code = ?'),
    insert: db.prepare('INSERT INTO rooms (code, scenario, phase, round, delivered, end, note, choices, created_at, updated_at) VALUES (@code, @scenario, @phase, @round, @delivered, @end, @note, @choices, @created_at, @updated_at)'),
    update: db.prepare('UPDATE rooms SET scenario=@scenario, phase=@phase, round=@round, delivered=@delivered, end=@end, note=@note, choices=@choices, updated_at=@updated_at WHERE code=@code'),
    remove: db.prepare('DELETE FROM rooms WHERE code = ?')
  };
  const players = {
    list: db.prepare('SELECT * FROM players WHERE room_code = ? ORDER BY is_host DESC, rowid ASC'),
    get: db.prepare('SELECT * FROM players WHERE room_code = ? AND client_id = ?'),
    count: db.prepare('SELECT COUNT(*) AS count FROM players WHERE room_code = ?'),
    insert: db.prepare('INSERT INTO players (room_code, client_id, name, role, connected, is_host) VALUES (?, ?, ?, ?, 1, ?)'),
    connect: db.prepare('UPDATE players SET connected = 1, name = ? WHERE room_code = ? AND client_id = ?'),
    disconnect: db.prepare('UPDATE players SET connected = 0 WHERE room_code = ? AND client_id = ?'),
    setRole: db.prepare('UPDATE players SET role = ? WHERE room_code = ? AND client_id = ?'),
    removeByRoom: db.prepare('DELETE FROM players WHERE room_code = ?')
  };
  const connections = new Set<Connection>();
  const buckets = new Map<string, RateBucket>();
  const cleanupExpired = () => {
    const expired = db.prepare('SELECT code FROM rooms WHERE updated_at < ?').all(clock() - roomRetentionMs) as Array<{ code: string }>;
    if (expired.length === 0) return;
    expired.forEach(({ code }) => connections.forEach((connection) => {
      if (connection.code === code) {
        reply(connection.socket, { type: 'deleted', message: 'This inactive room was deleted after 24 hours.' });
        connection.code = undefined;
        connection.clientId = undefined;
      }
    }));
    db.transaction(() => expired.forEach(({ code }) => { players.removeByRoom.run(code); rooms.remove.run(code); }))();
    persist();
  };
  const expiryTimer = setInterval(cleanupExpired, 60 * 60 * 1000);
  expiryTimer.unref();

  const rateAllowed = (ip: string) => {
    const time = clock();
    const bucket = buckets.get(ip);
    if (!bucket || bucket.reset <= time) {
      buckets.set(ip, { count: 1, reset: time + 60_000 });
      return { allowed: true, retry: 0 };
    }
    if (bucket.count >= 40) return { allowed: false, retry: Math.max(1, Math.ceil((bucket.reset - time) / 1000)) };
    bucket.count += 1;
    return { allowed: true, retry: 0 };
  };

  const roomFor = (code: string) => rooms.get.get(code) as RoomRow | undefined;
  const listPlayers = (code: string) => players.list.all(code) as PlayerRow[];
  const writeRoom = (room: RoomRow) => {
    rooms.update.run({ ...room, updated_at: clock() });
    persist();
  };
  const reply = (socket: WebSocket, payload: unknown) => { if (socket.readyState === WebSocket.OPEN) socket.send(json(payload)); };
  const error = (socket: WebSocket, message: string) => reply(socket, { type: 'error', message });
  const publicState = (room: RoomRow, player: PlayerRow) => {
    const scenario = roomScenario(room.scenario);
    const round = scenario.rounds[Math.min(room.round, scenario.rounds.length - 1)];
    return {
    code: room.code,
    scenarioName: scenario.name,
    topology: scenario.topology,
    phase: room.phase,
    round: room.round,
    delivered: room.delivered,
    end: room.end,
    players: listPlayers(room.code).map((row) => ({ id: row.client_id, name: row.name, role: row.role, connected: Boolean(row.connected), isHost: Boolean(row.is_host) })),
    ownRole: player.role,
    ownIntel: round.intel[player.role] || 'Your role has a partial network view.',
    roundGoal: round.goal,
    plans: round.plans,
    choices: { submitted: Boolean(JSON.parse(room.choices)[player.client_id]) },
    note: room.note
    };
  };
  const broadcast = (code: string) => {
    const room = roomFor(code);
    if (!room) return;
    for (const connection of connections) {
      if (connection.code !== code || !connection.clientId) continue;
      const player = players.get.get(code, connection.clientId) as PlayerRow | undefined;
      if (player) reply(connection.socket, { type: 'state', state: publicState(room, player) });
    }
  };
  const markConnection = (connection: Connection, code: string, clientId: string) => {
    connection.code = code;
    connection.clientId = clientId;
  };
  const activePlayerCount = (code: string) => listPlayers(code).filter((player) => player.connected).length;

  const createRoom = (connection: Connection, message: Record<string, unknown>) => {
    if (!validId(message.clientId) || !validName(message.name)) return error(connection.socket, 'Enter a name before creating a room.');
    let code = shortCode();
    while (roomFor(code)) code = shortCode();
    const timestamp = clock();
    const room: RoomRow = { code, scenario: 0, phase: 'lobby', round: 0, delivered: 0, end: null, note: 'Invite one to three teammates, then start the shared run.', choices: '{}', created_at: timestamp, updated_at: timestamp };
    db.transaction(() => {
      rooms.insert.run(room);
      players.insert.run(code, message.clientId, String(message.name).trim(), roleFor(room.scenario, 0), 1);
    })();
    persist();
    markConnection(connection, code, String(message.clientId));
    broadcast(code);
  };
  const joinRoom = (connection: Connection, message: Record<string, unknown>, allowExisting: boolean) => {
    if (!validId(message.clientId) || !validCode(message.code) || !validName(message.name)) return error(connection.socket, 'Use a six-character room code and a name.');
    const code = String(message.code).toUpperCase();
    const existing = roomFor(code);
    if (!existing) return error(connection.socket, 'That room code does not exist. Ask the host to check the code.');
    const known = players.get.get(code, message.clientId) as PlayerRow | undefined;
    if (!known && allowExisting) return error(connection.socket, 'This saved room session is no longer available. Join with the current room code.');
    if (!known && Number((players.count.get(code) as { count: number }).count) >= 4) return error(connection.socket, 'This room already has four players.');
    db.transaction(() => {
      if (known) players.connect.run(String(message.name).trim(), code, message.clientId);
      else {
        const index = Number((players.count.get(code) as { count: number }).count);
        players.insert.run(code, message.clientId, String(message.name).trim(), roleFor(existing.scenario, index), 0);
      }
    })();
    persist();
    markConnection(connection, code, String(message.clientId));
    broadcast(code);
  };
  const startRoom = (connection: Connection, message: Record<string, unknown>) => {
    if (!validCode(message.code) || !validId(message.clientId)) return error(connection.socket, 'Room details are invalid. Rejoin the room.');
    const room = roomFor(String(message.code));
    const player = room && players.get.get(room.code, message.clientId) as PlayerRow | undefined;
    if (!room || !player || !player.is_host) return error(connection.socket, 'Only the room host can start this run.');
    if (room.phase !== 'lobby') return error(connection.socket, 'This room has already started.');
    if (activePlayerCount(room.code) < 2) return error(connection.socket, 'Connect at least two players before starting.');
    writeRoom({ ...room, phase: 'active', note: 'Round 1 is open. Agree on a plan, then each player submits it.', choices: '{}' });
    broadcast(room.code);
  };
  const choose = (connection: Connection, message: Record<string, unknown>) => {
    if (!validCode(message.code) || !validId(message.clientId) || !['split', 'west', 'hold'].includes(String(message.choice))) return error(connection.socket, 'Choose Split, Direct, or Hold.');
    const room = roomFor(String(message.code));
    const player = room && players.get.get(room.code, message.clientId) as PlayerRow | undefined;
    if (!room || !player || room.phase !== 'active') return error(connection.socket, 'This run is not ready for a plan.');
    const choices = JSON.parse(room.choices) as Record<string, string>;
    choices[player.client_id] = String(message.choice);
    const required = listPlayers(room.code).filter((row) => row.connected).map((row) => row.client_id);
    if (!required.every((id) => choices[id])) {
      writeRoom({ ...room, choices: json(choices), note: `${Object.keys(choices).filter((id) => required.includes(id)).length} of ${required.length} players submitted a plan.` });
      return broadcast(room.code);
    }
    const selected = required.map((id) => choices[id] as PlanId);
    if (!selected.every((item) => item === selected[0])) {
      writeRoom({ ...room, choices: json(choices), note: 'Plans differ. Talk through the partial views, then replace your plan.' });
      return broadcast(room.code);
    }
    const expected = roomScenario(room.scenario).rounds[room.round].correct;
    const delivered = room.delivered + (selected[0] === expected ? 2 : selected[0] === 'hold' ? 0 : 1);
    const isLast = room.round === 2;
    const next: RoomRow = isLast ? {
      ...room, delivered, phase: 'ended', end: delivered === 6 ? 'won' : 'lost', round: 3, choices: '{}',
      note: delivered === 6 ? `All six signals arrived on ${roomScenario(room.scenario).name}. Debrief: compare the role reports before committing.` : `The storm closed on ${roomScenario(room.scenario).name}. Debrief: use the role reports before committing.`
    } : {
      ...room, delivered, round: room.round + 1, choices: '{}', note: `The shared plan resolved. Round ${room.round + 2} is open.`
    };
    writeRoom(next);
    broadcast(room.code);
  };
  const restart = (connection: Connection, message: Record<string, unknown>) => {
    if (!validCode(message.code) || !validId(message.clientId)) return error(connection.socket, 'Room details are invalid. Rejoin the room.');
    const room = roomFor(String(message.code));
    const player = room && players.get.get(room.code, message.clientId) as PlayerRow | undefined;
    if (!room || !player || !player.is_host) return error(connection.socket, 'Only the room host can restart this run.');
    const scenario = (room.scenario + 1) % roomScenarios.length;
    db.transaction(() => {
      listPlayers(room.code).forEach((member, index) => players.setRole.run(roleFor(scenario, index), room.code, member.client_id));
      rooms.update.run({ ...room, scenario, phase: 'lobby', round: 0, delivered: 0, end: null, choices: '{}', note: `${roomScenario(scenario).name} is ready. Connect two players, then start the shared run.`, updated_at: clock() });
    })();
    persist();
    broadcast(room.code);
  };

  const deleteRoom = (connection: Connection, message: Record<string, unknown>) => {
    if (!validCode(message.code) || !validId(message.clientId)) return error(connection.socket, 'Room details are invalid. Rejoin the room.');
    const room = roomFor(String(message.code));
    const player = room && players.get.get(room.code, message.clientId) as PlayerRow | undefined;
    if (!room || !player || !player.is_host) return error(connection.socket, 'Only the room host can delete room data.');
    for (const current of connections) {
      if (current.code === room.code) {
        reply(current.socket, { type: 'deleted', message: 'The host deleted this room and its server data.' });
        current.code = undefined;
        current.clientId = undefined;
      }
    }
    db.transaction(() => { players.removeByRoom.run(room.code); rooms.remove.run(room.code); })();
    persist();
  };

  const http = createServer((request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const setHeaders = () => {
      const origin = request.headers.origin;
      if (originAllowed(origin)) response.setHeader('Access-Control-Allow-Origin', origin || 'https://signal-school.sociobot.in');
      response.setHeader('Vary', 'Origin');
      response.setHeader('X-Content-Type-Options', 'nosniff');
    };
    const send = (status: number, body: unknown) => { setHeaders(); response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(json(body)); };
    if (request.method === 'OPTIONS') { setHeaders(); response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return response.end(); }
    if (url.pathname !== '/health') {
      const limit = rateAllowed(requestIp(request));
      if (!limit.allowed) { setHeaders(); response.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': String(limit.retry) }); return response.end(json({ error: 'Rate limit exceeded. Try again after the stated delay.' })); }
    }
    if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true, build: options.buildSha || process.env.BUILD_SHA || 'dev', storage: durablePath ? '/data' : 'local' });
    const roomMatch = /^\/rooms\/([A-Z0-9]{6})$/.exec(url.pathname);
    if (request.method === 'GET' && roomMatch) return send(roomFor(roomMatch[1]) ? 200 : 404, { exists: Boolean(roomFor(roomMatch[1])) });
    return send(404, { error: 'Not found' });
  });
  const websocket = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  http.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin;
    if (!originAllowed(origin)) { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return socket.destroy(); }
    const limit = rateAllowed(requestIp(request));
    if (!limit.allowed) { socket.write(`HTTP/1.1 429 Too Many Requests\r\nRetry-After: ${limit.retry}\r\nConnection: close\r\n\r\n`); return socket.destroy(); }
    if (new URL(request.url || '/', 'http://localhost').pathname !== '/ws') { socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return socket.destroy(); }
    websocket.handleUpgrade(request, socket, head, (ws) => websocket.emit('connection', ws, request));
  });
  websocket.on('connection', (socket) => {
    const connection: Connection = { socket };
    connections.add(connection);
    socket.on('message', (payload) => {
      const limit = rateAllowed('ws:' + (connection.clientId || 'new'));
      if (!limit.allowed) return error(socket, `Rate limit exceeded. Try again in ${limit.retry} seconds.`);
      try {
        const message = JSON.parse(String(payload)) as Record<string, unknown>;
        if (message.type === 'create') createRoom(connection, message);
        else if (message.type === 'join') joinRoom(connection, message, false);
        else if (message.type === 'resume') joinRoom(connection, message, true);
        else if (message.type === 'start') startRoom(connection, message);
        else if (message.type === 'choose') choose(connection, message);
        else if (message.type === 'restart') restart(connection, message);
        else if (message.type === 'delete') deleteRoom(connection, message);
        else error(socket, 'Unknown room action.');
      } catch { error(socket, 'That room message could not be read.'); }
    });
    socket.on('close', () => {
      connections.delete(connection);
      if (connection.code && connection.clientId) {
        players.disconnect.run(connection.code, connection.clientId);
        persist();
        broadcast(connection.code);
      }
    });
  });
  http.listen(options.port ?? Number(process.env.PORT || 8080));
  return {
    server: http,
    port: () => (http.address() as { port: number }).port,
    close: async () => new Promise((resolveClose, rejectClose) => {
      clearInterval(expiryTimer);
      for (const connection of connections) connection.socket.terminate();
      websocket.close(() => http.close((errorClose) => {
      persist();
      db.close();
        return errorClose ? rejectClose(errorClose) : resolveClose();
      }));
    })
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const instance = createRealtimeServer();
  process.stdout.write(json({ event: 'signal-school-realtime-started', port: instance.port(), storage: process.env.DATA_DIR ? '/data' : 'local' }) + '\n');
  const stop = async () => { await instance.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
