"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountLogin from '@/components/auth/AccountLogin';
import EventLanding from '@/components/home/EventLanding';
import EventOnboardingScreen from '@/components/home/EventOnboardingScreen';
import HomeDashboard from '@/components/home/HomeDashboard';
import { useEventStore } from '@/store/useEventStore';
import { Participant } from '@/types';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  const account = useEventStore((state) => state.account);
  const accountEvents = useEventStore((state) => state.accountEvents);
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const loadEvent = useEventStore((state) => state.loadEvent);
  const loadAccountEvents = useEventStore((state) => state.loadAccountEvents);
  const logout = useEventStore((state) => state.logout);
  const language = useEventStore((state) => state.language);
  const [activeMobileTab, setActiveMobileTab] = useState<'grid' | 'team' | 'suggestions' | 'charts'>('grid');

  const handleMobileTabChange = (value: string) => {
    if (value === 'grid' || value === 'team' || value === 'suggestions' || value === 'charts') {
      setActiveMobileTab(value);
    }
  };

  useEffect(() => {
    if (account && eventId) {
      loadEvent(eventId);
    }
  }, [account, eventId, loadEvent]);

  useEffect(() => {
    if (account) {
      loadAccountEvents();
    }
  }, [account, loadAccountEvents]);

  useEffect(() => {
    if (!eventId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) return;
        const data = await res.json();
        const store = useEventStore.getState();
        const currentUserId = store.currentUser?.id;

        // Merge incoming availability with local user's availability to avoid overwrite glitches
        const mergedAvailability = {
          ...data.availability,
          ...(currentUserId ? { [currentUserId]: store.availability[currentUserId] || [] } : {})
        };

        if (
          JSON.stringify(store.participants) !== JSON.stringify(data.participants) ||
          JSON.stringify(store.availability) !== JSON.stringify(mergedAvailability) ||
          JSON.stringify(store.currentEvent) !== JSON.stringify(data.currentEvent)
        ) {
          const updatedCurrentUser = store.currentUser
            ? data.participants.find((participant: Participant) => participant.id === store.currentUser?.id) || store.currentUser
            : null;

          useEventStore.setState({
            currentEvent: data.currentEvent,
            participants: data.participants,
            availability: mergedAvailability,
            currentUser: updatedCurrentUser,
          });
        }
      } catch (error) {
        console.error('Failed to poll updates:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [eventId]);

  const pushEventUrl = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    window.history.pushState({}, '', url.toString());
    loadEvent(id);
  };

  if (!account) return <AccountLogin />;
  if (!currentEvent) {
    return (
      <EventLanding
        events={accountEvents}
        language={language}
        onCreated={pushEventUrl}
        onOpenEvent={pushEventUrl}
        onLogout={logout}
      />
    );
  }
  if (!currentUser) return <EventOnboardingScreen />;

  return (
    <HomeDashboard
      activeMobileTab={activeMobileTab}
      language={language}
      onMobileTabChange={handleMobileTabChange}
    />
  );
}
