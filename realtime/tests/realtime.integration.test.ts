import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { afterEach, expect, test } from 'vitest';
import { createRealtimeServer, type RealtimeInstance } from '../src/server';

type State = {
  code: string; scenarioName: string; topology: string; phase: string; round: number; delivered: number; end: string | null;
  ownRole: string; ownIntel: string; roundGoal: string; plans: Array<{ id: string; label: string }>; players: Array<{ id: string; connected: boolean; role: string }>;
};
type Client = {
  socket: WebSocket; states: State[]; errors: string[]; deleted: string[];
  wait: (predicate: (state: State) => boolean) => Promise<State>; send: (message: object) => void; close: () => Promise<void>;
};

const active: Array<{ instance: RealtimeInstance; directory: string }> = [];
afterEach(async () => {
  await Promise.all(active.splice(0).map(async ({ instance, directory }) => { await instance.close(); await rm(directory, { recursive: true, force: true }); }));
});

async function setup(now?: () => number) {
  const directory = await mkdtemp(join(tmpdir(), 'signal-school-'));
  const instance = createRealtimeServer({ port: 0, databasePath: join(directory, 'rooms.sqlite'), buildSha: 'test-sha', now });
  await once(instance.server, 'listening');
  active.push({ instance, directory });
  return { instance, directory, url: `ws://127.0.0.1:${instance.port()}/ws` };
}

async function client(url: string): Promise<Client> {
  const socket = new WebSocket(url);
  const states: State[] = [];
  const errors: string[] = [];
  const deleted: string[] = [];
  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw)) as { type: string; state?: State; message?: string };
    if (message.type === 'state' && message.state) states.push(message.state);
    if (message.type === 'error') errors.push(message.message || 'Unknown error');
    if (message.type === 'deleted') deleted.push(message.message || 'Room deleted');
  });
  await once(socket, 'open');
  const wait = async (predicate: (state: State) => boolean) => {
    const until = Date.now() + 3000;
    while (Date.now() < until) {
      const state = [...states].reverse().find(predicate);
      if (state) return state;
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    throw new Error(`No matching state. Seen: ${JSON.stringify(states)}`);
  };
  return { socket, states, errors, deleted, wait, send: (message) => socket.send(JSON.stringify(message)), close: () => new Promise((resolve) => { socket.once('close', () => resolve()); socket.close(); }) };
}

async function agree(first: Client, second: Client, code: string, scenarioName: string, choices: string[], expected: 'won' | 'lost') {
  await first.wait((state) => state.phase === 'active' && state.round === 0 && state.scenarioName === scenarioName);
  for (let round = 0; round < choices.length; round += 1) {
    first.send({ type: 'choose', clientId: '11111111-1111-4111-8111-111111111111', code, choice: choices[round] });
    second.send({ type: 'choose', clientId: '22222222-2222-4222-8222-222222222222', code, choice: choices[round] });
    await first.wait((state) => state.scenarioName === scenarioName && (round === 2 ? state.phase === 'ended' && state.end === expected : state.phase === 'active' && state.round === round + 1));
  }
}

test('@claim:two-to-four-players @claim:room-persistence supports player limits, reconnects, and durable room state', async () => {
  const { instance, directory, url } = await setup();
  const firstId = '11111111-1111-4111-8111-111111111111';
  const secondId = '22222222-2222-4222-8222-222222222222';
  const first = await client(url);
  first.send({ type: 'create', clientId: firstId, name: 'Ari' });
  const created = await first.wait((state) => state.phase === 'lobby' && state.players.length === 1);
  const second = await client(url);
  second.send({ type: 'join', clientId: secondId, code: created.code, name: 'Bo' });
  const joined = await second.wait((state) => state.players.length === 2);
  expect(joined.ownRole).toBe('Weather reader');
  expect(joined.ownIntel).toContain('East has no fog mark');
  expect(joined.ownIntel).not.toContain('West has one free slot');

  const third = await client(url);
  const fourth = await client(url);
  const fifth = await client(url);
  third.send({ type: 'join', clientId: '33333333-3333-4333-8333-333333333333', code: created.code, name: 'Cy' });
  fourth.send({ type: 'join', clientId: '44444444-4444-4444-8444-444444444444', code: created.code, name: 'Dee' });
  const fourPlayers = await first.wait((state) => state.players.length === 4);
  expect(new Set(fourPlayers.players.map((player) => player.id)).size).toBe(4);
  fifth.send({ type: 'join', clientId: '55555555-5555-4555-8555-555555555555', code: created.code, name: 'Eve' });
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(fifth.errors).toContain('This room already has four players.');
  await third.close();
  await fourth.close();
  await fifth.close();

  await second.close();
  await first.wait((state) => state.players.some((player) => player.id === secondId && !player.connected));
  const rejoined = await client(url);
  rejoined.send({ type: 'resume', clientId: secondId, code: created.code, name: 'Bo' });
  await rejoined.wait((state) => state.players.some((player) => player.id === secondId && player.connected));

  first.send({ type: 'start', clientId: firstId, code: created.code });
  await agree(first, rejoined, created.code, 'Tide Lines', ['split', 'west', 'hold'], 'won');
  first.send({ type: 'restart', clientId: firstId, code: created.code });
  const fog = await rejoined.wait((state) => state.phase === 'lobby' && state.scenarioName === 'Fog Junction');
  expect(fog.ownRole).toBe('Harbor clerk');
  expect(fog.ownIntel).toContain('Neither notice can wait');
  expect(fog.plans.map((plan) => plan.label)).toEqual(['Share the triangle', 'Use the south leg', 'Wait for visibility']);

  first.send({ type: 'start', clientId: firstId, code: created.code });
  await agree(first, rejoined, created.code, 'Fog Junction', ['west', 'hold', 'split'], 'won');
  first.send({ type: 'restart', clientId: firstId, code: created.code });
  const headland = await rejoined.wait((state) => state.phase === 'lobby' && state.scenarioName === 'Headland Loop');
  expect(headland.ownRole).toBe('Signal keeper');
  expect(headland.ownIntel).toContain('one pulse away');
  first.send({ type: 'start', clientId: firstId, code: created.code });
  await agree(first, rejoined, created.code, 'Headland Loop', ['split', 'split', 'split'], 'lost');

  await first.close();
  await rejoined.close();
  await instance.close();
  active.splice(active.findIndex((entry) => entry.instance === instance), 1);
  const resumed = createRealtimeServer({ port: 0, databasePath: join(directory, 'rooms.sqlite'), buildSha: 'test-sha' });
  await once(resumed.server, 'listening');
  active.push({ instance: resumed, directory });
  const persistence = await fetch(`http://127.0.0.1:${resumed.port()}/rooms/${created.code}`);
  expect(await persistence.json()).toEqual({ exists: true });
  const health = await fetch(`http://127.0.0.1:${resumed.port()}/health`);
  expect(await health.json()).toMatchObject({ ok: true, build: 'test-sha' });
});

