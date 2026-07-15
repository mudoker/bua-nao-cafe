"use client";

import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { Calendar, Clock, Lock, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { TOPICS, DESCRIPTIONS, ORGANIZERS } from '../services/mockData';

interface CreatorProps {
  onCreated: (id: string) => void;
}

export default function EventCreator({ onCreated }: CreatorProps) {
  const createEvent = useEventStore((state) => state.createEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);

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

  // Autofill topic generator
  const handleAutofill = () => {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const randomDesc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    const randomOrg = ORGANIZERS[Math.floor(Math.random() * ORGANIZERS.length)];
    
    setTitle(randomTopic);
    setDescription(randomDesc);
    setOrganizer(randomOrg);

    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
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
        dayOfWeek: d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { weekday: 'narrow' }),
        formatted: d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { month: 'short', day: 'numeric' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(language === 'en' ? 'Please enter an event title.' : 'Vui lòng điền tiêu đề cuộc họp.');
      return;
    }
    if (!organizer.trim()) {
      setError(language === 'en' ? 'Please enter your name as organizer.' : 'Vui lòng điền tên người tổ chức.');
      return;
    }
    if (selectedDates.length === 0) {
      setError(getTranslation(language, 'datesRequired'));
      return;
    }
    if (visibleHoursStart >= visibleHoursEnd) {
      setError(getTranslation(language, 'hourError'));
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

    joinAsParticipant(organizer.trim(), 'indigo', '👑', true);
    onCreated(eventId);
  };

  const calendarDays = getCalendarDays();

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
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === 6 || d.getDay() === 0) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }
    } else if (presetType === 'nextweek') {
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
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground m-0 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            <span>{getTranslation(language, 'createTitle')}</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold">
            {getTranslation(language, 'createSub')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Switcher inside card */}
          <div className="flex items-center bg-muted dark:bg-zinc-800 rounded-lg p-0.5 border border-border text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === 'en' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                language === 'vi' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              VI
            </button>
          </div>

          <button
            type="button"
            onClick={handleAutofill}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{getTranslation(language, 'quickAutofill')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-lg animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Core Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="creator-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {getTranslation(language, 'meetingTitle')} <span className="text-destructive">*</span>
              </label>
              <input
                id="creator-title"
                type="text"
                required
                placeholder="e.g., Q3 Alignment Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="creator-org" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {getTranslation(language, 'organizerName')} <span className="text-destructive">*</span>
              </label>
              <input
                id="creator-org"
                type="text"
                required
                placeholder="e.g., Sarah Jenkins"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="creator-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {getTranslation(language, 'description')}{' '}
                <span className="text-[10px] lowercase font-medium">({getTranslation(language, 'optional')})</span>
              </label>
              <textarea
                id="creator-desc"
                placeholder="Add details, agenda or context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Right Column: Date Picker & Presets */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                {getTranslation(language, 'selectDates')} <span className="text-destructive">*</span>
              </span>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => applyPreset('3days')}
                  className="px-2.5 py-1 text-[10px] rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold cursor-pointer transition-all"
                >
                  {getTranslation(language, 'next3Days')}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('nextweek')}
                  className="px-2.5 py-1 text-[10px] rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold cursor-pointer transition-all"
                >
                  {getTranslation(language, 'nextWeek')}
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('weekend')}
                  className="px-2.5 py-1 text-[10px] rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold cursor-pointer transition-all"
                >
                  {getTranslation(language, 'thisWeekend')}
                </button>
              </div>

              {/* Date selection grid */}
              <div className="grid grid-cols-7 gap-1 border border-border rounded-xl p-2.5 bg-background">
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
                      className={`h-9 w-full flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all text-xs font-bold ${
                        isSelected
                          ? 'bg-primary text-white scale-[1.03] shadow-sm'
                          : day.isWeekend
                          ? 'bg-muted/30 text-muted-foreground hover:bg-muted dark:bg-muted/10'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span>{day.dayOfMonth}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-2 block font-semibold">
                {selectedDates.length === 0
                  ? (language === 'en' ? 'No dates selected.' : 'Chưa chọn ngày nào.')
                  : `${selectedDates.length} ${language === 'en' ? 'date(s) selected: ' : 'ngày đã chọn: '}${selectedDates
                      .map((d) => d.slice(5))
                      .join(', ')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Mid section: Grid Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <label htmlFor="visibleHoursStart" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              {getTranslation(language, 'dailyStart')}
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <select
                id="visibleHoursStart"
                value={visibleHoursStart}
                onChange={(e) => setVisibleHoursStart(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
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
            <label htmlFor="visibleHoursEnd" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              {getTranslation(language, 'dailyEnd')}
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <select
                id="visibleHoursEnd"
                value={visibleHoursEnd}
                onChange={(e) => setVisibleHoursEnd(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
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
            <label htmlFor="slotDuration" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              {getTranslation(language, 'slotDuration')}
            </label>
            <select
              id="slotDuration"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
            >
              <option value={15}>{getTranslation(language, 'durationMinutes', { min: 15 })}</option>
              <option value={30}>{getTranslation(language, 'durationMinutes', { min: 30 })}</option>
              <option value={60}>{getTranslation(language, 'durationMinutes', { min: 60 })}</option>
            </select>
          </div>
        </div>

        {/* Progressive Disclosure (Advanced settings) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-all cursor-pointer outline-none uppercase tracking-wider"
          >
            <span>{showAdvanced ? getTranslation(language, 'hideAdvanced') : getTranslation(language, 'showAdvanced')}</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 dark:bg-muted/10 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideDown">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {getTranslation(language, 'prefWorkingHours')}
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={preferredStart}
                    onChange={(e) => setPreferredStart(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground font-bold">to</span>
                  <select
                    value={preferredEnd}
                    onChange={(e) => setPreferredEnd(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
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
                <label htmlFor="bufferMinutes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {getTranslation(language, 'meetingBuffer')}
                </label>
                <select
                  id="bufferMinutes"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value={0}>{getTranslation(language, 'noBuffer')}</option>
                  <option value={10}>{getTranslation(language, 'bufferMins', { min: 10 })}</option>
                  <option value={15}>{getTranslation(language, 'bufferMins', { min: 15 })}</option>
                  <option value={30}>{getTranslation(language, 'bufferMins', { min: 30 })}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="deadline" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {getTranslation(language, 'responseDeadline')}
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maxParticipants" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {getTranslation(language, 'maxParticipants')}
                </label>
                <input
                  id="maxParticipants"
                  type="number"
                  placeholder={getTranslation(language, 'noLimit')}
                  value={maxParticipants || ''}
                  onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
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
                <label htmlFor="includeWeekends" className="text-xs font-bold text-foreground cursor-pointer select-none">
                  {getTranslation(language, 'includeWeekends')}
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
                <label htmlFor="isPrivate" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1 select-none">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span>{getTranslation(language, 'passwordProtect')}</span>
                </label>
              </div>

              {isPrivate && (
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {getTranslation(language, 'securityPassword')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
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
          <span>{getTranslation(language, 'generateWorkspace')}</span>
        </button>
      </form>
    </div>
  );
}
