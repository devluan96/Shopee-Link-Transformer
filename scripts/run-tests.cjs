const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ts = require("typescript");

const repoRoot = process.cwd();
const tempRoot = path.join(repoRoot, ".tmp-test-build");
const sourceRoots = ["api", "server", "tests/api"];
const compiledTests = [];

const removeDir = (target) => {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

const ensureDir = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const transpileFile = (sourcePath) => {
  const relPath = path.relative(repoRoot, sourcePath);
  const outputPath = path.join(tempRoot, relPath).replace(/\.ts$/, ".js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      isolatedModules: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: sourcePath,
  });

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, result.outputText, "utf8");

  if (relPath.startsWith(path.join("tests", "api")) && outputPath.endsWith(".test.js")) {
    compiledTests.push(outputPath);
  }
};

const walk = (dirPath) => {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.endsWith(".bak")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".ts")) {
      transpileFile(fullPath);
    }
  }
};

removeDir(tempRoot);
ensureDir(tempRoot);
fs.writeFileSync(
  path.join(tempRoot, "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
  "utf8",
);

for (const root of sourceRoots) {
  walk(path.join(repoRoot, root));
}

let hasFailure = false;
for (const testFile of compiledTests) {
  const result = spawnSync(process.execPath, [testFile], {
    cwd: tempRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    hasFailure = true;
  }
}

removeDir(tempRoot);
process.exit(hasFailure ? 1 : 0);
