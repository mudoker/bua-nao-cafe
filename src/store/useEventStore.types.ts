import { AccountEventSummary, AccountSession, Participant, EventDetails, AvailabilityMap, Recommendation } from '../types';
import { Language } from '../utils/translations';

export type FilterState = {
  selectedParticipantIds: string[];
  hideWeekend: boolean;
  workingHoursOnly: boolean;
  minOverlapPercentage: number;
};

export type FilterKey = keyof FilterState;
export type FilterValue<K extends FilterKey> = FilterState[K];

export interface EventState {
  account: AccountSession | null;
  accountEvents: AccountEventSummary[];
  currentEvent: EventDetails | null;
  participants: Participant[];
  availability: AvailabilityMap;
  currentUser: Participant | null;
  selectedSlots: string[];
  undoStack: string[][];
  redoStack: string[][];
  language: Language;
  setLanguage: (lang: Language) => void;
  filters: FilterState;
  recentActivity: { id: string; message: string; timestamp: Date }[];
  login: (name: string, password?: string) => Promise<void>;
  logout: () => void;
  loadAccountEvents: () => Promise<void>;
  createEvent: (details: Omit<EventDetails, 'id' | 'finalizedSlot'>) => string;
  loadEvent: (eventId: string) => Promise<void>;
  resetEvent: () => void;
  joinAsParticipant: (name: string, color: string, avatar: string, password?: string, isHost?: boolean) => Participant;
  submitAvailability: (slots: string[], skipHistory?: boolean) => void;
  toggleSlotAvailability: (slotId: string, skipHistory?: boolean) => void;
  paintSlotsAvailability: (slotIds: string[], available: boolean, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearCurrentAvailability: () => void;
  fillCurrentAvailability: () => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  lockResponses: (lock: boolean) => void;
  closeEvent: () => void;
  finalizeSlot: (slotId: string | null) => void;
  updateEventDetails: (updates: Partial<EventDetails>) => void;
  toggleParticipantFilter: (id: string) => void;
  clearFilters: () => void;
  setFilter: <K extends FilterKey>(key: K, value: FilterValue<K>) => void;
  addActivity: (message: string) => void;
  getRecommendations: () => Recommendation[];
}
