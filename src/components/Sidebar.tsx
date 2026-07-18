"use client";

import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { Users, Filter, CheckCircle2, Circle, AlertCircle, Trash2, Edit2, Check, HelpCircle, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';
import ProfileEditDialog from './profile/ProfileEditDialog';

export default function Sidebar({ className }: { className?: string }) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const currentUser = useEventStore((state) => state.currentUser);
  const filters = useEventStore((state) => state.filters);
  const recentActivity = useEventStore((state) => state.recentActivity);
  const language = useEventStore((state) => state.language);

  // Actions
  const toggleParticipantFilter = useEventStore((state) => state.toggleParticipantFilter);
  const setFilter = useEventStore((state) => state.setFilter);
  const clearFilters = useEventStore((state) => state.clearFilters);
  const updateParticipant = useEventStore((state) => state.updateParticipant);
  const removeParticipant = useEventStore((state) => state.removeParticipant);

  // Local state for host editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!currentEvent) return null;

  const totalParticipants = participants.length;
  const completedCount = participants.filter(p => p.isCompleted).length;
  const completionRate = totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;

  // Handle participant rename
  const handleRenameSave = (id: string) => {
    if (editingName.trim()) {
      updateParticipant(id, { name: editingName.trim() });
      setEditingId(null);
    }
  };

  const getDotColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      indigo: 'bg-indigo-500',
      emerald: 'bg-emerald-500',
      rose: 'bg-rose-500',
      amber: 'bg-amber-500',
      sky: 'bg-sky-500',
      violet: 'bg-violet-500',
      fuchsia: 'bg-fuchsia-500',
      orange: 'bg-orange-500',
    };
    return map[colorName] || 'bg-slate-500';
  };

  const isFilterActive =
    filters.selectedParticipantIds.length > 0 ||
    filters.hideWeekend ||
    filters.workingHoursOnly ||
    filters.minOverlapPercentage > 0;

  return (
    <aside className={cn("w-full flex flex-col gap-5", className)}>
      {/* Participant List Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
            <Users className="w-4 h-4 text-primary" />
            <span>{getTranslation(language, 'participants', { count: totalParticipants })}</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser && <ProfileEditDialog />}
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {getTranslation(language, 'submittedProgress', { rate: completionRate })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Completion Progress Bar */}
          <div className="w-full bg-muted dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          {/* Participants scroll area */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {participants.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-medium flex flex-col items-center gap-1">
                <HelpCircle className="w-6 h-6 text-muted-foreground/50" />
                <span>{getTranslation(language, 'noParticipants')}</span>
                <span className="text-[10px]">{getTranslation(language, 'invitePrompt')}</span>
              </div>
            ) : (
              participants.map((p) => {
                const isFiltered = filters.selectedParticipantIds.includes(p.id);
                const isMe = currentUser && currentUser.id === p.id;
                const isHost = currentUser?.isHost;

                const timeStr = new Date(p.lastActive).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                const lastSeenText = getTranslation(language, 'lastSeen', { time: timeStr });

                return (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isFiltered
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/20 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20'
                    }`}
                  >
                    <div
                      onClick={() => toggleParticipantFilter(p.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      title={language === 'en' ? `Click to filter grid to ${p.name}'s schedule` : `Click để lọc lịch rảnh của ${p.name}`}
                    >
                      {/* Status circle and Avatar */}
                      <div className="relative shrink-0">
                        <span className="text-lg bg-card border border-border/80 p-0.5 rounded-lg shadow-sm block">{p.avatar}</span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                            p.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                          }`}
                          title={p.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-xs font-bold w-28 bg-background border-primary focus-visible:ring-1"
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameSave(p.id)}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              className="h-7 w-7 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shrink-0"
                              onClick={() => handleRenameSave(p.id)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-bold truncate ${isFiltered ? 'text-primary' : 'text-foreground'}`}>
                              {p.name}
                            </span>
                            {isMe && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 leading-none">{getTranslation(language, 'you')}</span>}
                            {p.isHost && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 leading-none">{getTranslation(language, 'host')}</span>}
                          </div>
                        )}
                        
                        {/* Last active indicator */}
                        <span className="text-[9px] text-muted-foreground font-semibold block mt-0.5">
                          {p.isOnline ? getTranslation(language, 'activeNow') : lastSeenText}
                        </span>
                      </div>
                    </div>

                    {/* Submit completion indicator & host actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Check badge */}
                      {p.isCompleted ? (
                        <span title={getTranslation(language, 'availSubmitted')}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </span>
                      ) : (
                        <span title={language === 'en' ? 'Pending submission' : 'Đang chờ gửi lịch'}>
                          <Circle className="w-4 h-4 text-muted-foreground/40" />
                        </span>
                      )}

                      {/* Host action panel */}
                      {isHost && !isMe && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingId(p.id);
                              setEditingName(p.name);
                            }}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                            title={language === 'en' ? 'Rename participant' : 'Đổi tên thành viên'}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParticipant(p.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-red-500/10 cursor-pointer"
                            title={language === 'en' ? 'Remove participant' : 'Xóa thành viên'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}


                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Options Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
            <Filter className="w-4 h-4 text-primary" />
            <span>{getTranslation(language, 'filtersTitle')}</span>
          </CardTitle>
          {isFilterActive && (
            <Button
              variant="link"
              onClick={clearFilters}
              className="text-[10px] font-bold text-destructive hover:underline cursor-pointer p-0 h-auto"
            >
              {getTranslation(language, 'clearAll')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Working hours checkbox */}
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="filter-working"
              checked={filters.workingHoursOnly}
              onCheckedChange={(checked) => setFilter('workingHoursOnly', checked === true)}
              className="cursor-pointer"
            />
            <label htmlFor="filter-working" className="text-xs font-bold text-foreground cursor-pointer select-none">
              {getTranslation(language, 'workingHoursOnly')}
            </label>
          </div>

          {/* Weekend toggle */}
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="filter-weekends"
              checked={filters.hideWeekend}
              onCheckedChange={(checked) => setFilter('hideWeekend', checked === true)}
              className="cursor-pointer"
            />
            <label htmlFor="filter-weekends" className="text-xs font-bold text-foreground cursor-pointer select-none">
              {getTranslation(language, 'hideWeekends')}
            </label>
          </div>

          {/* Min Overlap Slider */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">{getTranslation(language, 'minOverlap')}</span>
              <span className="text-primary">{filters.minOverlapPercentage === 0 ? getTranslation(language, 'any') : `${filters.minOverlapPercentage}% +`}</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={20}
              value={[filters.minOverlapPercentage]}
              onValueChange={(val) => setFilter('minOverlapPercentage', Array.isArray(val) ? val[0] : val)}
              className="py-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
              <span>{getTranslation(language, 'any')}</span>
              <span>40%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Selected participants filtering alert */}
          {filters.selectedParticipantIds.length > 0 && (
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-1.5 mt-2 animate-fadeIn font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span>{getTranslation(language, 'filteringAlert', { count: filters.selectedParticipantIds.length })}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
