const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const problems = [];
const definitions = [...(manifest.icons || [])];

for (const panel of manifest.entrypoints.filter((entry) => entry.type === "panel")) {
  if (!Array.isArray(panel.icons) || panel.icons.length === 0) {
    problems.push(`${panel.id}: no Photoshop panel icons declared`);
  } else {
    definitions.push(...panel.icons);
  }
}

let checked = 0;
for (const icon of definitions) {
  const extension = path.extname(icon.path);
  const base = icon.path.slice(0, -extension.length);
  // Photoshop resolves scale:[1,2] to @1x/@2x, not the unsuffixed preview.
  // Adobe: Photoshop UXP > Miscellaneous > Plugin Icons, "Scaling".
  for (const scale of icon.scale || [1]) {
    const relative = `${base}@${scale}x${extension}`;
    const filename = path.join(root, relative);
    if (!fs.existsSync(filename)) {
      problems.push(`${relative}: missing scaled icon`);
      continue;
    }
    const bytes = fs.readFileSync(filename);
    if (bytes.length < 33 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      problems.push(`${relative}: not a PNG`);
      continue;
    }
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width !== icon.width * scale || height !== icon.height * scale) {
      problems.push(`${relative}: ${width}x${height}, expected ${icon.width * scale}x${icon.height * scale}`);
    }
    if (bytes[24] !== 8 || ![2, 6].includes(bytes[25])) {
      problems.push(`${relative}: must be 8-bit RGB or RGBA, not grayscale/indexed`);
    }
    checked += 1;
  }
}

assert.deepEqual(problems, [], problems.join("\n"));
console.log(`Photoshop scaled icon assets passed (${checked} PNG files)`);
