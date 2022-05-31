
import { PerfEvent } from "../perf-event.js";

export class EventSet {
  allEvents: Set<PerfEvent>;
  eventNameToDescMap: Map<string, PerfEvent>;

  constructor(allEvents: Set<PerfEvent>) {
    this.allEvents = allEvents;
    this.eventNameToDescMap = new Map();
    for (const eventDesc of this.allEvents) {
      this.eventNameToDescMap.set(eventDesc.perfName, eventDesc);
    }
  }
}
