import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { afterEach, expect, test } from 'vitest';
import { createRealtimeServer, type RealtimeInstance } from '../src/server';

type State = { code: string; phase: string; round: number; delivered: number; end: string | null; ownRole: string; ownIntel: string; players: Array<{ id: string; connected: boolean }> };
type Client = { socket: WebSocket; states: State[]; errors: string[]; wait: (predicate: (state: State) => boolean) => Promise<State>; send: (message: object) => void; close: () => Promise<void> };

const active: Array<{ instance: RealtimeInstance; directory: string }> = [];
afterEach(async () => {
  await Promise.all(active.splice(0).map(async ({ instance, directory }) => { await instance.close(); await rm(directory, { recursive: true, force: true }); }));
});

async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'signal-school-'));
  const instance = createRealtimeServer({ port: 0, databasePath: join(directory, 'rooms.sqlite'), buildSha: 'test-sha' });
  await once(instance.server, 'listening');
  active.push({ instance, directory });
  return { instance, directory, url: `ws://127.0.0.1:${instance.port()}/ws` };
}

async function client(url: string): Promise<Client> {
  const socket = new WebSocket(url);
  const states: State[] = [];
  const errors: string[] = [];
  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw)) as { type: string; state?: State; message?: string };
    if (message.type === 'state' && message.state) states.push(message.state);
    if (message.type === 'error') errors.push(message.message || 'Unknown error');
  });
  await once(socket, 'open');
  const wait = async (predicate: (state: State) => boolean) => {
    const until = Date.now() + 2500;
    while (Date.now() < until) {
      const state = [...states].reverse().find(predicate);
      if (state) return state;
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    throw new Error(`No matching state. Seen: ${JSON.stringify(states)}`);
  };
  return { socket, states, errors, wait, send: (message) => socket.send(JSON.stringify(message)), close: () => new Promise((resolve) => { socket.once('close', () => resolve()); socket.close(); }) };
}

test('@claim:online-rooms independent clients receive partial views, agree outcomes, reconnect, persist, and restart', async () => {
  const { instance, directory, url } = await setup();
  const firstId = '11111111-1111-4111-8111-111111111111';
  const secondId = '22222222-2222-4222-8222-222222222222';
  const first = await client(url);
  first.send({ type: 'create', clientId: firstId, name: 'Ari' });
  const created = await first.wait((state) => state.phase === 'lobby' && state.players.length === 1);
  const second = await client(url);
  second.send({ type: 'join', clientId: secondId, code: created.code, name: 'Bo' });
  const firstWithTeammate = await first.wait((state) => state.players.length === 2);
  const secondWithTeammate = await second.wait((state) => state.players.length === 2);
  expect(firstWithTeammate.ownRole).not.toBe(secondWithTeammate.ownRole);
  expect(firstWithTeammate.ownIntel).toContain('West relay capacity');
  expect(secondWithTeammate.ownIntel).toContain('weather marks');
  expect(secondWithTeammate.ownIntel).not.toContain('West relay capacity');

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
  await first.wait((state) => state.phase === 'active' && state.round === 0);
  for (let round = 0; round < 3; round += 1) {
    first.send({ type: 'choose', clientId: firstId, code: created.code, choice: 'split' });
    rejoined.send({ type: 'choose', clientId: secondId, code: created.code, choice: 'split' });
    await first.wait((state) => round === 2 ? state.phase === 'ended' && state.end === 'won' : state.phase === 'active' && state.round === round + 1);
  }
  const won = await rejoined.wait((state) => state.phase === 'ended');
  expect(won.delivered).toBe(6);
  first.send({ type: 'restart', clientId: firstId, code: created.code });
  const restarted = await rejoined.wait((state) => state.phase === 'lobby' && state.delivered === 0);
  expect(restarted.round).toBe(0);

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

test('@claim:room-rate-limit returns 429 and Retry-After after the allowance', async () => {
  const { url } = await setup();
  const base = url.replace('ws://', 'http://').replace('/ws', '');
  let response: Response | undefined;
  for (let count = 0; count < 42; count += 1) response = await fetch(`${base}/rooms/AAAAAA`);
  expect(response?.status).toBe(429);
  expect(Number(response?.headers.get('retry-after'))).toBeGreaterThan(0);
});
