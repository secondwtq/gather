
export interface RunParams {
  eventCode?: number;
  uMask?: number;
  // Counter Mask
  cMask?: number;
}

export interface RunConstraints {
  counterSetLimit?: number[];
  fixedCounter?: number;
}

export enum Domain {
  None = "",
  CPU = "cpu",
  CPUCore = "cpu_core",
  CPUAtom = "cpu_atom",
}

export interface PerfEvent {
  perfName: string;
  domain: Domain;
  runParams: RunParams;
  runConstraints: RunConstraints;
}

export interface Selector {
  event: PerfEvent;
  annotations: string[];
}

export function selectorToPerfEventSelector(src: Selector): string {
  const hasDomain = src.event.domain != Domain.None;
  if (src.event.domain != Domain.None)
    return src.event.domain + "/" + src.event.perfName + "/" + src.annotations.join("/");
  else
    return src.event.perfName + src.annotations.map((annotation) =>
      ":" + annotation).join("");
}
