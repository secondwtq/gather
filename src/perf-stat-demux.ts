
import { log } from "./logger.js";
import { average, prettifyArgsArray } from "./utils.js";
import { PerfEvent } from "./perf-event.js";
import { ResultEvent, run as runPerfStat } from "./perf-stat.js";

interface Params {
  repetition: number;
  extraParams: string[];
}

export const defaultParams: Params = {
  // workloads: [],
  // events: [],
  repetition: 3,
  extraParams: []
};

interface EventGroup {
  _name: string;
  events: PerfEvent[];
}

export function createEventGroups(events: PerfEvent[], multiplexCount: number = 4): EventGroup[] {
  const eventGroups: EventGroup[] = [];
  for (let i = 0; i < events.length; i += multiplexCount) {
    const eventGroup = events.slice(i, i + multiplexCount);
    eventGroups.push({
      _name: eventGroup.map((e) => e.eventName).join(", "),
      events: eventGroup,
    });
  }
  return eventGroups;
}

export function createParams(params: { repetition?: number, extraParams?: string[] }): Params {
  return { ... defaultParams, ... params };
}

export async function run(workload: string[], eventGroups: EventGroup[], params: Params) {
  const times: number[] = [];
  const events: ResultEvent[][] = [];
  for (const eventGroup of eventGroups) {
    const exec = await runPerfStat(workload, eventGroup.events, {
      repetition: params.repetition, extraParams: params.extraParams });
    events.push(exec.events);
    times.push(exec.time);
  }
  return {
    time: average(times),
    events: (<ResultEvent[]>[]).concat(... events),
    // TODO: stddev for time
  };
}
