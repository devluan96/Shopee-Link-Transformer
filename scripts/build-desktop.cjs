const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const rootPkg = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);
const appPkgPath = path.join(repoRoot, "electron-app", "package.json");
const appPkg = JSON.parse(fs.readFileSync(appPkgPath, "utf8"));

const electronBuilder =
  process.platform === "win32"
    ? path.join(repoRoot, "node_modules", ".bin", "electron-builder.cmd")
    : path.join(repoRoot, "node_modules", ".bin", "electron-builder");

const sevenZip =
  process.platform === "win32"
    ? path.join(
        repoRoot,
        "node_modules",
        "7zip-bin",
        "win",
        "x64",
        "7za.exe",
      )
    : "7za";

const releaseDir = path.join(repoRoot, "release");
const unpackedDir = path.join(releaseDir, "win-unpacked");
const zipName = `hotsnew-click-${rootPkg.version}-win-unpacked.zip`;
const zipPath = path.join(releaseDir, zipName);

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(
    process.platform === "win32" ? "cmd.exe" : command,
    process.platform === "win32" ? ["/c", command, ...args] : args,
    {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
    },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${path.basename(command)} exited with code ${result.status}`);
  }
};

if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

appPkg.version = rootPkg.version;
fs.writeFileSync(appPkgPath, `${JSON.stringify(appPkg, null, 2)}\n`);

run(process.execPath, [path.join(repoRoot, "scripts", "generate-windows-icon.cjs")]);

const electronBuilderArgs = ["--win", "nsis", "portable"];

run(electronBuilder, electronBuilderArgs, {
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
});

if (fs.existsSync(unpackedDir)) {
  run(sevenZip, ["a", "-tzip", zipPath, ".\\release\\win-unpacked\\*"]);
  console.log(`Desktop app archive created: ${zipPath}`);
}

console.log(`Unpacked app directory: ${unpackedDir}`);
