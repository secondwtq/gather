

import fetch from "node-fetch";
import Papa from "papaparse";
import { log } from "../../logger.js";
import { enumValues } from "../../utils.js";
import { CoreID, coreIDToDomain } from "./Common.js";
import { Key, load, store } from "../../PersistentStorage.js";
import { PerfEvent } from "../../perf-event.js";
import { EventSet } from "../EventSet.js";

interface EventSetDesc {
  ModelInMap: string;
}

enum EventType {
  Core = "core",
  HybridCore = "hybridcore",
  Uncore = "uncore",
}

enum CoreRole {
  None = "",
  Core = "Core",
  Atom = "Atom",
}

interface MapFileKey {
  model: string;
  eventType: EventType;
  coreRole: CoreRole;
}

// Example:
// {
//   "EventCode": "0x11",
//   "UMask": "0x04",
//   "EventName": "ITLB_MISSES.WALK_COMPLETED_2M_4M",
//   "BriefDescription": "Code miss in all TLB levels causes a page walk that completes. (2M/4M)",
//   "Counter": "0,1,2,3",
//   "PEBScounters": "0,1,2,3",
//   "SampleAfterValue": "100003",
//   "MSRIndex": "0x00",
//   "MSRValue": "0x00",
//   "CollectPEBSRecord": "2",
//   "TakenAlone": "0",
//   "CounterMask": "0",
//   "Invert": "0",
//   "EdgeDetect": "0",
//   "PEBS": "0",
//   "Data_LA": "0",
//   "L1_Hit_Indication": "0",
//   "Errata": "null",
//   "Offcore": "0",
//   "Speculative": "1"
// },
interface EventDescRaw {
  EventCode: string;
  UMask: string;
  EventName: string;
  BriefDescription: string;
  Counter: string;
  PEBScounters: string;
  MSRIndex: string;
  MSRValue: string;
  CollectPEBSRecord: string;
  TakenAlone: string;
  CounterMask: string;
  Invert: string;
  EdgeDetect: string;
  PEBS: string;
  Data_LA: string;
  L1_Hit_Indication: string;
  Errata: string;
  Offcore: string;
  Speculative: string;
}

export const PERFMON_URL_ROOT = "https://download.01.org/perfmon/";
const MAP_FILE_PATH = "mapfile.csv";

const MapFileKeys: Map<CoreID, MapFileKey> = new Map([
  [ CoreID.SKL, { model: "4E", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.SKX, { model: "55-[01234]", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.CLX, { model: "55-[56789ABCDEF]", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.GLMp, { model: "7A", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.ICL, { model: "7E", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.TGL, { model: "8C", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.ICX, { model: "6A", eventType: EventType.Core, coreRole: CoreRole.None } ],
  [ CoreID.ADL_GLC, { model: "97", eventType: EventType.HybridCore, coreRole: CoreRole.Core } ],
  [ CoreID.ADL_GRT, { model: "9A", eventType: EventType.HybridCore, coreRole: CoreRole.Atom } ],
  [ CoreID.SPR, { model: "8F", eventType: EventType.Core, coreRole: CoreRole.None } ],
]);

export function storeKeyForCoreID(coreID: CoreID): Key {
  return `PerfEventSet.Intel.${CoreID[coreID]}.0`;
}

function processEventDesc(eventDescRaw: EventDescRaw) {
  const ret: any = {
    perfName: eventDescRaw.EventName,
    runParams: {
      eventCode: parseInt(eventDescRaw.EventCode),
      uMask: parseInt(eventDescRaw.UMask),
      cMask: parseInt(eventDescRaw.CounterMask),
    },
    runConstraints: { },
  };
  const counters = eventDescRaw.Counter.split(",").map((str) => parseInt(str));
  if (counters[0] >= 32) {
    ret.runConstraints.fixedCounter = counters[0] - 32;
  } else {
    ret.runConstraints.counterSetLimit = counters;
  }
  return ret;
}

export async function updateDB(coreIDs: CoreID[] = Array.from(enumValues(CoreID))) {
  const MAP_FILE_URL = PERFMON_URL_ROOT + MAP_FILE_PATH;
  log.info(`Fetching mapfile for ${MAP_FILE_PATH}`);
  const csvText = await (await fetch(MAP_FILE_URL)).text();
  const csv: Papa.ParseResult<any> = Papa.parse(csvText);

  const coreEventURLs = new Map(coreIDs.map((eventSet) => {
    const key = MapFileKeys.get(eventSet)!;
    const modelKey = `GenuineIntel-6-${key.model}`;
    return [eventSet, PERFMON_URL_ROOT + csv.data.filter((item) =>
      item[0] == modelKey && item[3] == key.eventType && item[6] == key.coreRole)[0][2]];
  }));

  for (const coreID of coreIDs) {
    const coreEventURL = coreEventURLs.get(coreID)!;
    const domain = coreIDToDomain(coreID);
    log.info(`Fetching event data for ${CoreID[coreID]} from ${coreEventURL}`);
    const raw = await (await fetch(coreEventURL)).json() as EventDescRaw[];
    log.info(`Event data for ${CoreID[coreID]} fetched`);
    const serialized: PerfEvent[] = raw.map((eventDesc) => ({
      ... processEventDesc(eventDesc), domain: domain }));
    await store(storeKeyForCoreID(coreID), serialized);
  }
}

const IntelEventSets = new Map<CoreID, EventSet>();

export async function getOrLoadEventSet(coreID: CoreID) {
  const cached = IntelEventSets.get(coreID);
  if (cached)
    return cached;

  const serialized = await load<PerfEvent[]>(storeKeyForCoreID(coreID));
  const newEventSet = new EventSet(new Set(serialized));
  IntelEventSets.set(coreID, newEventSet);
  return newEventSet;
}
