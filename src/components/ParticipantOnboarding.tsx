"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { COLORS, AVATARS } from '../services/mockData';
import { Users, Calendar, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onJoinSuccess?: () => void;
}

export default function ParticipantOnboarding({ onJoinSuccess }: OnboardingProps) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  if (!currentEvent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (name.length > 25) {
      setError('Name is too long (max 25 characters)');
      return;
    }
    setError('');
    joinAsParticipant(name.trim(), selectedColor, selectedAvatar);
    if (onJoinSuccess) onJoinSuccess();
  };

  // Map tailwind color names to actual hex/rgb borders
  const getColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      indigo: 'bg-indigo-500 hover:bg-indigo-600 ring-indigo-300 dark:ring-indigo-800',
      emerald: 'bg-emerald-500 hover:bg-emerald-600 ring-emerald-300 dark:ring-emerald-800',
      rose: 'bg-rose-500 hover:bg-rose-600 ring-rose-300 dark:ring-rose-800',
      amber: 'bg-amber-500 hover:bg-amber-600 ring-amber-300 dark:ring-amber-800',
      sky: 'bg-sky-500 hover:bg-sky-600 ring-sky-300 dark:ring-sky-800',
      violet: 'bg-violet-500 hover:bg-violet-600 ring-violet-300 dark:ring-violet-800',
      fuchsia: 'bg-fuchsia-500 hover:bg-fuchsia-600 ring-fuchsia-300 dark:ring-fuchsia-800',
      orange: 'bg-orange-500 hover:bg-orange-600 ring-orange-300 dark:ring-orange-800',
    };
    return map[colorName] || 'bg-slate-500';
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 rounded-2xl border border-border bg-card shadow-xl glow-primary">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="p-3 bg-primary/10 rounded-full mb-3">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Join Event Workspace</span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{currentEvent.title}</h2>
        {currentEvent.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-xs">{currentEvent.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name input */}
        <div className="space-y-2">
          <label htmlFor="participant-name" className="text-sm font-medium text-foreground">
            Display Name
          </label>
          <input
            id="participant-name"
            type="text"
            required
            placeholder="e.g., Jane Cooper"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
          />
          {error && <p className="text-xs text-destructive font-medium mt-1">{error}</p>}
        </div>

        {/* Color Palette Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">Choose Personal Theme</label>
          <div className="flex flex-wrap gap-3 py-1 justify-center md:justify-start">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full cursor-pointer transition-all ${getColorClass(color)} ${
                  selectedColor === color ? 'ring-4 scale-110 shadow-md border-2 border-card' : ''
                }`}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
        </div>

        {/* Avatar/Emoji Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">Select Avatar Emoji</label>
          <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto md:mx-0 py-1">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => setSelectedAvatar(avatar)}
                className={`p-2 text-xl rounded-lg cursor-pointer bg-background hover:bg-muted border border-border transition-all flex items-center justify-center ${
                  selectedAvatar === avatar
                    ? 'ring-2 ring-primary bg-primary/10 border-primary scale-110'
                    : 'hover:scale-105'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] text-sm"
        >
          <span>Enter Scheduler</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Users className="w-3.5 h-3.5" />
        <span>No password or account required</span>
      </div>
    </div>
  );
}
