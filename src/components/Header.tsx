"use client";

import { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import ThemeToggle from './ThemeToggle';
import { Home, Share2, LogOut, Clock, Shield, Menu, X } from 'lucide-react';
import EventEditDialog from './event-editor/EventEditDialog';
import HeaderShareControls from './header/HeaderShareControls';
import HeaderToolbelt from './header/HeaderToolbelt';
import { Button } from '@/components/ui/button';

export default function Header() {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const resetEvent = useEventStore((state) => state.resetEvent);
  const logout = useEventStore((state) => state.logout);
  const updateEventDetails = useEventStore((state) => state.updateEventDetails);
  const undo = useEventStore((state) => state.undo);
  const redo = useEventStore((state) => state.redo);
  const clearCurrentAvailability = useEventStore((state) => state.clearCurrentAvailability);
  const fillCurrentAvailability = useEventStore((state) => state.fillCurrentAvailability);
  const undoStack = useEventStore((state) => state.undoStack);
  const redoStack = useEventStore((state) => state.redoStack);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);

  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!currentEvent) return null;

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/?event=${currentEvent.id}` : '';

  const handleShare = () => {
    const textMessage = language === 'en'
      ? `☕️ Bữa Nào Cafe? Help us find the best time to meet!\n📅 Topic: ${currentEvent.title}\n👉 Fill in your free hours here:`
      : `☕️ Bữa Nào Cafe? Hãy chọn giờ rảnh của bạn để chọn lịch hẹn nhé!\n📅 Chủ đề: ${currentEvent.title}\n👉 Chọn giờ rảnh của bạn ở đây:`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: '☕️ Bữa Nào Cafe?',
        text: textMessage,
        url: inviteUrl,
      }).catch(() => {
        handleCopyFallback(textMessage);
      });
    } else {
      handleCopyFallback(textMessage);
    }
  };

  const handleCopyFallback = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${text}\n${inviteUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackHome = () => {
    resetEvent();
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.delete('event');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <header className="w-full border-b border-border/80 bg-card/75 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 md:px-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Info */}
        <div className="flex items-start justify-between w-full md:w-auto gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-xl hidden md:block border border-primary/20">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground m-0">{currentEvent.title}</h1>
                {currentEvent.isPrivate && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{language === 'en' ? 'Private' : 'Riêng tư'}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5 font-medium">
                <span>
                  {language === 'en' ? 'Organized by' : 'Tổ chức bởi'}{' '}
                  <strong className="text-foreground font-semibold">{currentEvent.organizer}</strong>
                </span>
                <span className="w-1 h-1 bg-muted-foreground/40 rounded-full hidden sm:inline" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentEvent.timezone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mobile-Only Actions: Share & Hamburger menu */}
          <div className="flex items-center gap-2 md:hidden">
            <HeaderShareControls copied={copied} language={language} onShare={handleShare} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9 rounded-xl border-border flex items-center justify-center cursor-pointer shrink-0"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-foreground" />
              ) : (
                <Menu className="w-4 h-4 text-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Action controls (Desktop view only, hidden on mobile) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            onClick={handleBackHome}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 font-bold cursor-pointer h-9"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'en' ? 'Home' : 'Trang chủ'}</span>
          </Button>

          {currentUser?.isHost && (
            <EventEditDialog event={currentEvent} language={language} onSave={updateEventDetails} />
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-muted/60 dark:bg-muted/30 rounded-lg p-0.5 border border-border text-xs shrink-0 font-bold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              VI
            </button>
          </div>

          <HeaderShareControls copied={copied} language={language} onShare={handleShare} />
          <ThemeToggle />

          {/* Account logout */}
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
          </Button>
        </div>
      </div>

      {/* Floating Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-4 left-4 mt-2 p-4 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col gap-4 animate-fade-in md:hidden">
          <Button
            onClick={() => {
              handleBackHome();
              setIsMenuOpen(false);
            }}
            variant="outline"
            size="sm"
            className="flex w-full items-center justify-center gap-2 font-bold cursor-pointer h-10"
          >
            <Home className="w-4 h-4" />
            <span>{language === 'en' ? 'Home' : 'Trang chủ'}</span>
          </Button>

          {currentUser?.isHost && (
            <div onClick={() => setIsMenuOpen(false)}>
              <EventEditDialog event={currentEvent} language={language} onSave={updateEventDetails} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-b border-border/50 py-3 px-1">
            <div className="flex items-center bg-muted/60 dark:bg-muted/30 rounded-lg p-0.5 border border-border text-xs font-bold w-full max-w-[100px]">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer w-1/2 ${
                  language === 'en'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('vi')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer w-1/2 ${
                  language === 'vi'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                VI
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">
                {language === 'en' ? 'Theme' : 'Giao diện'}
              </span>
              <ThemeToggle />
            </div>
          </div>

          <Button
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-center gap-2 font-bold cursor-pointer text-destructive hover:bg-destructive/10 h-10 border border-destructive/20"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'en' ? 'Log out' : 'Đăng xuất'}</span>
          </Button>
        </div>
      )}

      {currentUser && (
        <div className="hidden sm:block">
          <HeaderToolbelt
            currentUser={currentUser}
            language={language}
            undoStackLength={undoStack.length}
            redoStackLength={redoStack.length}
            onUndo={undo}
            onRedo={redo}
            onClear={clearCurrentAvailability}
            onFill={fillCurrentAvailability}
          />
        </div>
      )}
    </header>
  );
}
