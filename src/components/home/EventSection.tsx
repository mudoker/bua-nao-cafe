"use client";

import { EventSectionProps } from './EventSection.types';

export default function EventSection({ title, emptyText, events, onOpenEvent, muted }: EventSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpenEvent(event.id)}
          className={`w-full text-left p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer ${muted ? 'opacity-80' : ''}`}
        >
          <span className="block text-xs font-bold text-foreground">{event.title}</span>
          <span className="block text-[10px] font-semibold text-muted-foreground mt-1">
            {event.finalizedSlot || event.dates.join(', ')}
          </span>
        </button>
      ))}
      {events.length === 0 && <p className="text-xs font-semibold text-muted-foreground">{emptyText}</p>}
    </div>
  );
}
