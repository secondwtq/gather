
import fs from "fs/promises";
import { SerializedEventDesc, EventDesc } from "../Common.js";
import { EventSet } from "../EventSet.js";
import { load } from "../../PersistentStorage.js";
import { storeKeyForCoreID } from "./MapFile.js";

export enum CoreID {
  SKL,
  SKX,
  CLX,
  GLMp,
  ICL,
  TGL,
  ICX,
  ADL_GLC,
  ADL_GRT,
  SPR,
}

const IntelEventSets = new Map<CoreID, EventSet>();

export async function getOrLoadEventSet(coreID: CoreID) {
  const cached = IntelEventSets.get(coreID);
  if (cached)
    return cached;

  const serialized = await load<SerializedEventDesc[]>(storeKeyForCoreID(coreID));
  const newEventSet = new EventSet(new Set(serialized));
  IntelEventSets.set(coreID, newEventSet);
  return newEventSet;
}
