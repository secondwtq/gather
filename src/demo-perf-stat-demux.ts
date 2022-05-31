
import { Kind, PerfEventNamed } from "./perf-event.js";
import { run, defaultParams, createEventGroups } from "./perf-stat-demux.js";
import { asyncMapSequence } from "./utils.js";

const WORKLOADS = [
  {
    name: "PythonHelloWorld",
    cmd: ["python", "-c", "print(\"Hello World!\")"],
  },
  {
    name: "PythonSieveOneliner",
    cmd: ["python", "-c", "list((i for i in range(2,5120) if i not in [j*k for j in range(2,int(i/2)+1) for k in range(2,min(j+1,int(i/j)+1))]))"],
  },
];

const EVENTS: PerfEventNamed[] = [
  { kind: Kind.Named, eventName: "cycles" },
  { kind: Kind.Named, eventName: "instructions" },
  { kind: Kind.Named, eventName: "Br_Inst_Retired.All_Branches" },
  { kind: Kind.Named, eventName: "Br_Misp_Retired.All_Branches" },
  { kind: Kind.Named, eventName: "Br_Inst_Retired.Near_Call" },
  { kind: Kind.Named, eventName: "Frontend_Retired.DSB_Miss" },
  { kind: Kind.Named, eventName: "IDQ.DSB_Cycles" },
  { kind: Kind.Named, eventName: "IDQ.MITE_Cycles" },
  { kind: Kind.Named, eventName: "IDQ.MS_Cycles" },
];

(async () => {
  const eventGroups = createEventGroups(EVENTS);
  const result = await asyncMapSequence(async (workload) => [
    workload.name, await run(workload.cmd, eventGroups, defaultParams) ], WORKLOADS);
  console.log(JSON.stringify(result, null, 2));
})();
