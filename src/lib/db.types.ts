import { Participant, EventDetails, AvailabilityMap } from '../types';

export interface SavedEvent {
  currentEvent: EventDetails;
  participants: Participant[];
  availability: AvailabilityMap;
}

export interface EventRow {
  id: string;
  current_event: EventDetails;
  participants: Participant[];
  availability: AvailabilityMap;
}
