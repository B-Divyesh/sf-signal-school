import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { WebSocket, WebSocketServer } from 'ws';

const roles = [
  ['Relay runner', 'You can see West relay capacity, but not the weather marks.'],
  ['Weather reader', 'You can see the weather marks, but not message priority.'],
  ['Harbor clerk', 'You can see message priority at Harbor, but not cable condition.'],
  ['Signal keeper', 'You can see status flags, but not each relay queue.']
] as const;

type Phase = 'lobby' | 'active' | 'ended';
type RoomRow = { code: string; scenario: number; phase: Phase; round: number; delivered: number; end: 'won' | 'lost' | null; note: string; choices: string; created_at: number; updated_at: number };
type PlayerRow = { room_code: string; client_id: string; name: string; role: string; connected: number; is_host: number };
type Connection = { socket: WebSocket; clientId?: string; code?: string };
type RateBucket = { count: number; reset: number };

export type RealtimeOptions = { port?: number; databasePath?: string; buildSha?: string };
export type RealtimeInstance = { server: HttpServer; close: () => Promise<void>; port: () => number };

const json = (value: unknown) => JSON.stringify(value);
const now = () => Date.now();
const shortCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const validName = (value: unknown) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 24;
const validId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value);
const validCode = (value: unknown) => typeof value === 'string' && /^[A-Z0-9]{6}$/.test(value);

function dataPath() {
  const candidate = process.env.DATA_DIR || (existsSync('/data') ? '/data' : resolve('realtime/data'));
  mkdirSync(candidate, { recursive: true });
  return join(candidate, 'rooms.sqlite');
}

function requestIp(request: IncomingMessage) {
  const forwarded = request.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.socket.remoteAddress || 'unknown';
}

