
import fetch from "node-fetch";
import Papa from "papaparse";
import { PERFMON_URL_ROOT } from "../Intel/MapFile.js";

const TMA_CSV_PATH = "TMA_Metrics.csv";

export async function fetchTMACSV(): Promise<string[][]> {
  const TMA_CSV_URL = new URL(TMA_CSV_PATH, PERFMON_URL_ROOT);
  const csvText = await (await fetch(TMA_CSV_URL.toString())).text();
  return Papa.parse(csvText).data as string[][];
}
