
export enum Kind {
  Named = "named",
}

export interface PerfEventNamed {
  kind: Kind.Named;
  eventName: string;
}

export type PerfEvent = PerfEventNamed;

export function perfEventToEventSelector(src: PerfEvent): string {
  switch (src.kind) {
    case Kind.Named:
      return src.eventName;
  }
}

export function perfEventToHumanName(src: PerfEvent): string {
  switch (src.kind) {
    case Kind.Named:
      return src.eventName;
  }
}