function originAllowed(origin: string | undefined) {
  return !origin || origin === 'https://signal-school.sociobot.in' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function createRealtimeServer(options: RealtimeOptions = {}): RealtimeInstance {
  const databasePath = options.databasePath || dataPath();
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
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

  const rooms = {
    get: db.prepare('SELECT * FROM rooms WHERE code = ?'),
    insert: db.prepare('INSERT INTO rooms (code, scenario, phase, round, delivered, end, note, choices, created_at, updated_at) VALUES (@code, @scenario, @phase, @round, @delivered, @end, @note, @choices, @created_at, @updated_at)'),
    update: db.prepare('UPDATE rooms SET scenario=@scenario, phase=@phase, round=@round, delivered=@delivered, end=@end, note=@note, choices=@choices, updated_at=@updated_at WHERE code=@code')
  };
  const players = {
    list: db.prepare('SELECT * FROM players WHERE room_code = ? ORDER BY is_host DESC, rowid ASC'),
    get: db.prepare('SELECT * FROM players WHERE room_code = ? AND client_id = ?'),
    count: db.prepare('SELECT COUNT(*) AS count FROM players WHERE room_code = ?'),
    insert: db.prepare('INSERT INTO players (room_code, client_id, name, role, connected, is_host) VALUES (?, ?, ?, ?, 1, ?)'),
    connect: db.prepare('UPDATE players SET connected = 1, name = ? WHERE room_code = ? AND client_id = ?'),
    disconnect: db.prepare('UPDATE players SET connected = 0 WHERE room_code = ? AND client_id = ?')
  };
  const connections = new Set<Connection>();
  const buckets = new Map<string, RateBucket>();

  const rateAllowed = (ip: string) => {
    const time = now();
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
  const writeRoom = (room: RoomRow) => rooms.update.run({ ...room, updated_at: now() });
  const reply = (socket: WebSocket, payload: unknown) => { if (socket.readyState === WebSocket.OPEN) socket.send(json(payload)); };
  const error = (socket: WebSocket, message: string) => reply(socket, { type: 'error', message });
  const ownIntel = (role: string, round: number) => {
    const base = roles.find(([name]) => name === role)?.[1] || 'Your role has a partial network view.';
    const roundLines = [
      'This round has two messages and three possible plans.',
      'A status change may make the old plan unreliable.',
      'Use the latest signal before the harbor closes.'
    ];
    return `${base} ${roundLines[Math.min(round, 2)]}`;
  };
  const publicState = (room: RoomRow, player: PlayerRow) => ({
    code: room.code,
    phase: room.phase,
    round: room.round,
    delivered: room.delivered,
    end: room.end,
    players: listPlayers(room.code).map((row) => ({ id: row.client_id, name: row.name, role: row.role, connected: Boolean(row.connected), isHost: Boolean(row.is_host) })),
    ownRole: player.role,
    ownIntel: ownIntel(player.role, room.round),
    choices: { submitted: Boolean(JSON.parse(room.choices)[player.client_id]) },
    note: room.note
  });
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
    const timestamp = now();
    const room: RoomRow = { code, scenario: 0, phase: 'lobby', round: 0, delivered: 0, end: null, note: 'Invite one to three teammates, then start the shared run.', choices: '{}', created_at: timestamp, updated_at: timestamp };
    db.transaction(() => {
      rooms.insert.run(room);
      players.insert.run(code, message.clientId, String(message.name).trim(), roles[0][0], 1);
    })();
    markConnection(connection, code, String(message.clientId));
    broadcast(code);
  };
  const joinRoom = (connection: Connection, message: Record<string, unknown>, allowExisting: boolean) => {
    if (!validId(message.clientId) || !validCode(message.code) || !validName(message.name)) return error(connection.socket, 'Use a six-character room code and a name.');
    const code = String(message.code).toUpperCase();
    const existing = roomFor(code);
    if (!existing) return error(connection.socket, 'That room code does not exist. Ask the host to check the code.');
    const known = players.get.get(code, message.clientId) as PlayerRow | undefined;
    if (!known && !allowExisting && Number((players.count.get(code) as { count: number }).count) >= 4) return error(connection.socket, 'This room already has four players.');
    db.transaction(() => {
      if (known) players.connect.run(String(message.name).trim(), code, message.clientId);
      else {
        const index = Number((players.count.get(code) as { count: number }).count);
        players.insert.run(code, message.clientId, String(message.name).trim(), roles[index][0], 0);
      }
    })();
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
    const selected = required.map((id) => choices[id]);
    if (!selected.every((item) => item === selected[0])) {
      writeRoom({ ...room, choices: json(choices), note: 'Plans differ. Talk through the partial views, then replace your plan.' });
      return broadcast(room.code);
    }
    const delivered = room.delivered + (selected[0] === 'split' ? 2 : selected[0] === 'west' ? 1 : 0);
    const isLast = room.round === 2;
    const next: RoomRow = isLast ? {
      ...room, delivered, phase: 'ended', end: delivered === 6 ? 'won' : 'lost', round: 3, choices: '{}',
      note: delivered === 6 ? 'All six signals arrived. Debrief: use shared feedback before a bottleneck fills.' : 'The storm closed before six signals arrived. Debrief: compare partial views before choosing.'
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
    writeRoom({ ...room, scenario: (room.scenario + 1) % 3, phase: 'lobby', round: 0, delivered: 0, end: null, choices: '{}', note: 'New topology ready. Connect two players, then start the shared run.' });
    broadcast(room.code);
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
    if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true, build: options.buildSha || process.env.BUILD_SHA || 'dev', storage: databasePath.startsWith('/data/') ? '/data' : 'local' });
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
        else error(socket, 'Unknown room action.');
      } catch { error(socket, 'That room message could not be read.'); }
    });
    socket.on('close', () => {
      connections.delete(connection);
      if (connection.code && connection.clientId) {
        players.disconnect.run(connection.code, connection.clientId);
        broadcast(connection.code);
      }
    });
  });
  http.listen(options.port ?? Number(process.env.PORT || 8080));
  return {
    server: http,
    port: () => (http.address() as { port: number }).port,
    close: async () => new Promise((resolveClose, rejectClose) => {
      for (const connection of connections) connection.socket.terminate();
      websocket.close(() => http.close((errorClose) => {
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
