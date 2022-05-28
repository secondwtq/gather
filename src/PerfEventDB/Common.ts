
import { PerfEventNamed } from "../perf-event.js";

export interface SerializedEventDesc {
  eventName: string;
  description: string;
}

export interface EventDesc extends SerializedEventDesc {
  namedEvent: PerfEventNamed;
}
