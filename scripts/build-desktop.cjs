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
const nsisWebDir = path.join(releaseDir, "nsis-web");
const unpackedDir = path.join(releaseDir, "win-unpacked");
const zipName = `hotsnew-click-${rootPkg.version}-win-unpacked.zip`;
const zipPath = path.join(releaseDir, zipName);
const publicDownloadsDir = path.join(repoRoot, "public", "downloads");
const desktopAppPackageUrl = process.env.DESKTOP_APP_PACKAGE_URL || "";

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

const syncPublicDownloads = () => {
  fs.mkdirSync(publicDownloadsDir, { recursive: true });

  const desktopArtifacts = [
    {
      from: path.join(nsisWebDir, `hotsnew-click-setup-${rootPkg.version}-x64.exe`),
      to: `hotsnew-click-setup-${rootPkg.version}-x64.exe`,
    },
    {
      from: path.join(nsisWebDir, "latest.yml"),
      to: "latest.yml",
    },
  ];

  for (const artifact of desktopArtifacts) {
    if (!fs.existsSync(artifact.from)) {
      continue;
    }
    fs.copyFileSync(artifact.from, path.join(publicDownloadsDir, artifact.to));
  }

  const staleLocalPackage = path.join(
    publicDownloadsDir,
    `hotsnew-click-desktop-${rootPkg.version}-x64.nsis.7z`,
  );
  if (fs.existsSync(staleLocalPackage)) {
    fs.rmSync(staleLocalPackage, { force: true });
  }

  const stalePortable = path.join(
    publicDownloadsDir,
    `hotsnew-click-portable-${rootPkg.version}-x64.exe`,
  );
  if (fs.existsSync(stalePortable)) {
    fs.rmSync(stalePortable, { force: true });
  }
};

if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

appPkg.version = rootPkg.version;
fs.writeFileSync(appPkgPath, `${JSON.stringify(appPkg, null, 2)}\n`);

run(process.execPath, [path.join(repoRoot, "scripts", "generate-windows-icon.cjs")]);

const electronBuilderArgs = ["--win", "nsis-web", "portable"];
if (desktopAppPackageUrl) {
  electronBuilderArgs.push(`-c.nsisWeb.appPackageUrl=${desktopAppPackageUrl}`);
}

run(electronBuilder, electronBuilderArgs, {
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
});

if (fs.existsSync(unpackedDir)) {
  run(sevenZip, ["a", "-tzip", zipPath, ".\\release\\win-unpacked\\*"]);
  console.log(`Desktop app archive created: ${zipPath}`);
}

syncPublicDownloads();
console.log(`Public downloads synced: ${publicDownloadsDir}`);

console.log(`Unpacked app directory: ${unpackedDir}`);
