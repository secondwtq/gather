
import { execa } from "execa";
import { log } from "./logger.js";
import { PerfEvent, perfEventToEventSelector } from "./perf-event.js";
import { prettifyArgsArray } from "./utils.js";
import { hrtime } from "process";
import Papa from "papaparse";

export interface Params {
  repetition?: number;
  extraParams?: string[];
}

const defaultParams = {
  repetition: 3,
  extraParams: [],
};

export interface Result {
  // in ms
  time: number;
  events: ResultEvent[];
}

export interface ResultEvent {
  event: PerfEvent,
  // Note double value is not good for ints larger than Number.MAX_SAFE_INTEGER
  // which is about 9000 T
  value: number,
  stddev: number,
}

// Output example:
// 318.27,msec,task-clock,0.20%,318265453,100.00,0.996,CPUs utilized
// 0,,context-switches,0.00%,318265453,100.00,0.000,/sec
// 0,,cpu-migrations,0.00%,318265453,100.00,0.000,/sec
// 10795,,page-faults,0.45%,318265453,100.00,33.838,K/sec
// 1268672031,,cycles,0.19%,318266377,100.00,3.977,GHz
// 1357264067,,instructions,0.02%,318266377,100.00,1.07,insn per cycle
// 257946046,,branches,0.02%,318266377,100.00,808.561,M/sec
// 7054000,,branch-misses,0.08%,318266377,100.00,2.73,of all branches
export async function run(
    cmd: string[],
    events: PerfEvent[],
    params: Params = { }): Promise<Result> {
  const paramsCanon = { ... defaultParams, ... params };
  const args = ["stat", "-x,", "-r", paramsCanon.repetition.toString(), ... paramsCanon.extraParams, "-e", events.map(perfEventToEventSelector).join(","), ... cmd];
  log.info(`CMD perf ${prettifyArgsArray(args)}`);
  const startTime = hrtime.bigint();
  const exec = await execa("perf", args);
  // TODO: this time is only an estimation
  const timeDelta = Number((hrtime.bigint() - startTime) / BigInt(paramsCanon.repetition) / 1000n) / 1000.0;

  // TODO: direct perf output to a file
  const csvParseResult: Papa.ParseResult<any> = Papa.parse(exec.stderr);
  return {
    time: timeDelta,
    events: csvParseResult.data.map((value: any, index) => ({
      event: events[index],
      value: parseInt(value[0]),
      stddev: paramsCanon.repetition <= 1 ? 0 : parseFloat(value[3].slice(0, value[3].length - 1)),
    }))
  };
}
