import {
  DONATEX_SIGNALR_BASE,
  PING_INTERVAL_MS,
  CONNECTION_TIMEOUT_MS,
  RECONNECT_DELAY_MS,
} from './constants';
import { pushDonation, DonatexDonation } from './dashboard-feed';

type WsConnection = Awaited<ReturnType<(typeof network.websocket)['connect']>>;

const RECORD_SEPARATOR = String.fromCharCode(30);

type SignalRMessage = {
  type?: number;
  target?: string;
  arguments?: Record<string, any>[];
};

type DonationCreatedPayload = {
  id: string;
  username?: string;
  name?: string;
  amount: number;
  currency: string;
  message?: string;
};

export type ConnectionState = 'offline' | 'connecting' | 'online' | 'error';

export class DonatexSignalRClient {
  private connection: WsConnection | null = null;
  private destroyed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageTime = 0;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private accessToken = '';
  private _state: ConnectionState = 'offline';
  private onStateChange: ((state: ConnectionState) => void) | null = null;

  get state(): ConnectionState {
    return this._state;
  }

  setOnStateChange(handler: (state: ConnectionState) => void) {
    this.onStateChange = handler;
  }

  private setState(state: ConnectionState) {
    this._state = state;
    this.onStateChange?.(state);
  }

  private parseMessage(raw: string): SignalRMessage | null {
    try {
      const data = raw.replace(RECORD_SEPARATOR, '');
      return JSON.parse(data) as SignalRMessage;
    } catch {
      return null;
    }
  }

  private sendObject(data: Record<string, unknown>) {
    const conn = this.connection;
    if (!conn || conn.state !== 1) return;
    conn.Send(`${JSON.stringify(data)}${RECORD_SEPARATOR}`);
  }

  private handleMessage(raw: string) {
    const msg = this.parseMessage(raw);
    if (!msg) return;

    if (msg.type === 1 && msg.target === 'DonationCreated') {
      const data = msg.arguments?.[0] as DonationCreatedPayload | undefined;
      if (!data || !data.id) return;

      void pushDonation({
        id: data.id,
        username: data.username || data.name || 'Anonymous',
        currency: data.currency || 'USD',
        amount: data.amount || 0,
        message: data.message,
      });
    }
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.sendObject({ type: 6 });
    }, PING_INTERVAL_MS);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private startHealthCheck() {
    this.stopHealthCheck();
    this.lastMessageTime = Date.now();
    this.healthCheckTimer = setInterval(() => {
      if (Date.now() - this.lastMessageTime > CONNECTION_TIMEOUT_MS) {
        console.warn('[Donatex] Health check failed, reconnecting');
        this.setState('error');
        this.destroyConnection(this.connection);
        this.connection = null;
        this.scheduleReconnect();
      }
    }, 5000);
  }

  private stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  get connected(): boolean {
    return !!(
      this.connection &&
      this.connection.state === 1 &&
      !this.destroyed
    );
  }

  async start(token: string) {
    const trimmed = token.trim();
    if (!trimmed) return;

    if (this.accessToken === trimmed && this.connected) return;

    this.stop();
    this.destroyed = false;
    this.accessToken = trimmed;
    this.setState('connecting');
    await this.doConnect();
  }

  stop() {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    this.stopHealthCheck();
    this.destroyConnection(this.connection);
    this.connection = null;
    this.setState('offline');
  }

  private async waitOpen(ws: WsConnection): Promise<void> {
    if (ws.state === 1) return;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket open timeout'));
      }, 15000);

      ws.On('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      if (ws.state === 1) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      ws.On('error', () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error before open'));
      });
    });
  }

  private async doConnect() {
    if (this.destroyed || !this.accessToken) return;

    try {
      const wsUrl = DONATEX_SIGNALR_BASE.replace('https://', 'wss://');
      const url = `${wsUrl}?access_token=${encodeURIComponent(this.accessToken)}`;
      const ws = await network.websocket.connect(url);

      if (this.destroyed) {
        ws.Destroy();
        return;
      }

      this.destroyConnection(this.connection);
      this.connection = ws;

      await this.waitOpen(ws);

      if (this.destroyed) {
        return;
      }

      ws.On('message', (raw: string) => {
        if (this.destroyed || this.connection !== ws) return;
        this.lastMessageTime = Date.now();
        this.handleMessage(raw);
      });

      ws.On('close', () => {
        if (!this.destroyed && this.connection === ws) {
          this.setState('offline');
          this.scheduleReconnect();
        }
      });

      ws.On('error', () => {
      });

      this.sendObject({ protocol: 'json', version: 1 });
      this.lastMessageTime = Date.now();
      this.startPing();
      this.startHealthCheck();
      this.setState('online');
    } catch {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return;

    this.stopPing();
    this.stopHealthCheck();
    this.destroyConnection(this.connection);
    this.connection = null;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.setState('connecting');
      void this.doConnect();
    }, RECONNECT_DELAY_MS);
  }

  private destroyConnection(connection: WsConnection | null) {
    if (!connection) return;
    try {
      connection.Destroy();
    } catch {
    }
  }
}
