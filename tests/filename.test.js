const assert = require("assert");
const {
  buildPngName,
  formatTimestamp,
  nextAvailableName,
  sanitizeBaseName,
} = require("../filename");

const fixedDate = new Date(2026, 9, 13, 9, 8, 7);

assert.strictEqual(formatTimestamp(fixedDate), "20261013_090807");
assert.strictEqual(
  sanitizeBaseName(" character:walk?.psd "),
  "character_walk_"
);
assert.strictEqual(
  buildPngName("hero.psd", fixedDate),
  "hero_20261013_090807.png"
);
assert.strictEqual(
  nextAvailableName("hero.psd", [], fixedDate),
  "hero_20261013_090807.png"
);
assert.strictEqual(
  nextAvailableName(
    "hero.psd",
    [
      "hero_20261013_090807.png",
      "hero_20261013_090807_001.png",
    ],
    fixedDate
  ),
  "hero_20261013_090807_002.png"
);

console.log("filename tests passed");
