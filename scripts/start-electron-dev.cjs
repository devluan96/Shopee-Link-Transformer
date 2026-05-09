const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const devUrl = process.env.ELECTRON_START_URL || "http://localhost:5173";
const maxAttempts = 60;
const intervalMs = 1000;

const waitForDevServer = (attempt = 1) =>
  new Promise((resolve, reject) => {
    const req = http.get(devUrl, (res) => {
      res.resume();
      if (res.statusCode && res.statusCode < 500) {
        resolve();
        return;
      }

      if (attempt >= maxAttempts) {
        reject(
          new Error(`Dev server did not become ready at ${devUrl} in time.`),
        );
        return;
      }

      setTimeout(
        () => resolve(waitForDevServer(attempt + 1)),
        intervalMs,
      );
    });

    req.on("error", () => {
      if (attempt >= maxAttempts) {
        reject(new Error(`Cannot reach dev server at ${devUrl}.`));
        return;
      }

      setTimeout(
        () => resolve(waitForDevServer(attempt + 1)),
        intervalMs,
      );
    });
  });

async function main() {
  await waitForDevServer();

  const electronCmd =
    process.platform === "win32" ? "node_modules\\.bin\\electron.cmd" : "node_modules/.bin/electron";

  const child = spawn(electronCmd, ["."], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ELECTRON_START_URL: devUrl,
    },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
