"use client";

import { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import ThemeToggle from './ThemeToggle';
import { getTranslation } from '../utils/translations';
import { Copy, Check, QrCode, Play, Square, Undo2, Redo2, Trash2, CheckSquare, Share2, LogOut, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useEventStore((state) => state.currentUser);
  const resetEvent = useEventStore((state) => state.resetEvent);
  const undo = useEventStore((state) => state.undo);
  const redo = useEventStore((state) => state.redo);
  const clearCurrentAvailability = useEventStore((state) => state.clearCurrentAvailability);
  const fillCurrentAvailability = useEventStore((state) => state.fillCurrentAvailability);
  const isSimulating = useEventStore((state) => state.isSimulating);
  const toggleSimulation = useEventStore((state) => state.toggleSimulation);
  const undoStack = useEventStore((state) => state.undoStack);
  const redoStack = useEventStore((state) => state.redoStack);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!currentEvent) return null;

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/?event=${currentEvent.id}` : '';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getQRDataUrl = () => {
    return (
      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="10" fill="#ffffff" />
        <rect x="10" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="15" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        <rect x="65" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="70" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        <rect x="10" y="65" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="15" y="70" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        <rect x="45" y="15" width="6" height="6" fill="#09090b" />
        <rect x="52" y="10" width="6" height="12" fill="#09090b" />
        <rect x="45" y="25" width="12" height="6" fill="#4f46e5" />
        <rect x="70" y="45" width="6" height="12" fill="#09090b" />
        <rect x="80" y="52" width="6" height="6" fill="#09090b" />
        <rect x="15" y="45" width="12" height="6" fill="#09090b" />
        <rect x="25" y="52" width="6" height="10" fill="#4f46e5" />
        
        <rect x="42" y="42" width="16" height="16" rx="2" fill="#4f46e5" />
        <text x="50" y="52" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">W2M</text>
        
        <rect x="45" y="65" width="12" height="6" fill="#09090b" />
        <rect x="45" y="75" width="6" height="12" fill="#09090b" />
        <rect x="54" y="80" width="10" height="6" fill="#4f46e5" />
        <rect x="70" y="70" width="15" height="15" fill="#09090b" />
      </svg>
    );
  };

  return (
    <header className="w-full border-b border-border/80 bg-card/75 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Info */}
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

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* Realtime simulator */}
          <Button
            onClick={() => toggleSimulation(!isSimulating)}
            variant={isSimulating ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
              isSimulating ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white pulse-emerald' : ''
            }`}
            title={language === 'en' ? 'Simulate live responses' : 'Mô phỏng phản hồi thời gian thực'}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="flex items-center gap-1">
              <span>{getTranslation(language, 'simulation')}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-emerald-200' : 'bg-muted-foreground/50'}`} />
            </span>
          </Button>

          {/* Copy link */}
          <div className="flex items-center">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0 font-bold cursor-pointer h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? getTranslation(language, 'copiedLink') : getTranslation(language, 'copyInvite')}</span>
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              size="icon"
              className="rounded-l-none cursor-pointer h-9 w-9"
              title={getTranslation(language, 'qrCode')}
            >
              <QrCode className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ThemeToggle />

          {/* Exit Event workspace */}
          <Button
            onClick={resetEvent}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{getTranslation(language, 'exit')}</span>
          </Button>
        </div>
      </div>

      {/* QR Modal Overlay */}
      {showQR && (
        <div className="absolute right-4 md:right-24 top-16 bg-white dark:bg-zinc-950 border border-border rounded-xl p-4 shadow-xl z-50 text-slate-800 dark:text-zinc-100 flex flex-col items-center gap-2 max-w-xs transition-all animate-fadeIn glow-primary">
          <div className="text-center font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {getTranslation(language, 'qrCode')}
          </div>
          {getQRDataUrl()}
          <span className="text-[10px] text-center text-slate-400 dark:text-zinc-500 font-medium">
            {getTranslation(language, 'scanQr')}
          </span>
          <Button
            onClick={() => setShowQR(false)}
            variant="outline"
            size="sm"
            className="mt-1 font-bold cursor-pointer w-full text-center text-foreground"
          >
            {language === 'en' ? 'Close' : 'Đóng'}
          </Button>
        </div>
      )}

      {/* Editing Toolbelt (displays if logged in) */}
      {currentUser && (
        <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-card border border-border p-1 rounded-lg shadow-sm">{currentUser.avatar}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                {currentUser.isCompleted ? getTranslation(language, 'availSubmitted') : getTranslation(language, 'editingSchedule')}
              </span>
            </div>
          </div>

          {/* Tool actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={undoStack.length <= 1}
              className="h-8 w-8 cursor-pointer rounded-lg"
              title={language === 'en' ? 'Undo edit' : 'Hoàn tác'}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="h-8 w-8 cursor-pointer rounded-lg"
              title={language === 'en' ? 'Redo edit' : 'Làm lại'}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCurrentAvailability}
              className="text-[11px] font-bold border-border/80 hover:bg-red-500/10 hover:text-red-500 cursor-pointer h-8 px-3"
              title={language === 'en' ? 'Clear all selected slots' : 'Xóa sạch tất cả các ô đã chọn'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'clear')}</span>
            </Button>
            <Button
              onClick={fillCurrentAvailability}
              size="sm"
              className="text-[11px] font-bold cursor-pointer h-8 px-3"
              title={language === 'en' ? 'Select all slots in grid' : 'Chọn tất cả các ô trên lịch'}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'selectAll')}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
