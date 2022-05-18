
import { execa } from "execa";
import log from "loglevel";

interface Workload {
  name: string;
  cmd: string;
}

interface PerfEventNamed {
  kind: "named";
  eventName: string;
}

type PerfEvent = PerfEventNamed;

interface GatherConfig {
  workloads: Workload[];
  events: PerfEvent[];
  eventMultiplexCount?: number;
  repetition?: number;
  extraParams?: string;
}

const defaultGatherConfig = {
  workloads: [],
  events: [],
  eventMultiplexCount: 4,
  repetition: 3,
  extraParams: ""
};

function perfEventToEventSelector(src: PerfEvent): string {
  switch (src.kind) {
    case "named":
      return src.eventName;
  }
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

async function run(config: GatherConfig) {
  log.info("PREPROCESSING");

  let cfg = { ... defaultGatherConfig, ... config };
  const events = cfg.events.map((event) => ({
    ... event, _selector: perfEventToEventSelector(event) }));

  const eventGroups: { _name: string, _selectorArg: string, events: PerfEvent[] }[] = [];
  for (let i = 0;
      i < events.length - cfg.eventMultiplexCount;
      i += cfg.eventMultiplexCount) {
    const eventGroup = config.events.slice(i, i + cfg.eventMultiplexCount)
      .map((event) => ({ ... event, _selector: perfEventToEventSelector(event) }));
    eventGroups.push({
      _name: eventGroup.map((e) => e.eventName).join(", "),
      _selectorArg: eventGroup.map((e) => e._selector).join(","),
      events: eventGroup,
    });
  }

  const prefix = `perf stat -x, -r ${config.repetition} ${config.extraParams} -e `;

  for (const workload of config.workloads) {
    log.info(`WORKLOAD ${workload.name} (${workload.cmd})`);
    for (const eventGroup of eventGroups) {
      log.info(`WORKLOAD ${workload.name} => EVENT group ${eventGroup._name}`);
      const cmdline = `${prefix}${eventGroup._selectorArg} ${workload.cmd}`;
      log.info("CMD", cmdline);
      const exec = await execa(cmdline);
    }
  }
}

run({
  workloads: [
    {
      name: "PythonSieveOneliner",
      cmd: "python -c \"list((i for i in range(2,5120) if i not in [j*k for j in range(2,int(i/2)+1) for k in range(2,min(j+1,int(i/j)+1))]))\"",
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