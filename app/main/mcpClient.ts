import { EventEmitter } from "node:events";
import WebSocket from "ws";
import { McpConnectOptions, McpMessage, McpSendPayload, McpStatus } from "../shared/mcp";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export declare interface McpClient {
  on(event: "status", listener: (status: McpStatus) => void): this;
  on(event: "message", listener: (message: McpMessage) => void): this;
  off(event: "status", listener: (status: McpStatus) => void): this;
  off(event: "message", listener: (message: McpMessage) => void): this;
}

export class McpClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private status: McpStatus = { state: "disconnected", url: null, lastError: null };
  private messages: McpMessage[] = [];

  getStatus(): McpStatus {
    return { ...this.status };
  }

  getMessages(): McpMessage[] {
    return [...this.messages];
  }

  async connect(options: McpConnectOptions): Promise<McpStatus> {
    const targetUrl = this.normalizeUrl(options.url);

    if (this.socket) {
      this.disconnect();
    }

    this.setStatus({ state: "connecting", url: targetUrl.toString(), lastError: null });

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(targetUrl, {
        headers: options.headers
      });

      const handleError = (error: Error) => {
        if (socket.readyState !== WebSocket.OPEN) {
          this.setStatus({ state: "error", url: targetUrl.toString(), lastError: error.message });
          reject(error);
        } else {
          this.setStatus({ state: "error", url: targetUrl.toString(), lastError: error.message });
        }
      };

      socket.once("error", handleError);

      socket.once("open", () => {
        this.socket = socket;
        this.setStatus({ state: "connected", url: targetUrl.toString(), lastError: null });

        socket.off("error", handleError);
        socket.on("error", (error: Error) => {
          this.setStatus({ state: "error", url: targetUrl.toString(), lastError: error.message });
        });

        socket.on("close", () => {
          this.socket = null;
          this.setStatus({ state: "disconnected", url: null, lastError: this.status.lastError ?? null });
        });

        socket.on("message", (data: WebSocket.RawData) => {
          const payload = this.parseMessage(data);
          const entry: McpMessage = {
            direction: "inbound",
            timestamp: Date.now(),
            payload
          };
          this.messages.push(entry);
          this.emit("message", entry);
        });

        if (options.metadata && isRecord(options.metadata) && Object.keys(options.metadata).length > 0) {
          try {
            this.send({ type: "metadata", metadata: options.metadata });
          } catch (error) {
            this.setStatus({ state: "error", url: targetUrl.toString(), lastError: (error as Error).message });
          }
        }

        resolve(this.getStatus());
      });
    });
  }

  disconnect(): McpStatus {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.terminate();
      this.socket = null;
    }
    this.setStatus({ state: "disconnected", url: null, lastError: this.status.lastError ?? null });
    return this.getStatus();
  }

  send(payload: McpSendPayload): McpMessage {
    if (!this.socket || this.status.state !== "connected") {
      throw new Error("Unable to send message: MCP client is not connected");
    }

    const serialized = this.serializePayload(payload);
    this.socket.send(serialized);

    const entry: McpMessage = {
      direction: "outbound",
      timestamp: Date.now(),
      payload
    };
    this.messages.push(entry);
    this.emit("message", entry);

    return entry;
  }

  private serializePayload(payload: McpSendPayload): string {
    if (typeof payload === "string") {
      return payload;
    }

    try {
      return JSON.stringify(payload);
    } catch (error) {
      throw new Error(`Unable to serialize payload: ${(error as Error).message}`);
    }
  }

  private parseMessage(data: WebSocket.RawData): unknown {
    if (typeof data === "string") {
      return this.tryParseJson(data);
    }

    if (Buffer.isBuffer(data)) {
      const text = data.toString("utf-8");
      return this.tryParseJson(text);
    }

    return data;
  }

  private tryParseJson(value: string): unknown {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  private setStatus(status: Partial<McpStatus>): void {
    this.status = {
      state: status.state ?? this.status.state,
      url: status.url ?? this.status.url ?? null,
      lastError: status.lastError ?? null
    };
    this.emit("status", this.getStatus());
  }

  private normalizeUrl(input: string): URL {
    const url = new URL(input);
    if (!LOCAL_HOSTNAMES.has(url.hostname) && !url.hostname.endsWith(".local")) {
      throw new Error("MCP connections must target a local server");
    }
    if (url.protocol !== "ws:" && url.protocol !== "wss:") {
      throw new Error("MCP connections require a ws or wss protocol");
    }
    return url;
  }
}
