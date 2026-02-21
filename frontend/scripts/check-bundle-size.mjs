import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DIST_ASSETS_DIR = path.resolve("dist/assets");
const MAX_INDEX_RAW_BYTES = Number(process.env.MAX_INDEX_RAW_BYTES ?? 300_000);
const MAX_INDEX_GZIP_BYTES = Number(process.env.MAX_INDEX_GZIP_BYTES ?? 90_000);

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function fail(message) {
  console.error(`bundle:check failed: ${message}`);
  process.exit(1);
}

let assetFiles;
try {
  assetFiles = readdirSync(DIST_ASSETS_DIR);
} catch {
  fail("dist/assets not found. Run `npm run build` first.");
}

const indexFile = assetFiles.find(
  (file) => file.startsWith("index-") && file.endsWith(".js"),
);

if (!indexFile) {
  fail("index-*.js not found in dist/assets.");
}

const indexPath = path.join(DIST_ASSETS_DIR, indexFile);
const rawBytes = statSync(indexPath).size;
const gzipBytes = gzipSync(readFileSync(indexPath)).length;

const overRaw = rawBytes > MAX_INDEX_RAW_BYTES;
const overGzip = gzipBytes > MAX_INDEX_GZIP_BYTES;

console.log(
  [
    `bundle:check index file: ${indexFile}`,
    `bundle:check raw:  ${formatBytes(rawBytes)} (limit ${formatBytes(MAX_INDEX_RAW_BYTES)})`,
    `bundle:check gzip: ${formatBytes(gzipBytes)} (limit ${formatBytes(MAX_INDEX_GZIP_BYTES)})`,
  ].join("\n"),
);

if (overRaw || overGzip) {
  const reasons = [];
  if (overRaw) {
    reasons.push(`raw exceeds limit by ${formatBytes(rawBytes - MAX_INDEX_RAW_BYTES)}`);
  }
  if (overGzip) {
    reasons.push(`gzip exceeds limit by ${formatBytes(gzipBytes - MAX_INDEX_GZIP_BYTES)}`);
  }
  fail(reasons.join("; "));
}

console.log("bundle:check passed.");
