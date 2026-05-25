import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import { existsSync } from "node:fs";
import { join } from "node:path";

const port = process.env.E2E_PORT || "3100";
const baseUrl = `http://127.0.0.1:${port}`;
const root = process.cwd();
const passthroughArgs = process.argv.slice(2);
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const playwrightBin = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "playwright.cmd" : "playwright",
);

if (!existsSync(nextBin)) {
  console.error("Next.js is not installed. Run npm install first.");
  process.exit(1);
}

if (!existsSync(playwrightBin)) {
  console.error("Playwright is not installed. Run npm install and npx playwright install chromium first.");
  process.exit(1);
}

const server = spawn(
  process.execPath,
  [nextBin, "dev", "--hostname", "127.0.0.1", "--port", port],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    detached: process.platform !== "win32",
  },
);

let shuttingDown = false;

function stopServer() {
  if (shuttingDown || server.exitCode !== null) {
    return;
  }

  shuttingDown = true;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}

process.on("exit", stopServer);
process.on("SIGINT", () => {
  stopServer();
  process.exit(130);
});
process.on("SIGTERM", () => {
  stopServer();
  process.exit(143);
});

try {
  await waitForServer(baseUrl, 120_000);

  const testCommand = process.platform === "win32" ? "cmd.exe" : playwrightBin;
  const testArgs =
    process.platform === "win32"
      ? [
          "/d",
          "/s",
          "/c",
          [quoteForCmd(playwrightBin), "test", ...passthroughArgs.map(quoteForCmd)].join(" "),
        ]
      : ["test", ...passthroughArgs];
  const testRun = spawn(testCommand, testArgs, {
    cwd: root,
    env: {
      ...process.env,
      E2E_EXTERNAL_SERVER: "1",
      E2E_PORT: port,
    },
    stdio: "inherit",
    shell: false,
  });

  const exitCode = await waitForExit(testRun);
  stopServer();
  process.exit(exitCode);
} catch (error) {
  stopServer();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await canReach(url)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function canReach(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode ? response.statusCode < 500 : false);
    });

    request.setTimeout(2_000, () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => resolve(false));
  });
}

function quoteForCmd(value) {
  const text = String(value);
  return /[\s&()^|<>"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
