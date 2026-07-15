"use client";

import { AvatarPickerProps } from './OnboardingPicker.types';

export default function AvatarPicker({ avatars, selectedAvatar, onSelectAvatar, label }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{label}</label>
      <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto py-1">
        {avatars.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => onSelectAvatar(avatar)}
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
  );
}
