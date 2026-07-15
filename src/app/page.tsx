"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEventStore } from '../store/useEventStore';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AvailabilityGrid from '../components/AvailabilityGrid';
import Suggestions from '../components/Suggestions';
import Analytics from '../components/Analytics';
import EventCreator from '../components/EventCreator';
import ParticipantOnboarding from '../components/ParticipantOnboarding';
import { Calendar, Sparkles, Zap, ShieldCheck } from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const loadEvent = useEventStore((state) => state.loadEvent);

  // Load event from local storage if query param is present
  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId, loadEvent]);

  // Clean state when creator creates an event
  const handleEventCreated = (id: string) => {
    // Update URL query parameters without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    window.history.pushState({}, '', url.toString());
    loadEvent(id);
  };

  // State 1: No Event Loaded (Show Creator & Landing)
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Branding Hero Banner */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Scheduling Workspace</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white m-0">
              When2Meet, but <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">significantly better</span>.
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Plan meetings instantly with high-fidelity heatmaps, real-time presence indicators, and optimal slot ranking. No registration or accounts required.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-zinc-500 font-semibold">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Zero Accounts Required</span>
              </span>
              <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Real-Time Sync</span>
              </span>
              <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>Mobile First Painting</span>
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
        <div className="w-full z-10">
          <ParticipantOnboarding />
        </div>
      </div>
    );
  }

  // State 3: Event Loaded and Joined (Show Collaborative Dashboard)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 flex flex-col lg:flex-row gap-6">
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
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-400 font-semibold text-sm">
        Loading scheduler environment...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
