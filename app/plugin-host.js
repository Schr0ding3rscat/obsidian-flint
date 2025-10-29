const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { EventEmitter } = require("events");

class PluginHost extends EventEmitter {
  constructor(vaultManager) {
    super();
    this.vault = vaultManager;
    this.commands = new Map();
    this.plugins = new Map();
  }

  getPluginDirectory() {
    return path.join(this.vault.getVaultPath(), "plugins");
  }

  loadAll() {
    const pluginDir = this.getPluginDirectory();
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    this.commands.clear();
    this.plugins.clear();

    const pluginFolders = fs
      .readdirSync(pluginDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const folder of pluginFolders) {
      try {
        this.loadPlugin(folder);
      } catch (err) {
        console.error(`Failed to load plugin ${folder}`, err);
      }
    }
  }

  loadPlugin(folder) {
    const pluginDir = path.join(this.getPluginDirectory(), folder);
    const manifestPath = path.join(pluginDir, "manifest.json");
    const entryPath = path.join(pluginDir, "main.js");

    if (!fs.existsSync(manifestPath) || !fs.existsSync(entryPath)) {
      throw new Error("Plugin missing manifest.json or main.js");
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const code = fs.readFileSync(entryPath, "utf8");

    const sandbox = this.#createSandbox(folder, manifest);
    const script = new vm.Script(code, {
      filename: `${folder}/main.js`,
    });

    const context = vm.createContext(sandbox);
    script.runInContext(context);

    if (typeof sandbox.exports?.onload === "function") {
      sandbox.exports.onload();
    }

    this.plugins.set(folder, {
      manifest,
      context,
      sandbox,
    });
  }

  unloadPlugin(folder) {
    const plugin = this.plugins.get(folder);
    if (!plugin) return;

    if (typeof plugin.sandbox.exports?.onunload === "function") {
      plugin.sandbox.exports.onunload();
    }

    for (const [commandId, command] of this.commands) {
      if (command.plugin === folder) {
        this.commands.delete(commandId);
      }
    }

    this.plugins.delete(folder);
  }

  reloadPlugin(folder) {
    this.unloadPlugin(folder);
    this.loadPlugin(folder);
  }

  getCommands() {
    return Array.from(this.commands.values()).map((command) => ({
      id: command.id,
      name: command.name,
      plugin: command.plugin,
    }));
  }

  executeCommand(commandId) {
    const command = this.commands.get(commandId);
    if (command) {
      command.callback();
    }
  }

  #createSandbox(folder, manifest) {
    const host = this;
    const vault = this.vault;
    const module = { exports: {} };
    const api = {
      app: {
        getVaultPath() {
          return vault.getVaultPath();
        },
        registerCommand(command) {
          if (
            !command?.id ||
            !command?.name ||
            typeof command?.callback !== "function"
          ) {
            throw new Error("Invalid command registration");
          }
          host.commands.set(command.id, {
            ...command,
            plugin: folder,
          });
        },
        showNotice(message) {
          host.emit("notice", {
            message,
            plugin: folder,
          });
        },
      },
      vault: {
        listNotes() {
          return vault.listNotes();
        },
        read(pathLike) {
          return vault.readNote(pathLike);
        },
        write(pathLike, content) {
          vault.writeNote(pathLike, content);
        },
        rename(oldPath, newPath) {
          vault.renameNote(oldPath, newPath);
        },
        delete(pathLike) {
          vault.deleteNote(pathLike);
        },
      },
      exports: module.exports,
      console,
      require: (moduleId) => {
        if (moduleId.startsWith(".")) {
          const resolved = path.join(
            this.getPluginDirectory(),
            folder,
            moduleId,
          );
          return require(resolved);
        }
        return require(moduleId);
      },
      module,
      Buffer,
      setTimeout,
      clearTimeout,
    };

    api.exports = module.exports;
    return api;
  }
}

module.exports = PluginHost;
