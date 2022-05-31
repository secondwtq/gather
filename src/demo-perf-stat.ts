
import { Selector } from "./perf-event.js";
import { run, createParams } from "./perf-stat.js";
import { CoreID } from "./PerfEventDB/Intel/Common.js";
import { getOrLoadEventSet } from "./PerfEventDB/Intel/MapFile.js";
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

const eventSet = await getOrLoadEventSet(CoreID.SKL);

const EVENTS: Selector[] = [
  { event: eventSet.eventNameToDescMap.get("INST_RETIRED.ANY")!, annotations: [] },
  { event: eventSet.eventNameToDescMap.get("IDQ.DSB_CYCLES")!, annotations: [] },
];

const params = createParams(EVENTS);
const result = await asyncMapSequence(async (workload) => [
  workload.name, await run(workload.cmd, params) ], WORKLOADS);
console.dir(result, { depth: 5 });
