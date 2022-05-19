

export interface PerfEventNamed {
  kind: "named";
  eventName: string;
}

export type PerfEvent = PerfEventNamed;

export function perfEventToEventSelector(src: PerfEvent): string {
  switch (src.kind) {
    case "named":
      return src.eventName;
  }
}

export function perfEventToHumanName(src: PerfEvent): string {
  switch (src.kind) {
    case "named":
      return src.eventName;
  }
}
