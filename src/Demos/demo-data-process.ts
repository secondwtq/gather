
import { exportAsSheetLegacy } from "./perf-stat-demux.js";

const inputChunks: Buffer[] = [];

process.stdin.resume();
process.stdin.setEncoding('utf-8');

process.stdin.on('data', (chunk) => {
    inputChunks.push(chunk);
});

process.stdin.on('end', () => {
  const jsonText = inputChunks.join("");
  const data = JSON.parse(jsonText);
  exportAsSheetLegacy(data);
});
