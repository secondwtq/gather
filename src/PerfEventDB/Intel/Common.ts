
import { Domain } from "../../perf-event.js";

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

export function coreIDToDomain(src: CoreID): Domain {
  switch (src) {
    case CoreID.ADL_GLC:
      return Domain.CPUCore;
    case CoreID.ADL_GRT:
      return Domain.CPUAtom;
    default:
      return Domain.CPU;
  }
}
