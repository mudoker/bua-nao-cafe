"use client";

import { LogOut } from 'lucide-react';
import EventCreator from '@/components/EventCreator';
import ThemeToggle from '@/components/ThemeToggle';
import EventListPanel from '@/components/home/EventListPanel';
import LandingHero from '@/components/home/LandingHero';
import { Button } from '@/components/ui/button';
import { AccountEventSummary } from '@/types';
import { Language } from '@/utils/translations';

type EventLandingProps = {
  events: AccountEventSummary[];
  language: Language;
  onCreated: (id: string) => void;
  onOpenEvent: (id: string) => void;
  onLogout: () => void;
};

export default function EventLanding({ events, language, onCreated, onOpenEvent, onLogout }: EventLandingProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button onClick={onLogout} variant="outline" size="sm" className="h-9 font-bold cursor-pointer">
          <LogOut className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
        </Button>
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10">
        <LandingHero language={language} />
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6 items-start">
          <EventCreator onCreated={onCreated} />
          <EventListPanel events={events} language={language} onOpenEvent={onOpenEvent} />
        </div>
      </main>
      <footer className="py-6 border-t border-border text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/10 dark:bg-black/40 z-10 shrink-0">
        © {new Date().getFullYear()} Bữa Nào Cafe? — group scheduling made simple.
      </footer>
    </div>
  );
}
