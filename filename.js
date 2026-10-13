function stripExtension(name) {
  const value = String(name || "").trim();
  const dot = value.lastIndexOf(".");
  return dot > 0 ? value.slice(0, dot) : value;
}

function sanitizeBaseName(name) {
  const base = stripExtension(name)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return base || "untitled";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTimestamp(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) {
    throw new TypeError("Invalid date");
  }

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join("") + "_" + [
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join("");
}

function normalizeExtension(extension) {
  const value = String(extension || "png").replace(/^\./, "").toLowerCase();
  return /^[a-z0-9]+$/.test(value) ? value : "png";
}

function buildExportName(documentName, extension, date) {
  return `${sanitizeBaseName(documentName)}_${formatTimestamp(date)}.${normalizeExtension(extension)}`;
}

function buildPngName(documentName, date) {
  return buildExportName(documentName, "png", date);
}

function nextAvailableName(documentName, existingNames, date, extension = "png") {
  const existing = new Set(
    (existingNames || []).map((name) => String(name).toLocaleLowerCase())
  );
  const normalizedExtension = normalizeExtension(extension);
  const initial = buildExportName(documentName, normalizedExtension, date);

  if (!existing.has(initial.toLocaleLowerCase())) {
    return initial;
  }

  const base = initial.slice(0, -(normalizedExtension.length + 1));
  let index = 1;
  let candidate = `${base}_${String(index).padStart(3, "0")}.${normalizedExtension}`;

  while (existing.has(candidate.toLocaleLowerCase())) {
    index += 1;
    candidate = `${base}_${String(index).padStart(3, "0")}.${normalizedExtension}`;
  }

  return candidate;
}

module.exports = {
  buildPngName,
  buildExportName,
  formatTimestamp,
  normalizeExtension,
  nextAvailableName,
  sanitizeBaseName,
  stripExtension,
};
