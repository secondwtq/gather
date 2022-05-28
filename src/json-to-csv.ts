
import Papa from "papaparse";
import { Result } from "./perf-stat.js";
import { perfEventToHumanName } from "./perf-event.js";
import { infiniteLoop } from "./utils.js";
import fs from "fs/promises";

function convertPerfStatResultToKV(src: Result): { [key: string]: any } {
  const ret: { [key: string]: any } = { };
  ret["time"] = src.time;
  for (const event of src.events) {
    var humanName = perfEventToHumanName(event.event);
    ret[humanName] = event.value;
    ret[humanName + " stddev"] = event.stddev;
  }
  return ret;
}

function convertWorkloadStatPairToKV(src: [string, Result]): { [key: string]: any } {
  const ret: { [key: string]: any } = convertPerfStatResultToKV(src[1]);
  ret["Name"] = src[0];
  return ret;
}

function convertWorkloadStatPairsToCSV(src: [string, Result][]): string {
  return Papa.unparse(src.map(convertWorkloadStatPairToKV));
}

const _global: any = global
_global.convertWorkloadStatPairsToCSV = convertWorkloadStatPairsToCSV;
_global.fs = fs;

// fs.readFile("test/test4-2.json").then(x => console.log(convertWorkloadStatPairsToCSV(JSON.parse(x))))
infiniteLoop();
