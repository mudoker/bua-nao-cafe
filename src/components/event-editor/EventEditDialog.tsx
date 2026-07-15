"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { EventDetails } from '@/types';
import { getTranslation } from '@/utils/translations';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EventEditDialogProps } from './EventEditDialog.types';

export default function EventEditDialog({ event, language, onSave }: EventEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [organizer, setOrganizer] = useState(event.organizer);
  const [dates, setDates] = useState<string[]>(event.dates);
  const [dateToAdd, setDateToAdd] = useState('');
  const [visibleHoursStart, setVisibleHoursStart] = useState(event.visibleHoursStart);
  const [visibleHoursEnd, setVisibleHoursEnd] = useState(event.visibleHoursEnd);
  const [slotDuration, setSlotDuration] = useState(String(event.slotDuration));
  const [includeWeekends, setIncludeWeekends] = useState(event.includeWeekends);
  const [isPrivate, setIsPrivate] = useState(event.isPrivate);
  const [password, setPassword] = useState(event.password || '');
  const [deadline, setDeadline] = useState(event.deadline || '');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(event.maxParticipants);
  const [preferredStart, setPreferredStart] = useState(event.preferredWorkingHoursStart ?? event.visibleHoursStart);
  const [preferredEnd, setPreferredEnd] = useState(event.preferredWorkingHoursEnd ?? event.visibleHoursEnd);
  const [error, setError] = useState('');

  const sortedDates = useMemo(() => [...dates].sort(), [dates]);

  const getHourLabel = (hour: number) => {
    return hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const addDate = () => {
    if (!dateToAdd) return;
    setDates((current) => [...new Set([...current, dateToAdd])].sort());
    setDateToAdd('');
  };

  const removeDate = (date: string) => {
    setDates((current) => current.filter((item) => item !== date));
  };

  const handleSave = () => {
    setError('');
    if (!title.trim()) {
      setError(language === 'en' ? 'Please enter an event title.' : 'Vui lòng điền tiêu đề cuộc hẹn.');
      return;
    }
    if (sortedDates.length === 0) {
      setError(getTranslation(language, 'datesRequired'));
      return;
    }
    if (visibleHoursStart >= visibleHoursEnd) {
      setError(getTranslation(language, 'hourError'));
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      organizer: organizer.trim() || event.organizer,
      dates: sortedDates,
      visibleHoursStart,
      visibleHoursEnd,
      slotDuration: Math.max(1, Math.min(1440, parseInt(slotDuration, 10) || event.slotDuration)),
      includeWeekends,
      bufferMinutes: event.bufferMinutes,
      isPrivate,
      password: isPrivate ? password || undefined : undefined,
      deadline: deadline || undefined,
      maxParticipants,
      preferredWorkingHoursStart: preferredStart,
      preferredWorkingHoursEnd: preferredEnd,
      finalizedSlot: event.finalizedSlot && sortedDates.some((date) => event.finalizedSlot?.startsWith(date)) ? event.finalizedSlot : undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-1 rounded-lg border border-input bg-background px-3.5 h-9 text-sm font-bold hover:bg-muted cursor-pointer"
        title={language === 'en' ? 'Edit event details' : 'Chỉnh sửa lịch'}
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{language === 'en' ? 'Edit' : 'Sửa'}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">
            {language === 'en' ? 'Edit Event' : 'Chỉnh Sửa Lịch'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput id="edit-title" label={getTranslation(language, 'meetingTitle')} value={title} onChange={setTitle} />
            <LabeledInput id="edit-organizer" label={getTranslation(language, 'organizerName')} value={organizer} onChange={setOrganizer} />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {getTranslation(language, 'description')}
            </label>
            <Textarea id="edit-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{getTranslation(language, 'selectDates')}</span>
            <div className="flex gap-2">
              <Input type="date" value={dateToAdd} onChange={(event) => setDateToAdd(event.target.value)} className="h-10 font-semibold" />
              <Button type="button" onClick={addDate} variant="outline" className="h-10 font-bold cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>{language === 'en' ? 'Add' : 'Thêm'}</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedDates.map((date) => (
                <button key={date} type="button" onClick={() => removeDate(date)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-bold cursor-pointer hover:bg-destructive/10 hover:text-destructive">
                  <span>{date}</span>
                  <Trash2 className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HourSelect id="edit-start" label={getTranslation(language, 'dailyStart')} value={visibleHoursStart} onChange={setVisibleHoursStart} getHourLabel={getHourLabel} />
            <HourSelect id="edit-end" label={getTranslation(language, 'dailyEnd')} value={visibleHoursEnd} onChange={setVisibleHoursEnd} getHourLabel={getHourLabel} />
            <LabeledInput id="edit-duration" label={getTranslation(language, 'slotDuration')} value={slotDuration} onChange={setSlotDuration} type="number" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <HourSelect id="edit-preferred-start" label={language === 'en' ? 'Preferred start' : 'Bắt đầu mong muốn'} value={preferredStart} onChange={setPreferredStart} getHourLabel={getHourLabel} />
            <HourSelect id="edit-preferred-end" label={language === 'en' ? 'Preferred end' : 'Kết thúc mong muốn'} value={preferredEnd} onChange={setPreferredEnd} getHourLabel={getHourLabel} />
            <LabeledInput id="edit-deadline" label={getTranslation(language, 'responseDeadline')} value={deadline} onChange={setDeadline} type="datetime-local" />
            <LabeledInput id="edit-max" label={getTranslation(language, 'maxParticipants')} value={maxParticipants ? String(maxParticipants) : ''} onChange={(value) => setMaxParticipants(value ? parseInt(value, 10) : undefined)} type="number" />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <Checkbox checked={includeWeekends} onCheckedChange={(checked) => setIncludeWeekends(checked === true)} />
              <span>{getTranslation(language, 'includeWeekends')}</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <Checkbox checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(checked === true)} />
              <span>{getTranslation(language, 'passwordProtect')}</span>
            </label>
            {isPrivate && <LabeledInput id="edit-password" label={getTranslation(language, 'securityPassword')} value={password} onChange={setPassword} type="password" />}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} className="font-bold cursor-pointer">
            {language === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabeledInput({ id, label, value, onChange, type = 'text' }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 font-semibold" />
    </div>
  );
}

function HourSelect({ id, label, value, onChange, getHourLabel }: { id: string; label: string; value: number; onChange: (value: number) => void; getHourLabel: (hour: number) => string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3.5 z-10" />
        <Select value={String(value)} onValueChange={(nextValue) => onChange(Number(nextValue))}>
          <SelectTrigger id={id} className="w-full pl-9 !h-10 font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }).map((_, hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {getHourLabel(hour)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
