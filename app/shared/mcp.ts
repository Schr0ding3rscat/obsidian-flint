export type McpConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface McpStatus {
  state: McpConnectionState;
  url: string | null;
  lastError?: string | null;
}

export interface McpMessage {
  direction: "outbound" | "inbound";
  timestamp: number;
  payload: unknown;
}

export interface McpConnectOptions {
  url: string;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export type McpSendPayload = unknown;
