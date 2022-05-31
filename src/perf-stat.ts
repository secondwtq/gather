
import { execa } from "execa";
import { log } from "./logger.js";
import { prettifyArgsArray, SampledValueOrdered } from "./utils.js";
import Papa from "papaparse";
import { Selector, selectorToPerfEventSelector } from "./perf-event.js";
import Config from "./Config.js";

interface PreprocessedEvent {
  event: Selector;
  eventSelectorStr: string;
}

export interface Params {
  events: PreprocessedEvent[],
  repetition: number;
  extraParams: string[];
}

const defaultParams = {
  repetition: 3,
  extraParams: [],
};

export interface ResultEvent extends SampledValueOrdered {
  event: Selector,
  // Note double value is not good for ints larger than Number.MAX_SAFE_INTEGER
  // which is about 9000 T
}

export function createParams(events: Selector[], opts: { repetition?: number, extraParams?: string[] } = { }): Params {
  return {
    events: events.map((event) => ({
      event: event,
      eventSelectorStr: selectorToPerfEventSelector(event),
    })),
    ...defaultParams,
    ... opts,
  };
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
    params: Params): Promise<ResultEvent[]> {
  const paramsCanon = { ... defaultParams, ... params };
  const args = ["stat", "-x,", ... paramsCanon.extraParams, "-e", params.events.map((event) => event.eventSelectorStr).join(","), ... cmd];
  log.info(`CMD ${Config.linuxPerfPath} ${prettifyArgsArray(args)}`);
  const results: number[][] = Array.from(new Array(params.events.length), () => []);
  for (let i = 0; i < params.repetition; i++) {
    // TODO: direct perf output to a file
    const exec = await execa(Config.linuxPerfPath, args);
    const csvParseResult: Papa.ParseResult<any> = Papa.parse(exec.stderr);
    csvParseResult.data.forEach((data, index) =>
      results[index].push(parseInt(data[0])));
  }
  return params.events.map((value: any, index) => ({
      event: params.events[index].event,
      rawValues: results[index],
  }));
}
