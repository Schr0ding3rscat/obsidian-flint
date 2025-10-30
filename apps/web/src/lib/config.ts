export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Flint2',
  syncBrokerUrl: import.meta.env.VITE_SYNC_BROKER_URL ?? 'http://localhost:8787',
  mcpBridgeUrl: import.meta.env.VITE_MCP_BRIDGE_WS_URL ?? 'ws://localhost:7331',
  allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  enableOpfs: (import.meta.env.VITE_ENABLE_OPFS ?? '1') === '1',
  encryptionKdf: import.meta.env.VITE_ENCRYPTION_KDF ?? 'argon2id'
} as const;
