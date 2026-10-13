const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

const statusIndex = html.indexOf('id="status"');
const exportButtonIndex = html.indexOf('id="export-png"');

assert.ok(statusIndex >= 0, "status element must exist");
assert.ok(exportButtonIndex >= 0, "export button must exist");
assert.ok(
  statusIndex < exportButtonIndex,
  "export status must appear before the export button so it is not clipped below the panel"
);

const panel = manifest.entrypoints.find(
  (entrypoint) => entrypoint.id === "quickPngPanel"
);
assert.ok(panel, "quickPngPanel entrypoint must exist");
assert.ok(
  panel.minimumSize.height >= 220,
  "panel minimum height must leave room for the visible export status"
);

console.log("ui layout regression test passed");
