import { Participant, AvailabilityMap } from '../types';

export const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: 'Sarah Jenkins',
    color: 'indigo',
    avatar: '👩‍💻',
    isOnline: true,
    lastActive: new Date().toISOString(),
    isCompleted: true,
    isHost: false,
  },
  {
    id: 'p-2',
    name: 'Alex Chen',
    color: 'emerald',
    avatar: '👨‍🎨',
    isOnline: true,
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isCompleted: true,
    isHost: false,
  },
  {
    id: 'p-3',
    name: 'Jane Doe',
    color: 'rose',
    avatar: '👩‍🔬',
    isOnline: false,
    lastActive: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isCompleted: true,
    isHost: false,
  },
  {
    id: 'p-4',
    name: 'David Kim',
    color: 'amber',
    avatar: '👨‍💼',
    isOnline: false,
    lastActive: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    isCompleted: true,
    isHost: false,
  },
  {
    id: 'p-5',
    name: 'Michael Owen',
    color: 'sky',
    avatar: '🚴‍♂️',
    isOnline: false,
    lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isCompleted: false,
    isHost: false,
  }
];

export function generateMockAvailability(
  participants: Participant[],
  slots: string[]
): AvailabilityMap {
  const map: AvailabilityMap = {};
  
  participants.forEach(p => {
    map[p.id] = [];
  });

  slots.forEach((slot, index) => {
    const timePart = slot.split('T')[1];
    const hour = parseInt(timePart.split(':')[0], 10);
    const dateIndex = index % 3; // Cycle dates if there are multiple

    // Sarah: Available mornings and early afternoons
    if (map['p-1'] && ((hour >= 9 && hour < 12) || (hour >= 13 && hour < 16))) {
      if (Math.random() > 0.1) map['p-1'].push(slot);
    }

    // Alex: Afternoon preference
    if (map['p-2'] && (hour >= 13 && hour < 17)) {
      if (Math.random() > 0.15) map['p-2'].push(slot);
    }

    // Jane: Morning or late afternoons, skips day index 2
    if (map['p-3'] && dateIndex !== 2 && ((hour >= 9 && hour < 11) || (hour >= 15 && hour < 17))) {
      if (Math.random() > 0.2) map['p-3'].push(slot);
    }

    // David: Only mid-day
    if (map['p-4'] && (hour >= 10 && hour <= 14)) {
      if (Math.random() > 0.3) map['p-4'].push(slot);
    }

    // Michael: Hasn't completed yet (isCompleted = false), so empty
  });

  return map;
}

export const ADJECTIVES = ['Swift', 'Creative', 'Diligent', 'Smart', 'Bright', 'Quiet', 'Active', 'Happy'];
export const NAMES = ['Liam', 'Emma', 'Noah', 'Olivia', 'William', 'Ava', 'James', 'Sophia'];
export const EMOJIS = ['🐹', '🦊', '🦁', '🐸', '🐼', '🐨', '🐙', '🦖', '🦄', '🐝', '🎨', '🚀'];
export const COLORS = ['indigo', 'emerald', 'rose', 'amber', 'sky', 'violet', 'fuchsia', 'orange'];
export const AVATARS = ['👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬', '👨‍💼', '👩‍💼', '🚴‍♂️', '🧘‍♀️', '🧗‍♂️', '🏌️‍♂️'];
export const TOPICS = [
  'Sync-up meeting',
  'Brainstorming session',
  'Weekly planning',
  'Product alignment',
  'Design review',
  'Project kickoff',
  'Code review roundtable',
  'Retrospective session'
];
export const DESCRIPTIONS = [
  'Let\'s align on the roadmap for next quarter and resolve pending blockages.',
  'Collab session to map out the user flow and design concepts for the new feature.',
  'Quick weekly sync to check progress, resolve dependencies, and update tasks.',
  'Reviewing the technical architecture and alignment for the database migrations.',
  'Retro to discuss what went well, what didn\'t, and actionable improvements.'
];
export const ORGANIZERS = ['John Carter', 'Evelyn Stark', 'Marcus Aurelius', 'Ada Lovelace', 'Alan Turing'];
