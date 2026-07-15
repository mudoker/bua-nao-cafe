"use client";

import { ColorPickerProps } from './OnboardingPicker.types';

const colorClasses: Record<string, string> = {
  indigo: 'bg-indigo-500 hover:bg-indigo-600 ring-indigo-300 dark:ring-indigo-800',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 ring-emerald-300 dark:ring-emerald-800',
  rose: 'bg-rose-500 hover:bg-rose-600 ring-rose-300 dark:ring-rose-800',
  amber: 'bg-amber-500 hover:bg-amber-600 ring-amber-300 dark:ring-amber-800',
  sky: 'bg-sky-500 hover:bg-sky-600 ring-sky-300 dark:ring-sky-800',
  violet: 'bg-violet-500 hover:bg-violet-600 ring-violet-300 dark:ring-violet-800',
  fuchsia: 'bg-fuchsia-500 hover:bg-fuchsia-600 ring-fuchsia-300 dark:ring-fuchsia-800',
  orange: 'bg-orange-500 hover:bg-orange-600 ring-orange-300 dark:ring-orange-800',
};

export default function ColorPicker({ colors, selectedColor, onSelectColor, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground uppercase tracking-wider block">{label}</label>
      <div className="flex flex-wrap gap-2.5 py-1 justify-center">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelectColor(color)}
            className={`w-7 h-7 rounded-full cursor-pointer transition-all ${colorClasses[color] || 'bg-slate-500'} ${
              selectedColor === color ? 'ring-4 scale-110 shadow-md border-2 border-card' : ''
            }`}
            aria-label={`Select ${color} color`}
          />
        ))}
      </div>
    </div>
  );
}
