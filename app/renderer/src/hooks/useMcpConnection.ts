import { useCallback, useEffect, useMemo, useState } from "react";
import type { McpConnectOptions, McpMessage, McpStatus, McpSendPayload } from "@shared/mcp";

const DEFAULT_STATUS: McpStatus = { state: "disconnected", url: null, lastError: null };
const MAX_MESSAGES = 200;

function isLocalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname.endsWith(".local");
  } catch {
    return false;
  }
}

function normalizeMessages(entries: McpMessage[]): McpMessage[] {
  return entries
    .filter((entry) => entry && typeof entry === "object")
    .slice(-MAX_MESSAGES);
}

export interface UseMcpConnectionResult {
  status: McpStatus;
  messages: McpMessage[];
  pending: boolean;
  connect: (options: McpConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (payload: McpSendPayload) => Promise<McpMessage | null>;
}

export function useMcpConnection(): UseMcpConnectionResult {
  const [status, setStatus] = useState<McpStatus>(DEFAULT_STATUS);
  const [messages, setMessages] = useState<McpMessage[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const api = window.mcpAPI;
    if (!api?.getStatus) {
      return;
    }

    let cancelled = false;

    api
      .getStatus()
      .then((snapshot) => {
        if (cancelled || !snapshot) {
          return;
        }
        setStatus(snapshot.status ?? DEFAULT_STATUS);
        setMessages(normalizeMessages(snapshot.messages ?? []));
      })
      .catch((error) => {
        console.warn("Failed to load MCP status", error);
      });

    const unsubscribers: Array<() => void> = [];

    if (api.onStatus) {
      unsubscribers.push(
        api.onStatus((next) => {
          setStatus(next);
        })
      );
    }

    if (api.onMessage) {
      unsubscribers.push(
        api.onMessage((message) => {
          setMessages((prev) => normalizeMessages([...prev, message]));
        })
      );
    }

    if (api.onHistory) {
      unsubscribers.push(
        api.onHistory((history) => {
          setMessages(normalizeMessages(history));
        })
      );
    }

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const connect = useCallback(async (options: McpConnectOptions) => {
    const api = window.mcpAPI;
    if (!api?.connect) {
      throw new Error("MCP bridge is unavailable in this environment");
    }

    if (!isLocalUrl(options.url)) {
      throw new Error("Only local MCP endpoints are supported");
    }

    setPending(true);
    try {
      const snapshot = await api.connect(options);
      setStatus(snapshot.status ?? DEFAULT_STATUS);
      setMessages(normalizeMessages(snapshot.messages ?? []));
    } finally {
      setPending(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const api = window.mcpAPI;
    if (!api?.disconnect) {
      return;
    }
    setPending(true);
    try {
      const snapshot = await api.disconnect();
      setStatus(snapshot.status ?? DEFAULT_STATUS);
      setMessages(normalizeMessages(snapshot.messages ?? []));
    } finally {
      setPending(false);
    }
  }, []);

  const send = useCallback(async (payload: McpSendPayload) => {
    const api = window.mcpAPI;
    if (!api?.send) {
      return null;
    }

    try {
      const message = await api.send(payload);
      setMessages((prev) => normalizeMessages([...prev, message]));
      return message;
    } catch (error) {
      console.warn("Failed to send MCP payload", error);
      return null;
    }
  }, []);

  return useMemo(
    () => ({ status, messages, pending, connect, disconnect, send }),
    [status, messages, pending, connect, disconnect, send]
  );
}
