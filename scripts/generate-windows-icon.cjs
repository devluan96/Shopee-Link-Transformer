const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const sourcePng = path.join(repoRoot, "public", "logo-app-512.png");
const outputDir = path.join(repoRoot, "desktop-assets");
const outputIco = path.join(outputDir, "icon.ico");

const pngBuffer = fs.readFileSync(sourcePng);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);
entry.writeUInt8(0, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(pngBuffer.length, 8);
entry.writeUInt32LE(6 + 16, 12);

fs.writeFileSync(outputIco, Buffer.concat([header, entry, pngBuffer]));

console.log(`Windows icon created: ${outputIco}`);
