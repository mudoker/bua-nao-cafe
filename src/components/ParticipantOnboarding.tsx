"use client";

import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { COLORS, AVATARS } from '../services/mockData';
import { Users, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OnboardingProps {
  onJoinSuccess?: () => void;
}

export default function ParticipantOnboarding({ onJoinSuccess }: OnboardingProps) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);
  const language = useEventStore((state) => state.language);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  if (!currentEvent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(getTranslation(language, 'nameError'));
      return;
    }
    if (name.length > 25) {
      setError(getTranslation(language, 'nameTooLong'));
      return;
    }
    setError('');
    joinAsParticipant(name.trim(), selectedColor, selectedAvatar);
    if (onJoinSuccess) onJoinSuccess();
  };

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
    <Card className="w-full max-w-md mx-auto shadow-xl border-border glow-primary">
      <CardHeader className="flex flex-col items-center text-center pb-2">
        <div className="p-3 bg-primary/10 rounded-full mb-3 border border-primary/20">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
          {getTranslation(language, 'joinWorkspace')}
        </span>
        <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">
          {currentEvent.title}
        </CardTitle>
        {currentEvent.description && (
          <CardDescription className="text-xs font-semibold text-muted-foreground mt-2 max-w-xs line-clamp-2">
            {currentEvent.description}
          </CardDescription>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-2">
          {/* Name input */}
          <div className="space-y-2">
            <label htmlFor="participant-name" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {getTranslation(language, 'displayName')}
            </label>
            <Input
              id="participant-name"
              type="text"
              required
              placeholder={getTranslation(language, 'namePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="font-semibold text-foreground py-5"
            />
            {error && <p className="text-xs text-destructive font-bold mt-1">{error}</p>}
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {getTranslation(language, 'chooseTheme')}
            </label>
            <div className="flex flex-wrap gap-2.5 py-1 justify-center md:justify-start">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-all ${getColorClass(color)} ${
                    selectedColor === color ? 'ring-4 scale-110 shadow-md border-2 border-card' : ''
                  }`}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>

          {/* Avatar/Emoji Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {getTranslation(language, 'selectAvatar')}
            </label>
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
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer hover:scale-[1.005] active:scale-[0.995] transition-all py-6"
          >
            <span>{getTranslation(language, 'enterScheduler')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold pt-2 border-t border-border w-full">
            <Users className="w-4 h-4" />
            <span>{getTranslation(language, 'noRegistration')}</span>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
