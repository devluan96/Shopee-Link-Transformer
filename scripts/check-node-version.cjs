const [major, minor, patch] = process.versions.node.split(".").map(Number);

if (major < 22) {
  console.error(
    `Node.js ${process.versions.node} is not supported. Please use Node 22.x LTS or newer before running this project.`,
  );
  process.exit(1);
}

if (major >= 23) {
  console.error(
    `Node.js ${process.versions.node} is newer than the pinned supported range for this repo. Please use Node 22.x LTS.`,
  );
  process.exit(1);
}

console.log(`Node.js ${major}.${minor}.${patch} OK`);
