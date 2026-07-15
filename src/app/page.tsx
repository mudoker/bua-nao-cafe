"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AvailabilityGrid from '../components/AvailabilityGrid';
import Suggestions from '../components/Suggestions';
import Analytics from '../components/Analytics';
import EventCreator from '../components/EventCreator';
import ParticipantOnboarding from '../components/ParticipantOnboarding';
import ThemeToggle from '../components/ThemeToggle';
import { Calendar, Sparkles, Zap, ShieldCheck, Grid as GridIcon, Users, Lightbulb, BarChart3, Coffee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function HomeContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const loadEvent = useEventStore((state) => state.loadEvent);
  const language = useEventStore((state) => state.language);

  // Active tab state for mobile view
  const [activeMobileTab, setActiveMobileTab] = useState<'grid' | 'team' | 'suggestions' | 'charts'>('grid');

  // Load event from local storage if query param is present
  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId, loadEvent]);

  // Periodic polling for real-time collaboration updates
  useEffect(() => {
    if (!eventId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        const store = useEventStore.getState();
        
        // Simple comparison to prevent unnecessary state resets
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
              // Preserve the currentUser's current availability from store if they are logged in
              ...(store.currentUser ? { [store.currentUser.id]: store.availability[store.currentUser.id] || [] } : {})
            }
          });
        }
      } catch (error) {
        console.error('Failed to poll updates:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [eventId]);

  // Clean state when creator creates an event
  const handleEventCreated = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    window.history.pushState({}, '', url.toString());
    loadEvent(id);
  };

  // State 1: No Event Loaded (Show Creator & Landing)
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Branding Hero Banner */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-4 flex flex-col items-center">
            {/* Pulsing Cafe Cup Logo */}
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner inline-flex items-center justify-center mb-1">
              <Coffee className="w-10 h-10 text-primary animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>
                {language === 'en' ? 'Frictionless Group Scheduler' : 'Tìm lịch rảnh nhóm nhanh chóng'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground m-0 leading-tight">
              {getTranslation(language, 'landingTitle')}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                {getTranslation(language, 'landingTitleGrad')}
              </span>
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed font-semibold">
              {getTranslation(language, 'landingDesc')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{getTranslation(language, 'zeroAccounts')}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-border rounded-full" />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{getTranslation(language, 'realtimeSync')}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-border rounded-full" />
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>{getTranslation(language, 'mobilePainting')}</span>
              </span>
            </div>
          </div>

          <EventCreator onCreated={handleEventCreated} />
        </main>

        {/* Clean Footer */}
        <footer className="py-6 border-t border-border text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/10 dark:bg-black/40 z-10 shrink-0">
          © {new Date().getFullYear()} Bữa Nào Cafe? — group scheduling made simple.
        </footer>
      </div>
    );
  }

  // State 2: Event Loaded, but Participant has not joined yet (Show Onboarding)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="w-full z-10 animate-fadeIn">
          <ParticipantOnboarding />
        </div>
      </div>
    );
  }

  // State 3: Event Loaded and Joined (Show Collaborative Dashboard)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6">
        {/* Desktop Layout (Two Column) */}
        <div className="hidden lg:grid lg:grid-cols-[20rem_1fr] gap-6 items-start">
          {/* Left Column: Sidebar details & recommendations */}
          <div className="flex flex-col gap-6 sticky top-6">
            <Sidebar />
            <Suggestions />
          </div>

          {/* Right Column: Heatmap grid & statistical charts */}
          <div className="flex flex-col gap-6">
            <AvailabilityGrid />
            <Analytics className="shrink-0" />
          </div>
        </div>

        {/* Mobile Layout (Tab Content using shadcn tabs) */}
        <Tabs
          value={activeMobileTab}
          onValueChange={(val) => setActiveMobileTab(val as any)}
          className="w-full lg:hidden flex flex-col gap-4"
        >
          <TabsList className="grid grid-cols-4 w-full h-11 bg-muted/60 dark:bg-zinc-900 border border-border p-1 rounded-xl">
            <TabsTrigger value="grid" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <GridIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Grid' : 'Biểu đồ'}</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Team' : 'Thành viên'}</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Alerts' : 'Khung giờ'}</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Charts' : 'Thống kê'}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="mt-0 focus-visible:outline-none"><AvailabilityGrid /></TabsContent>
          <TabsContent value="team" className="mt-0 focus-visible:outline-none"><Sidebar /></TabsContent>
          <TabsContent value="suggestions" className="mt-0 focus-visible:outline-none"><Suggestions /></TabsContent>
          <TabsContent value="charts" className="mt-0 focus-visible:outline-none"><Analytics /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-bold text-sm">
        Loading group scheduler...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
