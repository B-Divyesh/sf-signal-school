export type RoomPlayer = { id: string; name: string; role: string; connected: boolean; isHost: boolean };
export type RoomState = {
  code: string;
  phase: 'lobby' | 'active' | 'ended';
  round: number;
  delivered: number;
  end: 'won' | 'lost' | null;
  players: RoomPlayer[];
  ownRole: string;
  ownIntel: string;
  choices: Record<string, string>;
  note: string;
};

type Message = { type: string; [key: string]: unknown };

const roomKey = 'signal-school:room-client';

const clientId = () => {
  let id = localStorage.getItem(roomKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(roomKey, id);
  }
  return id;
};

export class RoomClient {
  private socket: WebSocket | null = null;
  private currentCode = '';
  private name = '';
  private shouldReconnect = true;
  public onState: (state: RoomState) => void = () => undefined;
  public onStatus: (status: string) => void = () => undefined;

  constructor(private readonly url = import.meta.env.VITE_REALTIME_URL || 'wss://signal-school-realtime.sociobot.in/ws') {}

  create(name: string) {
    this.name = name.trim() || 'Signal keeper';
    this.open(() => this.send({ type: 'create', clientId: clientId(), name: this.name }));
  }

  join(code: string, name: string) {
    this.currentCode = code.trim().toUpperCase();
    this.name = name.trim() || 'Signal keeper';
    this.open(() => this.send({ type: 'join', clientId: clientId(), code: this.currentCode, name: this.name }));
  }

  start() { this.send({ type: 'start', clientId: clientId(), code: this.currentCode }); }
  choose(choice: string) { this.send({ type: 'choose', clientId: clientId(), code: this.currentCode, choice }); }
  restart() { this.send({ type: 'restart', clientId: clientId(), code: this.currentCode }); }

  close() {
    this.shouldReconnect = false;
    this.socket?.close();
    this.socket = null;
  }

  private open(afterOpen: () => void) {
    this.shouldReconnect = true;
    this.socket?.close();
    this.onStatus('Connecting to the room service…');
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.addEventListener('open', afterOpen, { once: true });
    socket.addEventListener('message', (event) => this.receive(JSON.parse(String(event.data)) as Message));
    socket.addEventListener('close', () => {
      if (this.shouldReconnect && this.currentCode) {
        this.onStatus('Connection dropped. Rejoining this room…');
        window.setTimeout(() => this.open(() => this.send({ type: 'resume', clientId: clientId(), code: this.currentCode, name: this.name })), 1100);
      }
    });
    socket.addEventListener('error', () => this.onStatus('Room service is unavailable. Try again in a moment.'));
  }

  private send(message: Message) {
    if (typeof message.code === 'string') this.currentCode = message.code;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  private receive(message: Message) {
    if (message.type === 'state') {
      const state = message.state as RoomState;
      this.currentCode = state.code;
      this.onStatus(`Room ${state.code} is connected.`);
      this.onState(state);
    } else if (message.type === 'error') {
      this.onStatus(String(message.message));
    }
  }
}
