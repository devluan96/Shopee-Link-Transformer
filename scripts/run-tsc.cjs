const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const path = require("node:path");

const requireFromHere = createRequire(__filename);
const tscEntry = requireFromHere.resolve("typescript/lib/tsc.js");

const result = spawnSync(process.execPath, [tscEntry, "--noEmit"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
