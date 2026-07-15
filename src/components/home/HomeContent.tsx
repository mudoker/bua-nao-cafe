"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountLogin from '@/components/auth/AccountLogin';
import EventLanding from '@/components/home/EventLanding';
import EventOnboardingScreen from '@/components/home/EventOnboardingScreen';
import HomeDashboard from '@/components/home/HomeDashboard';
import { useEventStore } from '@/store/useEventStore';

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

        if (
          JSON.stringify(store.participants) !== JSON.stringify(data.participants) ||
          JSON.stringify(store.availability) !== JSON.stringify(data.availability) ||
          JSON.stringify(store.currentEvent) !== JSON.stringify(data.currentEvent)
        ) {
          useEventStore.setState({
            currentEvent: data.currentEvent,
            participants: data.participants,
            availability: {
              ...data.availability,
              ...(store.currentUser ? { [store.currentUser.id]: store.availability[store.currentUser.id] || [] } : {}),
            },
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
