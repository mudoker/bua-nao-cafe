import { create } from 'zustand';
import { AccountSession, Participant, EventDetails, AvailabilityMap, Recommendation } from '../types';
import { generateSlots } from '../utils/time';
import { Language } from '../utils/translations';
import { EventState } from './useEventStore.types';

const getStoredAccount = (): AccountSession | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('bua_nao_account');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('bua_nao_account');
    return null;
  }
};

const normalizeAccountName = (name: string) => name.trim().toLowerCase();

const syncState = (state: {
  currentEvent: EventDetails | null;
  participants: Participant[];
  availability: AvailabilityMap;
}) => {
  const { currentEvent, participants, availability } = state;
  if (!currentEvent) return;
  fetch(`/api/events/${currentEvent.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentEvent, participants, availability }),
  }).catch(err => console.error('Failed to sync state:', err));
};

export const useEventStore = create<EventState>((set, get) => {
  // Helper to generate recommendations
  const computeRecommendations = (
    event: EventDetails,
    participants: Participant[],
    availability: AvailabilityMap
  ): Recommendation[] => {
    const completedParticipants = participants.filter(p => p.isCompleted);
    if (completedParticipants.length === 0) return [];

    const totalCount = completedParticipants.length;
    const slots = generateSlots(
      event.dates,
      event.visibleHoursStart,
      event.visibleHoursEnd,
      event.slotDuration
    );

    const recommendations: Recommendation[] = [];

    slots.forEach((slotId) => {
      let overlapCount = 0;
      completedParticipants.forEach((p) => {
        if (availability[p.id]?.includes(slotId)) {
          overlapCount++;
        }
      });

      const percentage = (overlapCount / totalCount) * 100;
      if (overlapCount === 0) return;

      const dateTime = new Date(slotId);
      const hour = dateTime.getHours();
      const day = dateTime.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = day === 0 || day === 6;

      // Base score is percentage of available participants
      let score = percentage;

      const reasons: string[] = [];

      // Reason descriptions & bonuses
      reasons.push(`${overlapCount} of ${totalCount} available (${Math.round(percentage)}%)`);

      // Preferred working hours bonus
      if (
        event.preferredWorkingHoursStart !== undefined &&
        event.preferredWorkingHoursEnd !== undefined &&
        hour >= event.preferredWorkingHoursStart &&
        hour < event.preferredWorkingHoursEnd
      ) {
        score += 15;
        reasons.push('Falls within preferred working hours (+15 pts)');
      }

      // Weekday bonus
      if (!isWeekend) {
        score += 10;
        reasons.push('Weekday schedule (+10 pts)');
      }

      // Buffer penalty or reward (checking neighboring slots)
      // If we find consecutive slots, reward them (people like continuous meetings)
      // Check if slot before and after is highly available too
      const slotBefore = new Date(dateTime.getTime() - event.slotDuration * 60 * 1000).toISOString().slice(0, 16);
      const slotAfter = new Date(dateTime.getTime() + event.slotDuration * 60 * 1000).toISOString().slice(0, 16);

      let beforeOverlap = 0;
      let afterOverlap = 0;

      completedParticipants.forEach((p) => {
        if (availability[p.id]?.includes(slotBefore)) beforeOverlap++;
        if (availability[p.id]?.includes(slotAfter)) afterOverlap++;
      });

      if (beforeOverlap > 0 || afterOverlap > 0) {
        score += 5;
        reasons.push('Adjacent time block availability (+5 pts)');
      }

      recommendations.push({
        slotId,
        dateTime,
        overlapCount,
        totalCount,
        percentage,
        score,
        consecutiveMinutes: event.slotDuration,
        reasons,
      });
    });

    // Group adjacent recommendations to detect longer continuous blocks
    // Sort by score first, then by date/time
    return recommendations.sort((a, b) => b.score - a.score || a.dateTime.getTime() - b.dateTime.getTime());
  };

  return {
    account: getStoredAccount(),
    accountEvents: [],
    currentEvent: null,
    participants: [],
    availability: {},
    currentUser: null,
    selectedSlots: [],
    undoStack: [],
    redoStack: [],
    
    // Default language logic with SSR fallback
    language: typeof window !== 'undefined' ? (localStorage.getItem('w2m_lang') as Language || 'en') : 'en',
    setLanguage: (lang) => {
      set({ language: lang });
      if (typeof window !== 'undefined') {
        localStorage.setItem('w2m_lang', lang);
      }
    },

    filters: {
      selectedParticipantIds: [],
      hideWeekend: false,
      workingHoursOnly: false,
      minOverlapPercentage: 0,
    },
    recentActivity: [],

    login: async (name, password) => {
      const account = {
        name: name.trim(),
        password: password || undefined,
      };

      set({ account });
      if (typeof window !== 'undefined') {
        localStorage.setItem('bua_nao_account', JSON.stringify(account));
      }

      await get().loadAccountEvents();
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bua_nao_account');
      }

      set({
        account: null,
        accountEvents: [],
        currentUser: null,
        selectedSlots: [],
        undoStack: [],
        redoStack: [],
      });
    },

    loadAccountEvents: async () => {
      const { account } = get();
      if (!account) {
        set({ accountEvents: [] });
        return;
      }

      const params = new URLSearchParams({ user: account.name });
      if (account.password) params.set('password', account.password);

      try {
        const res = await fetch(`/api/events?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load account events');
        const events = await res.json();
        set({ accountEvents: events });
      } catch (error) {
        console.error('Failed to load account events:', error);
        set({ accountEvents: [] });
      }
    },

    createEvent: (details) => {
      const id = Math.random().toString(36).substring(2, 11);
      const newEvent: EventDetails = {
        ...details,
        id,
      };

      // Set initial state
      set({
        currentEvent: newEvent,
        participants: [],
        availability: {},
        currentUser: null,
        selectedSlots: [],
        undoStack: [],
        redoStack: [],
        recentActivity: [{ id: 'system', message: `Event "${newEvent.title}" created.`, timestamp: new Date() }]
      });

      const stateToSave = {
        currentEvent: newEvent,
        participants: [],
        availability: {},
        currentUser: null,
      };

      syncState(stateToSave);

      return id;
    },

    loadEvent: async (eventId) => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        const { account } = get();
        const accountUser = account
          ? data.participants.find((p: Participant) => {
              const participantAccount = p.accountName || normalizeAccountName(p.name);
              if (participantAccount !== normalizeAccountName(account.name)) return false;
              return p.password ? p.password === account.password : !account.password;
            }) || null
          : null;

        set({
          currentEvent: data.currentEvent,
          participants: data.participants,
          availability: data.availability,
          currentUser: accountUser,
          undoStack: accountUser ? [data.availability[accountUser.id] || []] : [],
          redoStack: [],
          recentActivity: [{ id: 'system', message: `Loaded event "${data.currentEvent.title}"`, timestamp: new Date() }]
        });
      } catch (error) {
        console.error('Failed to fetch event:', error);
      }
    },

    resetEvent: () => {
      set({
        currentEvent: null,
        participants: [],
        availability: {},
        currentUser: null,
        selectedSlots: [],
        undoStack: [],
        redoStack: [],
        recentActivity: [],
      });
    },

    joinAsParticipant: (name, color, avatar, password, isHost = false) => {
      const { account, currentEvent, participants, availability } = get();
      if (!currentEvent) throw new Error('No active event');

      const normalizedAccountName = normalizeAccountName(account?.name || name);
      const normalizedInputName = normalizeAccountName(name);
      const existing = participants.find((p) => {
        const participantAccount = p.accountName || normalizeAccountName(p.name);
        return participantAccount === normalizedAccountName || normalizeAccountName(p.name) === normalizedInputName;
      });

      if (existing) {
        if (existing.password ? existing.password !== password : Boolean(password)) {
          throw new Error('PASSWORD_MISMATCH');
        }

        if (existing.accountName && existing.accountName !== normalizedAccountName) {
          throw new Error('USERNAME_TAKEN');
        }

        const updated = {
          ...existing,
          accountName: existing.accountName || normalizedAccountName,
          isOnline: true,
          lastActive: new Date().toISOString(),
          password: existing.password || password || undefined
        };
        const updatedParticipants = participants.map(p => p.id === existing.id ? updated : p);
        
        set({
          currentUser: updated,
          participants: updatedParticipants,
          undoStack: [availability[existing.id] || []],
          redoStack: [],
        });
        
        const stateToSave = {
          currentEvent,
          participants: updatedParticipants,
          availability,
          currentUser: updated,
        };
        syncState(stateToSave);
        get().loadAccountEvents();

        get().addActivity(`${name} rejoined the event.`);
        return updated;
      }

      const id = `p-user-${Math.random().toString(36).substring(2, 7)}`;
      const newParticipant: Participant = {
        id,
        name,
        accountName: normalizedAccountName,
        color,
        avatar,
        isOnline: true,
        lastActive: new Date().toISOString(),
        isCompleted: false,
        isHost,
        password: password || undefined,
      };

      const updatedParticipants = [...participants, newParticipant];
      const updatedAvailability = {
        ...availability,
        [id]: [],
      };

      set({
        currentUser: newParticipant,
        participants: updatedParticipants,
        availability: updatedAvailability,
        undoStack: [[]],
        redoStack: [],
      });

      const stateToSave = {
        currentEvent,
        participants: updatedParticipants,
        availability: updatedAvailability,
        currentUser: newParticipant,
      };
      syncState(stateToSave);
      get().loadAccountEvents();

      get().addActivity(`${name} joined the event.`);
      return newParticipant;
    },

    submitAvailability: (slots) => {
      const { currentEvent, currentUser, participants, availability, undoStack } = get();
      if (!currentEvent || !currentUser) return;

      const updatedParticipants = participants.map((p) =>
        p.id === currentUser.id ? { ...p, isCompleted: true, lastActive: new Date().toISOString() } : p
      );

      const updatedAvailability = {
        ...availability,
        [currentUser.id]: slots,
      };

      // Push history
      const lastHistory = undoStack[undoStack.length - 1];
      const newUndoStack = [...undoStack];
      // Only push to history if it actually changed
      if (JSON.stringify(lastHistory) !== JSON.stringify(slots)) {
        newUndoStack.push(slots);
      }

      set({
        participants: updatedParticipants,
        availability: updatedAvailability,
        currentUser: { ...currentUser, isCompleted: true },
        undoStack: newUndoStack,
        redoStack: [], // clear redo on new action
      });

      const stateToSave = {
        currentEvent,
        participants: updatedParticipants,
        availability: updatedAvailability,
        currentUser: { ...currentUser, isCompleted: true },
      };
      syncState(stateToSave);

      const wasCompleted = currentUser.isCompleted;
      if (!wasCompleted) {
        get().addActivity(`${currentUser.name} submitted availability! 🎉`);
      } else {
        get().addActivity(`${currentUser.name} updated availability.`);
      }
    },

    toggleSlotAvailability: (slotId) => {
      const { currentUser, availability } = get();
      if (!currentUser) return;

      const currentSlots = availability[currentUser.id] || [];
      const updatedSlots = currentSlots.includes(slotId)
        ? currentSlots.filter((id) => id !== slotId)
        : [...currentSlots, slotId];

      get().submitAvailability(updatedSlots);
    },

    paintSlotsAvailability: (slotIds, available) => {
      const { currentUser, availability } = get();
      if (!currentUser) return;

      const currentSlots = availability[currentUser.id] || [];
      let updatedSlots = [...currentSlots];

      if (available) {
        // Add all slotIds if not already present
        slotIds.forEach((id) => {
          if (!updatedSlots.includes(id)) {
            updatedSlots.push(id);
          }
        });
      } else {
        // Remove all slotIds
        updatedSlots = updatedSlots.filter((id) => !slotIds.includes(id));
      }

      get().submitAvailability(updatedSlots);
    },

    undo: () => {
      const { undoStack, redoStack, currentUser, availability, currentEvent, participants } = get();
      if (!currentUser || undoStack.length <= 1) return; // Need at least initial + 1 changes

      const currentSlots = availability[currentUser.id] || [];
      const previousSlots = undoStack[undoStack.length - 2]; // Get second to last
      
      const newUndoStack = undoStack.slice(0, -1);
      const newRedoStack = [...redoStack, currentSlots];

      const updatedAvailability = {
        ...availability,
        [currentUser.id]: previousSlots,
      };

      set({
        availability: updatedAvailability,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      });

      syncState({
        currentEvent,
        participants,
        availability: updatedAvailability,
      });

      get().addActivity(`${currentUser.name} undid an edit.`);
    },

    redo: () => {
      const { undoStack, redoStack, currentUser, availability, currentEvent, participants } = get();
      if (!currentUser || redoStack.length === 0) return;

      const nextSlots = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      const newUndoStack = [...undoStack, nextSlots];

      const updatedAvailability = {
        ...availability,
        [currentUser.id]: nextSlots,
      };

      set({
        availability: updatedAvailability,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      });

      syncState({
        currentEvent,
        participants,
        availability: updatedAvailability,
      });

      get().addActivity(`${currentUser.name} redid an edit.`);
    },

    clearCurrentAvailability: () => {
      const { currentUser } = get();
      if (!currentUser) return;
      get().submitAvailability([]);
      get().addActivity(`${currentUser.name} cleared availability.`);
    },

    fillCurrentAvailability: () => {
      const { currentUser, currentEvent } = get();
      if (!currentUser || !currentEvent) return;

      const slots = generateSlots(
        currentEvent.dates,
        currentEvent.visibleHoursStart,
        currentEvent.visibleHoursEnd,
        currentEvent.slotDuration
      );

      get().submitAvailability(slots);
      get().addActivity(`${currentUser.name} set availability to 100%.`);
    },

    updateParticipant: (id, updates) => {
      const { currentEvent, participants, availability, currentUser } = get();
      if (!currentEvent) return;

      const updatedParticipants = participants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );

      const updatedUser = currentUser && currentUser.id === id ? { ...currentUser, ...updates } : currentUser;

      set({
        participants: updatedParticipants,
        currentUser: updatedUser,
      });

      const stateToSave = {
        currentEvent,
        participants: updatedParticipants,
        availability,
        currentUser: updatedUser,
      };
      syncState(stateToSave);

      const p = participants.find(p => p.id === id);
      if (p) {
        get().addActivity(`Participant "${p.name}" updated by host.`);
      }
    },

    removeParticipant: (id) => {
      const { currentEvent, participants, availability, currentUser } = get();
      if (!currentEvent) return;

      const p = participants.find(p => p.id === id);
      const updatedParticipants = participants.filter((p) => p.id !== id);
      
      const newAvailability = { ...availability };
      delete newAvailability[id];

      // If removed user is current user, log out
      const updatedUser = currentUser && currentUser.id === id ? null : currentUser;

      set({
        participants: updatedParticipants,
        availability: newAvailability,
        currentUser: updatedUser,
      });

      const stateToSave = {
        currentEvent,
        participants: updatedParticipants,
        availability: newAvailability,
        currentUser: updatedUser,
      };
      syncState(stateToSave);

      if (p) {
        get().addActivity(`Participant "${p.name}" removed by host.`);
      }
    },

    lockResponses: (lock) => {
      const { currentEvent } = get();
      if (!currentEvent) return;

      // We can model locking as an event configuration
      get().updateEventDetails({ isPrivate: lock }); // Or define a lock status. Let's add password/lock details to description or status
      get().addActivity(lock ? `Responses locked by organizer.` : `Responses unlocked by organizer.`);
    },

    closeEvent: () => {
      const { currentEvent } = get();
      if (!currentEvent) return;
      get().addActivity(`Event closed.`);
    },

    finalizeSlot: (slotId) => {
      const { currentEvent, participants, availability, currentUser } = get();
      if (!currentEvent) return;

      const updatedEvent = {
        ...currentEvent,
        finalizedSlot: slotId || undefined,
      };

      set({ currentEvent: updatedEvent });

      const stateToSave = {
        currentEvent: updatedEvent,
        participants,
        availability,
        currentUser,
      };
      syncState(stateToSave);

      if (slotId) {
        get().addActivity(`Meeting time finalized! 📅`);
      } else {
        get().addActivity(`Finalized meeting time removed.`);
      }
    },

    updateEventDetails: (updates) => {
      const { currentEvent, participants, availability, currentUser } = get();
      if (!currentEvent) return;

      const updated = { ...currentEvent, ...updates };
      set({ currentEvent: updated });

      const stateToSave = {
        currentEvent: updated,
        participants,
        availability,
        currentUser,
      };
      syncState(stateToSave);
    },

    toggleParticipantFilter: (id) => {
      const { filters } = get();
      const alreadySelected = filters.selectedParticipantIds.includes(id);
      const selectedParticipantIds = alreadySelected
        ? filters.selectedParticipantIds.filter((pId) => pId !== id)
        : [...filters.selectedParticipantIds, id];

      set({
        filters: {
          ...filters,
          selectedParticipantIds,
        },
      });
    },

    clearFilters: () => {
      const { filters } = get();
      set({
        filters: {
          ...filters,
          selectedParticipantIds: [],
          hideWeekend: false,
          workingHoursOnly: false,
          minOverlapPercentage: 0,
        },
      });
    },

    setFilter: (key, value) => {
      const { filters } = get();
      set({
        filters: {
          ...filters,
          [key]: value,
        },
      });
    },



    addActivity: (message) => {
      set(state => ({
        recentActivity: [
          { id: Math.random().toString(), message, timestamp: new Date() },
          ...state.recentActivity.slice(0, 19) // Limit to last 20 messages
        ]
      }));
    },

    getRecommendations: () => {
      const { currentEvent, participants, availability } = get();
      if (!currentEvent) return [];
      return computeRecommendations(currentEvent, participants, availability);
    },
  };
});
