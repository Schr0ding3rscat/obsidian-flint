# Flint2 Packages

This folder will host reusable packages for the Flint2 platform, including:

- `core-wasm`: WebAssembly bundles for cryptography, CRDTs, and search.
- `ui`: Shared component library.
- `editor`: CodeMirror 6 configuration and Markdown extensions.
- `graph`: Graph visualisation harness.
- `canvas`: Collaborative canvas and tldraw integrations.
- `dataview`: Query compiler targeting IndexedDB/SQLite WASM.
- `plugin-sdk`: Worker-based plugin runtime utilities.
- `sync-client`: Client E2EE sync adapters.
- `theme-default`: Design tokens and theming primitives.

Each package will be published as part of the pnpm workspace when implemented.
