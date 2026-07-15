"use client";

import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { Calendar, Clock, Lock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreatorProps {
  onCreated: (id: string) => void;
}

export default function EventCreator({ onCreated }: CreatorProps) {
  const createEvent = useEventStore((state) => state.createEvent);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);
  const account = useEventStore((state) => state.account);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState(account?.name || '');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [visibleHoursStart, setVisibleHoursStart] = useState(9); // 9 AM
  const [visibleHoursEnd, setVisibleHoursEnd] = useState(17); // 5 PM
  const [slotDuration, setSlotDuration] = useState('30'); // stored as string to allow empty input
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
      slotDuration: Math.max(1, parseInt(slotDuration, 10) || 30),
      isPrivate,
      password: password || undefined,
      maxParticipants,
      deadline: deadline || undefined,
      preferredWorkingHoursStart: preferredStart,
      preferredWorkingHoursEnd: preferredEnd,
      includeWeekends,
      bufferMinutes,
    });

    joinAsParticipant(organizer.trim(), 'indigo', '👑', account?.password, true);
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

  const getHourLabel = (hour: number) => {
    return hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl relative border-border glow-primary">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border flex-wrap gap-4">
        <div>
          <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 m-0">
            <Calendar className="w-7 h-7 text-primary" />
            <span>{getTranslation(language, 'createTitle')}</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm font-semibold text-muted-foreground mt-1.5">
            {getTranslation(language, 'createSub')}
          </CardDescription>
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
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-5">
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
                <Input
                  id="creator-title"
                  type="text"
                  required
                  placeholder="e.g., Q3 Alignment Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-bold text-foreground h-11 px-3.5"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="creator-org" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {getTranslation(language, 'organizerName')} <span className="text-destructive">*</span>
                </label>
                <Input
                  id="creator-org"
                  type="text"
                  required
                  placeholder="e.g., Sarah Jenkins"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="font-bold text-foreground h-11 px-3.5"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="creator-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {getTranslation(language, 'description')}{' '}
                  <span className="text-[10px] lowercase font-medium">({getTranslation(language, 'optional')})</span>
                </label>
                <Textarea
                  id="creator-desc"
                  placeholder="Add details, agenda or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="font-semibold text-foreground resize-none"
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('3days')}
                    className="px-2.5 text-[10px] font-bold cursor-pointer h-7"
                  >
                    {getTranslation(language, 'next3Days')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('nextweek')}
                    className="px-2.5 text-[10px] font-bold cursor-pointer h-7"
                  >
                    {getTranslation(language, 'nextWeek')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset('weekend')}
                    className="px-2.5 text-[10px] font-bold cursor-pointer h-7"
                  >
                    {getTranslation(language, 'thisWeekend')}
                  </Button>
                </div>

                {/* Date selection grid */}
                <div className="grid grid-cols-7 gap-1 border border-border rounded-xl p-2.5 bg-background">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <span key={i} className="text-[10px] font-bold text-muted-foreground text-center select-none py-1">
                      {day}
                    </span>
                  ))}
                  {/* Padding empty slots to align with Monday start */}
                  {calendarDays.length > 0 && Array.from({ length: (new Date(calendarDays[0].dateStr).getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-9 w-full" />
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
                            ? 'bg-primary text-white dark:text-black scale-[1.03] shadow-sm'
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
            <div className="space-y-2">
              <label htmlFor="visibleHoursStart" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {getTranslation(language, 'dailyStart')}
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5 z-10" />
                <Select value={String(visibleHoursStart)} onValueChange={(val) => setVisibleHoursStart(Number(val))}>
                  <SelectTrigger id="visibleHoursStart" className="w-full pl-9 !h-11 font-bold text-foreground">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {getHourLabel(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="visibleHoursEnd" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {getTranslation(language, 'dailyEnd')}
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5 z-10" />
                <Select value={String(visibleHoursEnd)} onValueChange={(val) => setVisibleHoursEnd(Number(val))}>
                  <SelectTrigger id="visibleHoursEnd" className="w-full pl-9 !h-11 font-bold text-foreground">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {getHourLabel(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="slotDuration" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                {getTranslation(language, 'slotDuration')}
              </label>
              <div className="relative flex items-center">
                <Input
                  id="slotDuration"
                  type="number"
                  min={1}
                  max={1440}
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  onBlur={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!e.target.value || isNaN(parsed) || parsed < 1) {
                      setSlotDuration('30');
                    } else {
                      setSlotDuration(String(Math.min(1440, parsed)));
                    }
                  }}
                  placeholder="30"
                  className="font-bold text-foreground h-11 pr-16 pl-3.5"
                />
                <span className="absolute right-3.5 text-xs text-muted-foreground font-bold uppercase tracking-wide pointer-events-none select-none">
                  {language === 'en' ? 'mins' : 'phút'}
                </span>
              </div>
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
              <div className="mt-4 p-4 rounded-xl border border-border bg-muted/60 dark:bg-zinc-800/30 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideDown">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {getTranslation(language, 'prefWorkingHours')}
                  </label>
                  <div className="flex gap-2 items-center">
                    <Select value={String(preferredStart)} onValueChange={(val) => setPreferredStart(Number(val))}>
                      <SelectTrigger className="w-full !h-10 text-xs font-semibold text-foreground">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {getHourLabel(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground font-bold">to</span>
                    <Select value={String(preferredEnd)} onValueChange={(val) => setPreferredEnd(Number(val))}>
                      <SelectTrigger className="w-full !h-10 text-xs font-semibold text-foreground">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {getHourLabel(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bufferMinutes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {getTranslation(language, 'meetingBuffer')}
                  </label>
                  <Select value={String(bufferMinutes)} onValueChange={(val) => setBufferMinutes(Number(val))}>
                    <SelectTrigger id="bufferMinutes" className="w-full !h-10 text-xs font-semibold text-foreground">
                      <SelectValue placeholder="Buffer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{getTranslation(language, 'noBuffer')}</SelectItem>
                      <SelectItem value="10">{getTranslation(language, 'bufferMins', { min: 10 })}</SelectItem>
                      <SelectItem value="15">{getTranslation(language, 'bufferMins', { min: 15 })}</SelectItem>
                      <SelectItem value="30">{getTranslation(language, 'bufferMins', { min: 30 })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="deadline" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {getTranslation(language, 'responseDeadline')}
                  </label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="font-semibold text-foreground text-xs h-10 px-3 bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxParticipants" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    {getTranslation(language, 'maxParticipants')}
                  </label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder={getTranslation(language, 'noLimit')}
                    value={maxParticipants || ''}
                    onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="font-semibold text-foreground text-xs h-10 px-3 bg-card"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 md:col-span-2">
                  <Checkbox
                    id="includeWeekends"
                    checked={includeWeekends}
                    onCheckedChange={(checked) => setIncludeWeekends(checked === true)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="includeWeekends" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    {getTranslation(language, 'includeWeekends')}
                  </label>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <Checkbox
                    id="isPrivate"
                    checked={isPrivate}
                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                    className="cursor-pointer"
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
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-semibold text-foreground text-xs h-10 px-3 bg-card"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6">
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.002] active:scale-[0.998] transition-all py-6"
          >
            <span>{getTranslation(language, 'generateWorkspace')}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
