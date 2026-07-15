export interface Participant {
  id: string;
  name: string;
  accountName?: string; // Normalized login name used to recover this participant across devices
  color: string; // Tailwind color name or hex
  avatar: string; // emoji or initials
  isOnline: boolean;
  lastActive: string; // ISO string
  isCompleted: boolean;
  isHost: boolean;
  password?: string; // Optional password to protect their availability grid
}

export interface AccountSession {
  name: string;
  password?: string;
}

export interface EventDetails {
  id: string;
  title: string;
  description: string;
  organizer: string;
  timezone: string;
  dates: string[]; // ['YYYY-MM-DD', ...]
  visibleHoursStart: number; // 0-23 (e.g. 9 for 9 AM)
  visibleHoursEnd: number; // 0-23 (e.g. 17 for 5 PM)
  slotDuration: number; // in minutes (15, 30, 60)
  isPrivate: boolean;
  password?: string;
  maxParticipants?: number;
  deadline?: string; // YYYY-MM-DDTHH:mm
  preferredWorkingHoursStart?: number; // 0-23
  preferredWorkingHoursEnd?: number; // 0-23
  includeWeekends: boolean;
  bufferMinutes: number; // buffer between meetings (0, 10, 15, 30)
  finalizedSlot?: string; // YYYY-MM-DDTHH:mm (ISO start time of finalized slot)
}

// Maps participant ID -> list of slot IDs ('YYYY-MM-DDTHH:mm') they are available in
export type AvailabilityMap = Record<string, string[]>;

export interface AccountEventSummary {
  id: string;
  title: string;
  description?: string;
  organizer: string;
  dates: string[];
  timezone: string;
  isPending: boolean;
  finalizedSlot?: string;
  participant: Participant;
}

export interface Recommendation {
  slotId: string;
  dateTime: Date;
  overlapCount: number;
  totalCount: number;
  percentage: number;
  score: number; // combined ranking score based on overlap, working hours, buffers
  consecutiveMinutes: number;
  reasons: string[];
}
