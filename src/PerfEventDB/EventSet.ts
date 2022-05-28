
import { SerializedEventDesc, EventDesc } from "./Common.js";
import { Kind } from "../perf-event.js";

export class EventSet {
  allEvents: Set<EventDesc>;
  eventNameToDescMap: Map<string, EventDesc>;

  constructor(allEvents: Set<SerializedEventDesc>) {
    this.allEvents = <Set<EventDesc>>allEvents;
    this.eventNameToDescMap = new Map();
    for (const eventDesc of this.allEvents) {
      eventDesc.namedEvent = {
        kind: Kind.Named,
        eventName: eventDesc.eventName,
      }
      this.eventNameToDescMap.set(eventDesc.eventName, eventDesc);
    }
  }
}
