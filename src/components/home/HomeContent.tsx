"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountLogin from '@/components/auth/AccountLogin';
import EventLanding from '@/components/home/EventLanding';
import EventOnboardingScreen from '@/components/home/EventOnboardingScreen';
import HomeDashboard from '@/components/home/HomeDashboard';
import { useEventStore } from '@/store/useEventStore';
import { Participant } from '@/types';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const updateParticipant = useEventStore((state) => state.updateParticipant);
  const [activeNudge, setActiveNudge] = useState<{ senderName: string; timestamp: number; id: string } | null>(null);

  useEffect(() => {
    if (currentUser?.nudge) {
      const dismissed = localStorage.getItem(`dismissed_nudge_${currentUser.nudge.id}`);
      if (!dismissed) {
        setActiveNudge(currentUser.nudge);
      }
    } else {
      setActiveNudge(null);
    }
  }, [currentUser]);

  const handleDismissNudge = () => {
    if (currentUser && activeNudge) {
      localStorage.setItem(`dismissed_nudge_${activeNudge.id}`, 'true');
      updateParticipant(currentUser.id, { nudge: undefined });
      setActiveNudge(null);
    }
  };

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
    <>
      <HomeDashboard
        activeMobileTab={activeMobileTab}
        language={language}
        onMobileTabChange={handleMobileTabChange}
      />

      {activeNudge && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm bg-card border border-primary/30 p-4 rounded-2xl shadow-2xl animate-bounce-in flex items-start gap-3 bg-gradient-to-br from-card via-card to-primary/5 select-none">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shrink-0 mt-0.5 text-primary">
            <Bell className="w-5 h-5 animate-swing" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <span>{language === 'en' ? 'Nudge Alert!' : 'Nhắc Nhở!'}</span>
            </h4>
            <p className="text-xs text-muted-foreground font-semibold leading-normal">
              {language === 'en'
                ? `⚡ ${activeNudge.senderName} is nudging you to complete your availability schedule.`
                : `⚡ ${activeNudge.senderName} đang nhắc bạn hoàn thành lịch rảnh.`}
            </p>
            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleDismissNudge}
                className="h-7 px-3 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer rounded-lg shadow animate-pulse-slow"
              >
                {language === 'en' ? 'Got it!' : 'Đã hiểu!'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
