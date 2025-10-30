# Flint2 Architecture Overview

Flint2 is a privacy-first Markdown workspace optimised for large vaults, offline-first editing, and trustworthy sync. The current repository contains the initial progressive web application scaffold, based on the defaults from the product brief.

## High-level architecture

- **Apps**: `apps/web` hosts the primary PWA built with React, Vite, and Tailwind CSS.
- **Packages**: shared libraries (crypto/search WASM, editor, graph, canvas, dataview, plugin SDK, etc.) will live in `packages/` as the platform matures.
- **Workers**: compute-heavy features (CRDT merges, indexing, encryption) will run in dedicated Web/Shared Workers bundled alongside feature packages.
- **Storage**: OPFS for vault files, IndexedDB/SQLite WASM for metadata indexes, and File System Access API for desktop-class imports/exports.
- **Sync**: E2EE sync broker (Rust/axum) will expose presigned S3/WebDAV operations. Clients authenticate with device keys and exchange Automerge updates.
- **AI/MCP**: local-first inference via Ollama/LM Studio bridged through MCP WebSockets with strict capability gating.

## Next steps

1. Implement OPFS vault bootstrapper, including CRDT-backed Automerge documents and plaintext exports.
2. Integrate worker-powered Markdown engine (CodeMirror 6) with plugins for tasks, dataview, canvas, and graph visualisation.
3. Add Tantivy/MiniSearch WASM for FTS with incremental indexing pipelines.
4. Ship E2EE key management UI (Argon2id, recovery phrases, secure device onboarding).
5. Build the sync broker, Playwright E2E suite, CSP hardening, and release automation per the specification.
