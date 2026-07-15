"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { Calendar, Clock, Lock, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { TOPICS, DESCRIPTIONS, ORGANIZERS } from '../services/mockData';

interface CreatorProps {
  onCreated: (id: string) => void;
}

export default function EventCreator({ onCreated }: CreatorProps) {
  const createEvent = useEventStore((state) => state.createEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [visibleHoursStart, setVisibleHoursStart] = useState(9); // 9 AM
  const [visibleHoursEnd, setVisibleHoursEnd] = useState(17); // 5 PM
  const [slotDuration, setSlotDuration] = useState(30); // 30 mins
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(0);

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [deadline, setDeadline] = useState('');
  const [preferredStart, setPreferredStart] = useState(9);
  const [preferredEnd, setPreferredEnd] = useState(17);

  const [error, setError] = useState('');

  // Auto-generate some placeholder values to enable 15-second creation
  const handleAutofill = () => {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const randomDesc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    const randomOrg = ORGANIZERS[Math.floor(Math.random() * ORGANIZERS.length)];
    
    setTitle(randomTopic);
    setDescription(randomDesc);
    setOrganizer(randomOrg);

    // Default dates: today and next 2 days
    const dates: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setSelectedDates(dates);
  };

  const handleDateToggle = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr].sort());
    }
  };

  // Generate calendar days for selection (current month starting today)
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter an event title.');
      return;
    }
    if (!organizer.trim()) {
      setError('Please enter your name as organizer.');
      return;
    }
    if (selectedDates.length === 0) {
      setError('Please select at least one date on the calendar.');
      return;
    }
    if (visibleHoursStart >= visibleHoursEnd) {
      setError('Start hour must be earlier than end hour.');
      return;
    }

    const eventId = createEvent({
      title: title.trim(),
      description: description.trim(),
      organizer: organizer.trim(),
      timezone,
      dates: selectedDates,
      visibleHoursStart,
      visibleHoursEnd,
      slotDuration,
      isPrivate,
      password: password || undefined,
      maxParticipants,
      deadline: deadline || undefined,
      preferredWorkingHoursStart: preferredStart,
      preferredWorkingHoursEnd: preferredEnd,
      includeWeekends,
      bufferMinutes,
    });

    // Auto-join the organizer as the host participant
    joinAsParticipant(organizer.trim(), 'indigo', '👑', true);

    onCreated(eventId);
  };

  const calendarDays = getCalendarDays();

  // Presets
  const applyPreset = (presetType: 'weekend' | '3days' | 'nextweek') => {
    const dates: string[] = [];
    const today = new Date();

    if (presetType === '3days') {
      for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else if (presetType === 'weekend') {
      // Find upcoming Saturday & Sunday
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === 6 || d.getDay() === 0) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }
    } else if (presetType === 'nextweek') {
      // Next 5 weekdays
      let added = 0;
      let check = 0;
      while (added < 5 && check < 10) {
        const d = new Date(today);
        d.setDate(today.getDate() + check);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dates.push(d.toISOString().split('T')[0]);
          added++;
        }
        check++;
      }
    }

    setSelectedDates(dates.sort());
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl relative glow-primary transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground m-0 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            <span>Create New Schedule</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your event and share the link instantly.</p>
        </div>
        <button
          type="button"
          onClick={handleAutofill}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Autofill</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Core Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="creator-title" className="text-sm font-medium text-foreground">
                Meeting Title <span className="text-destructive">*</span>
              </label>
              <input
                id="creator-title"
                type="text"
                required
                placeholder="e.g., Q3 Alignment Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="creator-org" className="text-sm font-medium text-foreground">
                Your Name (Organizer) <span className="text-destructive">*</span>
              </label>
              <input
                id="creator-org"
                type="text"
                required
                placeholder="e.g., Sarah Jenkins"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="creator-desc" className="text-sm font-medium text-foreground">
                Description / Notes <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <textarea
                id="creator-desc"
                placeholder="Add details, agenda or context for participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Right Column: Date Picker & Presets */}
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-foreground block mb-2">
                Select Dates <span className="text-destructive">*</span>
              </span>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => applyPreset('3days')}
                  className="px-2.5 py-1 text-xs rounded border border-border bg-background text-foreground hover:bg-muted font-medium cursor-pointer transition-all"
                >
                  Next 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('nextweek')}
                  className="px-2.5 py-1 text-xs rounded border border-border bg-background text-foreground hover:bg-muted font-medium cursor-pointer transition-all"
                >
                  Next Week
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('weekend')}
                  className="px-2.5 py-1 text-xs rounded border border-border bg-background text-foreground hover:bg-muted font-medium cursor-pointer transition-all"
                >
                  This Weekend
                </button>
              </div>

              {/* Custom Date selection grid */}
              <div className="grid grid-cols-7 gap-1 border border-border rounded-lg p-2.5 bg-background">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <span key={i} className="text-[10px] font-bold text-muted-foreground text-center select-none py-1">
                    {day}
                  </span>
                ))}
                {calendarDays.map((day) => {
                  const isSelected = selectedDates.includes(day.dateStr);
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => handleDateToggle(day.dateStr)}
                      className={`h-9 w-full flex flex-col items-center justify-center rounded-md cursor-pointer transition-all text-xs font-semibold ${
                        isSelected
                          ? 'bg-primary text-white scale-[1.03]'
                          : day.isWeekend
                          ? 'bg-muted/30 text-muted-foreground hover:bg-muted'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span>{day.dayOfMonth}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1.5 block">
                {selectedDates.length === 0
                  ? 'No dates selected.'
                  : `${selectedDates.length} date(s) selected: ${selectedDates
                      .map((d) => d.slice(5))
                      .join(', ')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Mid section: Grid Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <label htmlFor="visibleHoursStart" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Daily Start Hour
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <select
                id="visibleHoursStart"
                value={visibleHoursStart}
                onChange={(e) => setVisibleHoursStart(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="visibleHoursEnd" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Daily End Hour
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <select
                id="visibleHoursEnd"
                value={visibleHoursEnd}
                onChange={(e) => setVisibleHoursEnd(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slotDuration" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Slot Duration
            </label>
            <select
              id="slotDuration"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>
        </div>

        {/* Progressive Disclosure (Advanced settings) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-all cursor-pointer outline-none"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Preferred Working Hours
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={preferredStart}
                    onChange={(e) => setPreferredStart(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground font-semibold">to</span>
                  <select
                    value={preferredEnd}
                    onChange={(e) => setPreferredEnd(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bufferMinutes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Meeting Buffer between slots
                </label>
                <select
                  id="bufferMinutes"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value={0}>No buffer (0 mins)</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="deadline" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Response Deadline
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maxParticipants" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Max Participants
                </label>
                <input
                  id="maxParticipants"
                  type="number"
                  placeholder="No limit"
                  value={maxParticipants || ''}
                  onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="includeWeekends"
                  checked={includeWeekends}
                  onChange={(e) => setIncludeWeekends(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="includeWeekends" className="text-xs font-medium text-foreground cursor-pointer">
                  Include Weekends in availability grid
                </label>
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer w-4 h-4"
                />
                <label htmlFor="isPrivate" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span>Password Protect Workspace</span>
                </label>
              </div>

              {isPrivate && (
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Security Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Submit button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white bg-primary hover:bg-primary/95 hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer shadow-lg shadow-primary/20 text-sm"
        >
          <span>Generate Collaborative Workspace</span>
        </button>
      </form>
    </div>
  );
}
