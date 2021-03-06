
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
  { kind: Kind.Named, eventName: "PERF_METRICS.FRONTEND_BOUND" },
  { kind: Kind.Named, eventName: "PERF_METRICS.BAD_SPECULATION" },
  { kind: Kind.Named, eventName: "PERF_METRICS.RETIRING" },
  { kind: Kind.Named, eventName: "PERF_METRICS.BACKEND_BOUND" },
  { kind: Kind.Named, eventName: "INT_MISC.UOP_DROPPING" },
  { kind: Kind.Named, eventName: "TOPDOWN.SLOTS:perf_metrics" },
  { kind: Kind.Named, eventName: "PERF_METRICS.FETCH_LATENCY" },
  { kind: Kind.Named, eventName: "ICACHE_DATA.STALLS" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.THREAD" },
  { kind: Kind.Named, eventName: "ICACHE_TAG.STALLS" },
  { kind: Kind.Named, eventName: "INT_MISC.CLEAR_RESTEER_CYCLES" },
  { kind: Kind.Named, eventName: "INT_MISC.UNKNOWN_BRANCH_CYCLES" },
  { kind: Kind.Named, eventName: "PERF_METRICS.BRANCH_MISPREDICTS" },
  { kind: Kind.Named, eventName: "DSB2MITE_SWITCHES.PENALTY_CYCLES" },
  { kind: Kind.Named, eventName: "DECODE.LCP" },
  { kind: Kind.Named, eventName: "IDQ.MS_SWITCHES" },
  { kind: Kind.Named, eventName: "IDQ.MITE_CYCLES_ANY" },
  { kind: Kind.Named, eventName: "IDQ.MITE_CYCLES_OK" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.DISTRIBUTED" },
  { kind: Kind.Named, eventName: "IDQ.DSB_CYCLES_ANY" },
  { kind: Kind.Named, eventName: "IDQ.DSB_CYCLES_OK" },
  { kind: Kind.Named, eventName: "LSD.CYCLES_ACTIVE" },
  { kind: Kind.Named, eventName: "LSD.CYCLES_OK" },
  { kind: Kind.Named, eventName: "PERF_METRICS.MEMORY_BOUND" },
  { kind: Kind.Named, eventName: "EXE_ACTIVITY.BOUND_ON_LOADS" },
  { kind: Kind.Named, eventName: "MEMORY_ACTIVITY.STALLS_L1D_MISS" },
  { kind: Kind.Named, eventName: "DTLB_LOAD_MISSES.STLB_HIT:c1" },
  { kind: Kind.Named, eventName: "DTLB_LOAD_MISSES.WALK_ACTIVE" },
  { kind: Kind.Named, eventName: "CYCLE_ACTIVITY.CYCLES_MEM_ANY" },
  { kind: Kind.Named, eventName: "MEMORY_ACTIVITY.CYCLES_L1D_MISS" },
  { kind: Kind.Named, eventName: "L1D_PEND_MISS.FB_FULL" },
  { kind: Kind.Named, eventName: "MEMORY_ACTIVITY.STALLS_L2_MISS" },
  { kind: Kind.Named, eventName: "MEMORY_ACTIVITY.STALLS_L3_MISS" },
  { kind: Kind.Named, eventName: "OFFCORE_REQUESTS_OUTSTANDING.ALL_DATA_RD:c4" },
  { kind: Kind.Named, eventName: "OFFCORE_REQUESTS_OUTSTANDING.CYCLES_WITH_DATA_RD" },
  { kind: Kind.Named, eventName: "EXE_ACTIVITY.BOUND_ON_STORES" },
  { kind: Kind.Named, eventName: "ARITH.DIVIDER_ACTIVE" },
  { kind: Kind.Named, eventName: "CYCLE_ACTIVITY.STALLS_TOTAL" },
  { kind: Kind.Named, eventName: "EXE_ACTIVITY.3_PORTS_UTIL:u0x80" },
  { kind: Kind.Named, eventName: "EXE_ACTIVITY.1_PORTS_UTIL" },
  { kind: Kind.Named, eventName: "EXE_ACTIVITY.2_PORTS_UTIL:u0xc" },
  { kind: Kind.Named, eventName: "RESOURCE_STALLS.SCOREBOARD" },
  { kind: Kind.Named, eventName: "PERF_METRICS.HEAVY_OPERATIONS" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.SCALAR_SINGLE" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.SCALAR_DOUBLE" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.128B_PACKED_DOUBLE" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.128B_PACKED_SINGLE" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.256B_PACKED_DOUBLE" },
  { kind: Kind.Named, eventName: "FP_ARITH_INST_RETIRED.256B_PACKED_SINGLE" },
  { kind: Kind.Named, eventName: "MEM_UOP_RETIRED.ANY" },
  { kind: Kind.Named, eventName: "INST_RETIRED.NOP" },
  { kind: Kind.Named, eventName: "UOPS_RETIRED.MS" },
  { kind: Kind.Named, eventName: "INST_RETIRED.ANY" },
  { kind: Kind.Named, eventName: "UOPS_EXECUTED.THREAD" },
  { kind: Kind.Named, eventName: "UOPS_EXECUTED.CORE_CYCLES_GE_1" },
  { kind: Kind.Named, eventName: "MEM_INST_RETIRED.ALL_LOADS_PS" },
  { kind: Kind.Named, eventName: "MEM_INST_RETIRED.ALL_STORES_PS" },
  { kind: Kind.Named, eventName: "BR_INST_RETIRED.ALL_BRANCHES" },
  { kind: Kind.Named, eventName: "BR_INST_RETIRED.NEAR_CALL" },
  { kind: Kind.Named, eventName: "BR_INST_RETIRED.NEAR_TAKEN" },
  { kind: Kind.Named, eventName: "LSD.UOPS" },
  { kind: Kind.Named, eventName: "IDQ.DSB_UOPS" },
  { kind: Kind.Named, eventName: "IDQ.MITE_UOPS" },
  { kind: Kind.Named, eventName: "IDQ.MS_UOPS" },
  { kind: Kind.Named, eventName: "BR_MISP_RETIRED.ALL_BRANCHES" },
  { kind: Kind.Named, eventName: "L1D_PEND_MISS.PENDING" },
  { kind: Kind.Named, eventName: "MEM_LOAD_COMPLETED.L1_MISS_ANY" },
  { kind: Kind.Named, eventName: "L1D_PEND_MISS.PENDING_CYCLES" },
  { kind: Kind.Named, eventName: "MEM_LOAD_RETIRED.L1_MISS_PS" },
  { kind: Kind.Named, eventName: "MEM_LOAD_RETIRED.L2_MISS_PS" },
  { kind: Kind.Named, eventName: "L2_RQSTS.MISS" },
  { kind: Kind.Named, eventName: "L2_RQSTS.REFERENCES" },
  { kind: Kind.Named, eventName: "MEM_LOAD_RETIRED.L3_MISS_PS" },
  { kind: Kind.Named, eventName: "ITLB_MISSES.WALK_PENDING" },
  { kind: Kind.Named, eventName: "DTLB_LOAD_MISSES.WALK_PENDING" },
  { kind: Kind.Named, eventName: "DTLB_STORE_MISSES.WALK_PENDING" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.REF_TSC" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.ONE_THREAD_ACTIVE" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.REF_DISTRIBUTED" },
  { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.THREAD_P" },
  { kind: Kind.Named, eventName: "BR_INST_RETIRED.FAR_BRANCH_PS:USER" },
  { kind: Kind.Named, eventName: "MEM_LOAD_RETIRED.FB_HIT_PS" },
  { kind: Kind.Named, eventName: "UOPS_ISSUED.ANY" },
  // { kind: Kind.Named, eventName: "CPU_CLK_UNHALTED.THREAD_P:SUP" },
  // { kind: Kind.Named, eventName: "INST_RETIRED.ANY_P:SUP" },
  // { kind: Kind.Named, eventName: "UNC_ARB_TRK_REQUESTS.ALL" },
  // { kind: Kind.Named, eventName: "UNC_ARB_COH_TRK_REQUESTS.ALL" },
  // { kind: Kind.Named, eventName: "UNC_PKG_ENERGY_STATUS" },
  // { kind: Kind.Named, eventName: "UNC_CLOCK.SOCKET" },
];

(async () => {
  const eventGroups = createEventGroups(EVENTS);
  const result = await asyncMapSequence(async (workload) => [
    workload.name, await run(workload.cmd, eventGroups, defaultParams) ], WORKLOADS);
  console.log(JSON.stringify(result, null, 2));
})();
