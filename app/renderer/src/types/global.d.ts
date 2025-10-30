import type { WorkspaceState } from "@shared/workspace";
import type { McpConnectOptions, McpMessage, McpStatus, McpSendPayload } from "@shared/mcp";

declare global {
  interface Window {
    workspaceAPI?: {
      loadState?: () => Promise<WorkspaceState>;
      saveState?: (state: WorkspaceState) => Promise<WorkspaceState | void>;
      onStateUpdated?: (listener: (state: WorkspaceState) => void) => () => void;
    };
    mcpAPI?: {
      connect?: (options: McpConnectOptions) => Promise<{ status: McpStatus; messages: McpMessage[] }>;
      disconnect?: () => Promise<{ status: McpStatus; messages: McpMessage[] }>;
      getStatus?: () => Promise<{ status: McpStatus; messages: McpMessage[] }>;
      send?: (payload: McpSendPayload) => Promise<McpMessage>;
      onStatus?: (listener: (status: McpStatus) => void) => () => void;
      onMessage?: (listener: (message: McpMessage) => void) => () => void;
      onHistory?: (listener: (messages: McpMessage[]) => void) => () => void;
    };
  }
}

export {};
