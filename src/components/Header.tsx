"use client";
import { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import ThemeToggle from './ThemeToggle';
import { Copy, Check, QrCode, Play, Square, Undo2, Redo2, Trash2, CheckSquare, Sparkles, Share2, LogOut, Clock, Shield } from 'lucide-react';

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

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!currentEvent) return null;

  const inviteUrl = `${window.location.origin}/?event=${currentEvent.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQRDataUrl = () => {
    // Return a beautiful pre-designed mock QR code SVG (using pure SVG)
    return (
      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="10" fill="#ffffff" />
        {/* Outer boxes */}
        <rect x="10" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="15" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        <rect x="65" y="10" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="70" y="15" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        <rect x="10" y="65" width="25" height="25" rx="3" stroke="#4f46e5" strokeWidth="6" fill="none" />
        <rect x="15" y="70" width="15" height="15" rx="1.5" fill="#4f46e5" />
        
        {/* Mock QR details */}
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
    <header className="w-full border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-xl hidden md:block">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground m-0">{currentEvent.title}</h1>
              {currentEvent.isPrivate && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Private</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5 font-medium">
              <span>Organized by <strong className="text-foreground font-semibold">{currentEvent.organizer}</strong></span>
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full hidden sm:inline" />
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{currentEvent.timezone}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Realtime simulator */}
          <button
            onClick={() => toggleSimulation(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSimulating
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 pulse-emerald'
                : 'bg-background border-border text-muted-foreground hover:bg-muted/80'
            }`}
            title="Simulate other users joining and updating schedules in real time"
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="flex items-center gap-1">
              <span>Simulation</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
            </span>
          </button>

          {/* Copy link */}
          <div className="flex items-center">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-semibold bg-background border border-border text-foreground hover:bg-muted/80 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Invitation'}</span>
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-2.5 py-1.5 rounded-r-lg bg-background border-y border-r border-border text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>

          <ThemeToggle />

          {/* Exit Event workspace */}
          <button
            onClick={resetEvent}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* QR Modal Overlay */}
      {showQR && (
        <div className="absolute right-4 md:right-24 top-16 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50 text-slate-800 flex flex-col items-center gap-2 max-w-xs transition-all">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-400">Share QR Code</div>
          {getQRDataUrl()}
          <span className="text-[10px] text-center text-slate-400 font-medium">Scan with camera to join instantly</span>
          <button
            onClick={() => setShowQR(false)}
            className="mt-1 px-3 py-1 text-[10px] font-bold border border-slate-200 rounded hover:bg-slate-50 transition-all cursor-pointer w-full text-center"
          >
            Close
          </button>
        </div>
      )}

      {/* Editing Toolbelt (displays if logged in) */}
      {currentUser && (
        <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentUser.avatar}</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {currentUser.isCompleted ? 'Availability submitted' : 'Editing schedule...'}
              </span>
            </div>
          </div>

          {/* Tool actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={undoStack.length <= 1}
              className="p-1.5 rounded bg-background border border-border text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Undo edit"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded bg-background border border-border text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Redo edit"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearCurrentAvailability}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-background border border-border text-foreground hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer text-[11px] font-semibold"
              title="Clear all selected slots"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={fillCurrentAvailability}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-primary text-white hover:bg-primary/95 transition-all cursor-pointer text-[11px] font-semibold"
              title="Select all slots in grid"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
