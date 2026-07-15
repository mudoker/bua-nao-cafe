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
import { Calendar, Sparkles, Zap, ShieldCheck, Grid, Users, Lightbulb, BarChart3 } from 'lucide-react';

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
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Branding Hero Banner */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>
                {language === 'en' ? 'Next-Gen Scheduling Workspace' : 'Không Gian Lên Lịch Thế Hệ Mới'}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white m-0 leading-tight">
              {getTranslation(language, 'landingTitle')}{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {getTranslation(language, 'landingTitleGrad')}
              </span>
            </h1>

            <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-semibold">
              {getTranslation(language, 'landingDesc')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-zinc-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{getTranslation(language, 'zeroAccounts')}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{getTranslation(language, 'realtimeSync')}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>{getTranslation(language, 'mobilePainting')}</span>
              </span>
            </div>
          </div>

          <EventCreator onCreated={handleEventCreated} />
        </main>

        {/* Clean Footer */}
        <footer className="py-6 border-t border-zinc-900 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-black/40 z-10 shrink-0">
          © {new Date().getFullYear()} Modern When2Meet. Pairs with Figma & Linear workflows.
        </footer>
      </div>
    );
  }

  // State 2: Event Loaded, but Participant has not joined yet (Show Onboarding)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
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
      
      {/* Mobile view panel selectors */}
      <div className="flex lg:hidden sticky top-[57px] z-40 bg-card border-b border-border/80 p-1 gap-1 text-[11px] font-bold w-full shadow-sm">
        <button
          onClick={() => setActiveMobileTab('grid')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            activeMobileTab === 'grid'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/20 dark:bg-muted/10'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Grid' : 'Biểu đồ'}</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('team')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            activeMobileTab === 'team'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/20 dark:bg-muted/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Team' : 'Thành viên'}</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('suggestions')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            activeMobileTab === 'suggestions'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/20 dark:bg-muted/10'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Alerts' : 'Khung giờ'}</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('charts')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
            activeMobileTab === 'charts'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/20 dark:bg-muted/10'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Charts' : 'Thống kê'}</span>
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6">
        {/* Desktop Layout (Two Column) */}
        <div className="hidden lg:flex gap-6 items-start">
          {/* Left Column: Sidebar details & recommendations */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
            <Sidebar />
            <Suggestions />
          </div>

          {/* Right Column: Heatmap grid & statistical charts */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <AvailabilityGrid />
            <Analytics />
          </div>
        </div>

        {/* Mobile Layout (Tab Content) */}
        <div className="lg:hidden flex flex-col gap-4 animate-fadeIn">
          {activeMobileTab === 'grid' && <AvailabilityGrid />}
          {activeMobileTab === 'team' && <Sidebar />}
          {activeMobileTab === 'suggestions' && <Suggestions />}
          {activeMobileTab === 'charts' && <Analytics />}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-400 font-bold text-sm">
        Loading scheduler environment...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
