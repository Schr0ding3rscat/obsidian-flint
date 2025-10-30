import { FormEvent, useMemo, useState } from "react";
import type { McpConnectOptions, McpMessage, McpStatus } from "@shared/mcp";

interface McpConsoleProps {
  status: McpStatus;
  messages: McpMessage[];
  pending: boolean;
  onConnect: (options: McpConnectOptions) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSend: (payload: unknown) => Promise<void>;
}

function formatTimestamp(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}

function stringifyPayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export default function McpConsole({ status, messages, pending, onConnect, onDisconnect, onSend }: McpConsoleProps): JSX.Element {
  const [url, setUrl] = useState("ws://127.0.0.1:4000");
  const [metadata, setMetadata] = useState("{}");
  const [input, setInput] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  const isConnected = status.state === "connected";

  const connectionLabel = useMemo(() => {
    switch (status.state) {
      case "connecting":
        return "Connecting";
      case "connected":
        return "Connected";
      case "error":
        return "Error";
      default:
        return "Disconnected";
    }
  }, [status.state]);

  const handleConnect = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const parsedMetadata = metadata.trim() ? JSON.parse(metadata) : undefined;
      const options: McpConnectOptions = {
        url: url.trim(),
        metadata: parsedMetadata
      };
      await onConnect(options);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    try {
      const payload = input.trim().startsWith("{") || input.trim().startsWith("[") ? JSON.parse(input) : input;
      await onSend(payload);
      setInput("{}");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="mcp-console" aria-label="Local MCP connection">
      <header className="mcp-console__header">
        <div className={`mcp-console__status mcp-console__status--${status.state}`}>
          <span className="mcp-console__status-indicator" aria-hidden="true" />
          <span>{connectionLabel}</span>
          {status.url && <span className="mcp-console__status-url">{status.url}</span>}
        </div>
        <div className="mcp-console__actions">
          {isConnected ? (
            <button type="button" className="mcp-console__button" onClick={handleDisconnect} disabled={pending}>
              Disconnect
            </button>
          ) : (
            <button type="submit" form="mcp-connect" className="mcp-console__button" disabled={pending}>
              Connect
            </button>
          )}
        </div>
      </header>

      <form id="mcp-connect" className="mcp-console__form" onSubmit={handleConnect}>
        <label className="mcp-console__label">
          Endpoint URL
          <input
            type="url"
            className="mcp-console__input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="ws://127.0.0.1:4000"
            required
            pattern="wss?:\/\/.*"
          />
        </label>
        <label className="mcp-console__label">
          Metadata (JSON)
          <textarea
            className="mcp-console__textarea"
            value={metadata}
            onChange={(event) => setMetadata(event.target.value)}
            rows={3}
          />
        </label>
      </form>

      <form className="mcp-console__form" onSubmit={handleSend}>
        <label className="mcp-console__label">
          Payload
          <textarea
            className="mcp-console__textarea"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder='{"type":"prompt","data":{"text":"Hello"}}'
            disabled={!isConnected}
          />
        </label>
        <button type="submit" className="mcp-console__button mcp-console__button--primary" disabled={!isConnected || pending}>
          Send
        </button>
      </form>

      {error || status.lastError ? (
        <div className="mcp-console__error" role="status">
          {error ?? status.lastError}
        </div>
      ) : null}

      <div className="mcp-console__log" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p className="mcp-console__empty">No MCP traffic recorded yet.</p>
        ) : (
          messages
            .slice()
            .reverse()
            .map((message, index) => (
              <article key={`${message.timestamp}-${index}`} className={`mcp-console__entry mcp-console__entry--${message.direction}`}>
                <header>
                  <span className="mcp-console__entry-direction">{message.direction === "outbound" ? "Sent" : "Received"}</span>
                  <time dateTime={new Date(message.timestamp).toISOString()}>{formatTimestamp(message.timestamp)}</time>
                </header>
                <pre>{stringifyPayload(message.payload)}</pre>
              </article>
            ))
        )}
      </div>
    </section>
  );
}
