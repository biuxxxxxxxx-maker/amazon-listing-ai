import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , ...args] = process.argv;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configDir = path.join(root, ".wrangler-local", "config");
const cacheDir = path.join(root, ".wrangler-local", "cache");
const stateDir = path.join(root, ".wrangler-local", "state");

mkdirSync(configDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });
mkdirSync(stateDir, { recursive: true });

const [tool, ...toolArgs] = args;
const command =
  process.platform === "win32"
    ? "cmd.exe"
    : path.join(root, "node_modules", ".bin", tool);
const commandArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", path.join(root, "node_modules", ".bin", `${tool}.cmd`), ...toolArgs]
    : toolArgs;

const child = spawn(command, commandArgs, {
  cwd: root,
  env: {
    ...process.env,
    XDG_CONFIG_HOME: configDir,
    XDG_CACHE_HOME: cacheDir,
    XDG_STATE_HOME: stateDir,
  },
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
