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
import { ArrowRight, Calendar, Sparkles, Zap, ShieldCheck, Grid as GridIcon, Users, Lightbulb, BarChart3, Coffee, LockKeyhole, LogOut, UserRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AccountLogin() {
  const login = useEventStore((state) => state.login);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(language === 'en' ? 'Please enter a username.' : 'Vui lòng nhập tên đăng nhập.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    await login(name.trim(), password || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black leading-none">Bữa Nào Cafe?</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {language === 'en' ? 'Group scheduling' : 'Lên lịch nhóm'}
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span>{language === 'en' ? 'Welcome back' : 'Chào mừng trở lại'}</span>
                  </p>
                  <h2 className="m-0 text-2xl font-black tracking-normal text-foreground">
                    {language === 'en' ? 'Enter your board' : 'Vào bảng lịch của bạn'}
                  </h2>
                  <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
                    {language === 'en'
                      ? 'Use the same name to see previous and pending events.'
                      : 'Dùng cùng một tên để xem lịch cũ và lịch đang chờ.'}
                  </p>
                </div>
                <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-[10px] font-black">
                  <button type="button" onClick={() => setLanguage('en')} className={`px-2.5 py-1 rounded-md cursor-pointer ${language === 'en' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    EN
                  </button>
                  <button type="button" onClick={() => setLanguage('vi')} className={`px-2.5 py-1 rounded-md cursor-pointer ${language === 'vi' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    VI
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="account-name" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    {language === 'en' ? 'Username' : 'Tên đăng nhập'}
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="account-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder={language === 'en' ? 'e.g., Minh Nguyen' : 'VD: Nguyễn Minh'}
                      className="h-12 pl-9 pr-3 font-bold"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="account-password" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    {language === 'en' ? 'Password optional' : 'Mật khẩu tùy chọn'}
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="account-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder={language === 'en' ? 'Protect host access' : 'Bảo vệ quyền chủ lịch'}
                      className="h-12 pl-9 pr-3 font-bold"
                    />
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full h-12 justify-between px-4 font-black cursor-pointer" disabled={isSubmitting}>
                  <span>{isSubmitting ? (language === 'en' ? 'Entering...' : 'Đang vào...') : (language === 'en' ? 'Continue' : 'Tiếp tục')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  
  const account = useEventStore((state) => state.account);
  const accountEvents = useEventStore((state) => state.accountEvents);
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const loadEvent = useEventStore((state) => state.loadEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);
  const loadAccountEvents = useEventStore((state) => state.loadAccountEvents);
  const logout = useEventStore((state) => state.logout);
  const language = useEventStore((state) => state.language);

  // Active tab state for mobile view
  const [activeMobileTab, setActiveMobileTab] = useState<'grid' | 'team' | 'suggestions' | 'charts'>('grid');
  const handleMobileTabChange = (value: string) => {
    if (value === 'grid' || value === 'team' || value === 'suggestions' || value === 'charts') {
      setActiveMobileTab(value);
    }
  };

  // Load event from local storage if query param is present
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
    if (!account || !currentEvent || currentUser) return;

    try {
      joinAsParticipant(account.name, 'indigo', '☕', account.password);
    } catch (error) {
      console.error('Failed to enter event as account:', error);
    }
  }, [account, currentEvent, currentUser, joinAsParticipant]);

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

  const openEvent = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    window.history.pushState({}, '', url.toString());
    loadEvent(id);
  };

  if (!account) {
    return <AccountLogin />;
  }

  // State 1: No Event Loaded (Show Creator & Landing)
  if (!currentEvent) {
    const pendingEvents = accountEvents.filter((event) => event.isPending);
    const previousEvents = accountEvents.filter((event) => !event.isPending);

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Button onClick={logout} variant="outline" size="sm" className="h-9 font-bold cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
          </Button>
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

          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6 items-start">
            <EventCreator onCreated={handleEventCreated} />
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{language === 'en' ? 'Your events' : 'Lịch của bạn'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {accountEvents.length === 0 ? (
                  <p className="text-xs font-semibold text-muted-foreground">
                    {language === 'en' ? 'No saved events for this account yet.' : 'Chưa có lịch nào cho tài khoản này.'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'en' ? 'Pending' : 'Đang chờ'}
                      </p>
                      {(pendingEvents.length ? pendingEvents : []).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openEvent(event.id)}
                          className="w-full text-left p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <span className="block text-xs font-bold text-foreground">{event.title}</span>
                          <span className="block text-[10px] font-semibold text-muted-foreground mt-1">{event.dates.join(', ')}</span>
                        </button>
                      ))}
                      {pendingEvents.length === 0 && <p className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Nothing pending.' : 'Không có lịch đang chờ.'}</p>}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {language === 'en' ? 'Previous' : 'Đã qua'}
                      </p>
                      {previousEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openEvent(event.id)}
                          className="w-full text-left p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer opacity-80"
                        >
                          <span className="block text-xs font-bold text-foreground">{event.title}</span>
                          <span className="block text-[10px] font-semibold text-muted-foreground mt-1">{event.finalizedSlot || event.dates.join(', ')}</span>
                        </button>
                      ))}
                      {previousEvents.length === 0 && <p className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'No previous events.' : 'Chưa có lịch đã qua.'}</p>}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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
          onValueChange={handleMobileTabChange}
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
