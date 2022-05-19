
import { log } from "./logger.js";
import { prettifyArgsArray, stringifyJSON } from "./utils.js";
import { PerfEvent } from "./perf-event.js";
import { runPerfStat } from "./perf-stat.js";

interface Workload {
  name: string;
  cmd: string[];
}

interface GatherConfig {
  workloads: Workload[];
  events: PerfEvent[];
  eventMultiplexCount?: number;
  repetition?: number;
  extraParams?: string[];
}

const defaultGatherConfig = {
  workloads: [],
  events: [],
  eventMultiplexCount: 4,
  repetition: 3,
  extraParams: []
};

async function run(config: GatherConfig) {
  log.info("PREPROCESSING");

  let cfg = { ... defaultGatherConfig, ... config };

  const eventGroups: { _name: string, events: PerfEvent[] }[] = [];
  for (let i = 0; i < cfg.events.length; i += cfg.eventMultiplexCount) {
    const eventGroup = config.events.slice(i, i + cfg.eventMultiplexCount);
    eventGroups.push({
      _name: eventGroup.map((e) => e.eventName).join(", "),
      events: eventGroup,
    });
  }

  for (const workload of cfg.workloads) {
    log.info(`WORKLOAD ${workload.name} (${prettifyArgsArray(workload.cmd)})`);
    for (const eventGroup of eventGroups) {
      log.info(`WORKLOAD ${workload.name} => EVENT group ${eventGroup._name}`);
      const exec = await runPerfStat(workload.cmd, eventGroup.events, { repetition: cfg.repetition, extraParams: cfg.extraParams });
      console.log(exec);
    }
  }
}

run({
  workloads: [
    {
      name: "PythonHelloWorld",
      cmd: ["python", "-c", "print(\"Hello World!\")"],
    },
    {
      name: "PythonSieveOneliner",
      cmd: ["python", "-c", "list((i for i in range(2,5120) if i not in [j*k for j in range(2,int(i/2)+1) for k in range(2,min(j+1,int(i/j)+1))]))"],
    },
  ],
  events: [
    { kind: "named", eventName: "cycles" },
    { kind: "named", eventName: "instructions" },
    { kind: "named", eventName: "Br_Inst_Retired.All_Branches" },
    { kind: "named", eventName: "Br_Misp_Retired.All_Branches" },
    { kind: "named", eventName: "Br_Misp_Retired.All_Branches" },
    { kind: "named", eventName: "Br_Inst_Retired.Near_Call" },
    { kind: "named", eventName: "Frontend_Retired.DSB_Miss" },
    { kind: "named", eventName: "IDQ.DSB_Cycles" },
    { kind: "named", eventName: "IDQ.MITE_Cycles" },
    { kind: "named", eventName: "IDQ.MS_Cycles" },
  ],
});