test('@claim:room-retention deletes inactive room data after 24 hours', async () => {
  let time = 1_000;
  const { instance, directory, url } = await setup(() => time);
  const host = await client(url);
  host.send({ type: 'create', clientId: '11111111-1111-4111-8111-111111111111', name: 'Ari' });
  const created = await host.wait((state) => state.phase === 'lobby');
  host.send({ type: 'delete', clientId: '11111111-1111-4111-8111-111111111111', code: created.code });
  const deletedUntil = Date.now() + 1000;
  while (host.deleted.length === 0 && Date.now() < deletedUntil) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(host.deleted[0]).toContain('deleted this room');
  expect((await fetch(`http://127.0.0.1:${instance.port()}/rooms/${created.code}`)).status).toBe(404);
  await host.close();

  const expiryHost = await client(url);
  expiryHost.send({ type: 'create', clientId: '22222222-2222-4222-8222-222222222222', name: 'Bo' });
  const expiring = await expiryHost.wait((state) => state.phase === 'lobby');
  await expiryHost.close();
  await instance.close();
  active.splice(active.findIndex((entry) => entry.instance === instance), 1);
  time += 24 * 60 * 60 * 1000 + 1;
  const restarted = createRealtimeServer({ port: 0, databasePath: join(directory, 'rooms.sqlite'), buildSha: 'test-sha', now: () => time });
  await once(restarted.server, 'listening');
  active.push({ instance: restarted, directory });
  expect((await fetch(`http://127.0.0.1:${restarted.port()}/rooms/${expiring.code}`)).status).toBe(404);
});

test('@claim:room-rate-limit returns 429 and Retry-After for room HTTP and connection limits, while open rooms receive a readable wait message', async () => {
  const { url } = await setup();
  const established = await client(url);
  for (let count = 0; count < 42; count += 1) established.send({ type: 'unknown' });
  const waitUntil = Date.now() + 1000;
  while (!established.errors.some((message) => message.includes('Rate limit exceeded')) && Date.now() < waitUntil) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(established.socket.readyState).toBe(WebSocket.OPEN);
  expect(established.errors.some((message) => /Rate limit exceeded\. Try again in \d+ seconds\./.test(message))).toBe(true);
  await established.close();

  const base = url.replace('ws://', 'http://').replace('/ws', '');
  let response: Response | undefined;
  for (let count = 0; count < 42; count += 1) response = await fetch(`${base}/rooms/AAAAAA`);
  expect(response?.status).toBe(429);
  expect(Number(response?.headers.get('retry-after'))).toBeGreaterThan(0);

  const connectionHeaders = { 'x-forwarded-for': '198.18.0.22' };
  const connections = await Promise.all(Array.from({ length: 40 }, async () => {
    const socket = new WebSocket(url, { headers: connectionHeaders });
    await once(socket, 'open');
    return socket;
  }));
  const limited = new WebSocket(url, { headers: connectionHeaders });
  const [, response429] = await once(limited, 'unexpected-response') as [unknown, import('node:http').IncomingMessage];
  expect(response429.statusCode).toBe(429);
  expect(Number(response429.headers['retry-after'])).toBeGreaterThan(0);
  connections.forEach((socket) => socket.close());
});
