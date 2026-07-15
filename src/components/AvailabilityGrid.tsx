"use client";

import React, { useState, useEffect } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { generateSlots, formatSlotTime, formatSlotDate, getDayName, getFormattedDate } from '../utils/time';
import { HelpCircle, ChevronLeft, ChevronRight, CalendarDays, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function AvailabilityGrid({ className }: { className?: string }) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const availability = useEventStore((state) => state.availability);
  const currentUser = useEventStore((state) => state.currentUser);
  const filters = useEventStore((state) => state.filters);
  const language = useEventStore((state) => state.language);

  // Actions
  const paintSlotsAvailability = useEventStore((state) => state.paintSlotsAvailability);
  const toggleSlotAvailability = useEventStore((state) => state.toggleSlotAvailability);
  const finalizeSlot = useEventStore((state) => state.finalizeSlot);

  // Local grid interaction state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [paintedSlots, setPaintedSlots] = useState<string[]>([]);
  const [touchMode, setTouchMode] = useState<'paint' | 'scroll'>('scroll');
  const [activeMobileDateIndex, setActiveMobileDateIndex] = useState(0);

  if (!currentEvent) return null;

  // Filter dates
  const filteredDates = currentEvent.dates.filter(dateStr => {
    if (filters.hideWeekend) {
      const day = new Date(dateStr).getDay();
      return day !== 0 && day !== 6; // exclude Sat/Sun
    }
    return true;
  });

  const slots = generateSlots(
    filteredDates,
    currentEvent.visibleHoursStart,
    currentEvent.visibleHoursEnd,
    currentEvent.slotDuration
  );

  // Find min and max overlap count across all active slots in the grid
  const { maxOverlap, minOverlap } = React.useMemo(() => {
    let maxVal = 0;
    let minVal = Infinity;
    
    // Helper to count votes for a slot
    const getSlotOverlapCount = (slotId: string) => {
      const activeParticipants = participants.filter((p) => {
        if (filters.selectedParticipantIds.length > 0) {
          return filters.selectedParticipantIds.includes(p.id);
        }
        return p.isCompleted;
      });
      return activeParticipants.filter((p) => availability[p.id]?.includes(slotId)).length;
    };

    slots.forEach((slotId) => {
      const count = getSlotOverlapCount(slotId);
      if (count > maxVal) maxVal = count;
      if (count > 0 && count < minVal) minVal = count;
    });

    return {
      maxOverlap: maxVal,
      minOverlap: minVal === Infinity ? 0 : minVal,
    };
  }, [slots, participants, availability, filters.selectedParticipantIds]);

  // Clean mobile slide bounds
  useEffect(() => {
    if (activeMobileDateIndex >= filteredDates.length) {
      setActiveMobileDateIndex(Math.max(0, filteredDates.length - 1));
    }
  }, [filteredDates.length, activeMobileDateIndex]);

  // Extract unique times (rows) e.g. "09:00", "09:30"
  const uniqueTimes = Array.from(
    new Set(slots.map((s) => s.split('T')[1]))
  ).sort();

  // Mouse drag handlers
  const handleMouseDown = (slotId: string, e: React.MouseEvent) => {
    if (!currentUser) return;
    
    // Left click only
    if (e.button !== 0) return;

    setIsMouseDown(true);
    const isAvailable = availability[currentUser.id]?.includes(slotId) || false;
    const mode: 'add' | 'remove' = isAvailable ? 'remove' : 'add';

    setPaintMode(mode);
    setPaintedSlots([slotId]);

    toggleSlotAvailability(slotId);
  };

  const handleMouseEnterCell = (slotId: string) => {
    if (!isMouseDown || !paintMode || !currentUser) return;

    if (!paintedSlots.includes(slotId)) {
      setPaintedSlots([...paintedSlots, slotId]);
      
      const currentSlots = availability[currentUser.id] || [];
      const hasSlot = currentSlots.includes(slotId);
      
      if (paintMode === 'add' && !hasSlot) {
        toggleSlotAvailability(slotId);
      } else if (paintMode === 'remove' && hasSlot) {
        toggleSlotAvailability(slotId);
      }
    }
  };

  const handleGlobalMouseUp = () => {
    setIsMouseDown(false);
    setPaintMode(null);
    setPaintedSlots([]);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Touch handlers
  const handleTouchStart = (slotId: string, e: React.TouchEvent) => {
    if (!currentUser || touchMode === 'scroll') return;

    e.preventDefault();
    setIsMouseDown(true);
    // Paint mode = add only. Never remove on touch paint — tap the cell again to deselect
    // is intentionally disabled so dragging doesn't accidentally erase selections.
    setPaintMode('add');
    setPaintedSlots([slotId]);
    const isAvailable = availability[currentUser.id]?.includes(slotId) || false;
    if (!isAvailable) {
      toggleSlotAvailability(slotId);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDown || !paintMode || !currentUser || touchMode === 'scroll') return;

    const touch = e.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const slotId = element.getAttribute('data-slot-id');
    if (slotId && !paintedSlots.includes(slotId)) {
      setPaintedSlots([...paintedSlots, slotId]);
      const currentSlots = availability[currentUser.id] || [];
      const hasSlot = currentSlots.includes(slotId);
      // Paint mode only adds, never removes during a drag
      if (!hasSlot) {
        toggleSlotAvailability(slotId);
      }
    }
  };

  // Quick Action: Fill/Clear whole day
  const handleDayAction = (dateStr: string, action: 'select' | 'clear') => {
    if (!currentUser) return;
    const daySlots = slots.filter((s) => s.startsWith(dateStr));
    
    if (action === 'select') {
      paintSlotsAvailability(daySlots, true);
    } else {
      paintSlotsAvailability(daySlots, false);
    }
  };

  // Calculations for cells
  const getCellDetails = (slotId: string) => {
    const activeParticipants = participants.filter((p) => {
      if (filters.selectedParticipantIds.length > 0) {
        return filters.selectedParticipantIds.includes(p.id);
      }
      return p.isCompleted;
    });

    const totalCount = activeParticipants.length;
    const availableUserIds = activeParticipants
      .filter((p) => availability[p.id]?.includes(slotId))
      .map((p) => p.id);

    const overlapCount = availableUserIds.length;
    const percentage = totalCount > 0 ? (overlapCount / totalCount) * 100 : 0;

    const availableUsers = participants.filter((p) => availableUserIds.includes(p.id));
    const unavailableUsers = participants.filter(
      (p) => p.isCompleted && !availableUserIds.includes(p.id) && (filters.selectedParticipantIds.length === 0 || filters.selectedParticipantIds.includes(p.id))
    );

    return {
      overlapCount,
      totalCount,
      percentage,
      availableUsers,
      unavailableUsers,
    };
  };

  const getCellBgClass = (slotId: string) => {
    const { overlapCount } = getCellDetails(slotId);

    if (currentEvent.finalizedSlot === slotId) {
      return 'bg-violet-600 border border-amber-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.8)] pulse-emerald';
    }

    if (overlapCount === 0) {
      const isMeAvailable = currentUser && availability[currentUser.id]?.includes(slotId);
      return isMeAvailable
        ? 'bg-primary/20 border border-primary/45'
        : 'bg-muted/40 hover:bg-muted/65 dark:bg-muted/20 dark:hover:bg-muted/30';
    }

    // Dynamic scale based on min/max overlap in active view
    let intensity = 0;
    if (maxOverlap === minOverlap) {
      intensity = 100;
    } else {
      intensity = 20 + ((overlapCount - minOverlap) / (maxOverlap - minOverlap)) * 80;
    }

    // 5 clearly distinct bands — each with a strong, unique hue
    if (intensity <= 20) return 'bg-blue-900/70 text-blue-200 dark:bg-blue-950/80 dark:text-blue-300 ring-1 ring-inset ring-blue-700/30';
    if (intensity <= 40) return 'bg-sky-600/60 text-sky-100 dark:bg-sky-700/70 dark:text-sky-200 ring-1 ring-inset ring-sky-500/30';
    if (intensity <= 60) return 'bg-teal-500/70 text-white dark:bg-teal-600/75 ring-1 ring-inset ring-teal-400/40';
    if (intensity <= 80) return 'bg-lime-500 text-lime-950 dark:bg-lime-500/90 ring-1 ring-inset ring-lime-400/50 shadow-[0_0_8px_rgba(132,204,22,0.3)]';
    return 'bg-emerald-400 text-emerald-950 ring-1 ring-inset ring-emerald-300/60 shadow-[0_0_14px_rgba(52,211,153,0.5)] font-black';
  };


  const handleCellDoubleClick = (slotId: string) => {
    if (currentUser?.isHost) {
      const question = language === 'en' 
        ? `Finalize meeting at ${formatSlotDate(slotId)} at ${formatSlotTime(slotId)}?`
        : `Chốt lịch họp vào ${formatSlotDate(slotId)} lúc ${formatSlotTime(slotId)}?`;
      const confirmFinalize = window.confirm(question);
      if (confirmFinalize) {
        finalizeSlot(currentEvent.finalizedSlot === slotId ? null : slotId);
      }
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

  if (filteredDates.length === 0) {
    return (
      <Card className={cn("flex-1 flex flex-col gap-4 border-border bg-card shadow-sm overflow-hidden", className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground font-semibold text-xs">
          <CalendarDays className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <span>{language === 'en' ? 'No dates match the current filters.' : 'Không có ngày nào khớp với bộ lọc hiện tại.'}</span>
          <span className="text-[10px] text-muted-foreground/60 mt-1">{language === 'en' ? 'Try enabling weekends in filters.' : 'Hãy thử hiển thị cuối tuần trong bộ lọc.'}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delay={200}>
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      {/* Grid Controls */}
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-border">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span>{getTranslation(language, 'heatmapTitle')}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Date Carousel Selector for Mobile */}
        {filteredDates.length > 1 && (
          <div className="flex sm:hidden items-center justify-between gap-2 p-1.5 bg-muted/30 rounded-xl">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveMobileDateIndex(Math.max(0, activeMobileDateIndex - 1))}
              disabled={activeMobileDateIndex === 0}
              className="h-8 w-8 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <span className="text-xs font-bold block text-foreground leading-none">
                {getDayName(filteredDates[activeMobileDateIndex])}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold mt-1 block leading-none">
                {getFormattedDate(filteredDates[activeMobileDateIndex])}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveMobileDateIndex(Math.min(filteredDates.length - 1, activeMobileDateIndex + 1))}
              disabled={activeMobileDateIndex === filteredDates.length - 1}
              className="h-8 w-8 cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Main Grid View */}
        <div className="overflow-x-auto border border-border rounded-xl relative bg-card">
          <table
            className="w-full min-h-full border-collapse table-fixed select-none"
            style={{ minWidth: `${80 + filteredDates.length * 90}px` }}
          >
            {/* Header Row (Dates) */}
            <thead className="sticky top-0 z-20 bg-card border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="w-16 md:w-20 shrink-0 sticky left-0 z-30 bg-card border-r border-border p-1 text-[10px] font-bold text-muted-foreground uppercase text-center">
                  {getTranslation(language, 'time')}
                </th>

                {filteredDates.map((dateStr, idx) => (
                  <th
                    key={dateStr}
                    className={`border-r border-border p-1.5 text-center min-w-[70px] ${
                      idx !== activeMobileDateIndex ? 'hidden sm:table-cell' : 'table-cell'
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground leading-tight">
                      {getDayName(dateStr)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold leading-tight mt-0.5">
                      {getFormattedDate(dateStr)}
                    </div>

                    {/* Quick Select Actions */}
                    {currentUser && (
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        <Button
                          variant="link"
                          onClick={() => handleDayAction(dateStr, 'select')}
                          className="text-[9px] font-bold text-primary hover:underline cursor-pointer p-0 h-auto"
                        >
                          {getTranslation(language, 'all')}
                        </Button>
                        <span className="text-muted-foreground/30 text-[9px] font-bold">|</span>
                        <Button
                          variant="link"
                          onClick={() => handleDayAction(dateStr, 'clear')}
                          className="text-[9px] font-bold text-destructive hover:underline cursor-pointer p-0 h-auto"
                        >
                          {getTranslation(language, 'clear')}
                        </Button>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Time Rows */}
            <tbody className="h-full">
              {uniqueTimes.map((timeStr) => {
                const formattedTime = formatSlotTime(`2000-01-01T${timeStr}`);

                return (
                  <tr key={timeStr} className="border-b border-border/50 last:border-0 sm:min-h-40">
                    {/* Left Column (Sticky Time) */}
                    <td className="sticky left-0 z-10 bg-card border-r border-border text-[10px] font-bold text-muted-foreground text-center align-middle p-0.5 leading-none">
                      {formattedTime}
                    </td>

                    {/* Day cells */}
                    {filteredDates.map((dateStr, idx) => {
                      const slotId = `${dateStr}T${timeStr}`;
                      const isFinalized = currentEvent.finalizedSlot === slotId;
                      const cellBg = getCellBgClass(slotId);
                      const { overlapCount, totalCount, percentage, availableUsers, unavailableUsers } = getCellDetails(slotId);
                      const isMeAvailable = currentUser && availability[currentUser.id]?.includes(slotId);
                      const isDimmed = currentUser && !isMeAvailable && percentage > 0;

                      return (
                        <Tooltip key={slotId}>
                          <TooltipTrigger
                            render={
                              <td
                                data-slot-id={slotId}
                                className={`border-r border-border/50 p-0 text-center relative cursor-crosshair heatmap-cell font-bold transition-all ${cellBg} ${
                                  idx !== activeMobileDateIndex ? 'hidden sm:table-cell' : 'table-cell'
                                } ${isDimmed ? 'opacity-[0.22] dark:opacity-[0.15]' : 'opacity-100'}`}
                                onMouseDown={(e) => handleMouseDown(slotId, e)}
                                onMouseEnter={() => handleMouseEnterCell(slotId)}
                                onTouchStart={(e) => handleTouchStart(slotId, e)}
                                onTouchMove={handleTouchMove}
                                onDoubleClick={() => handleCellDoubleClick(slotId)}
                              >
                                {isFinalized && (
                                  <div className="absolute inset-0 flex items-center justify-center text-xs animate-bounce" title="Finalized!">
                                    👑
                                  </div>
                                )}
                              </td>
                            }
                          />
                          <TooltipContent
                            side="right"
                            sideOffset={8}
                            className="p-0 border-0 bg-transparent shadow-none max-w-[220px] pointer-events-none"
                          >
                            <div className="bg-card border border-border p-3 rounded-xl shadow-2xl text-xs backdrop-blur-sm">
                              <div className="font-bold border-b border-border/80 pb-1.5 mb-2 text-foreground flex items-center gap-1">
                                <span>{formatSlotDate(slotId)}</span>
                                <span className="text-muted-foreground">@</span>
                                <span>{formatSlotTime(slotId)}</span>
                              </div>

                              {isFinalized && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 font-bold text-[9px] mb-2 border border-violet-500/20">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>{getTranslation(language, 'finalized')}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mb-2 font-bold">
                                <span className="text-primary">
                                  {overlapCount} / {totalCount} {getTranslation(language, 'available')}
                                </span>
                                <span className="text-[10px] text-muted-foreground">({Math.round(percentage)}%)</span>
                              </div>

                              {currentUser && (
                                <div className="mb-2 text-[10px] font-bold">
                                  <span className="text-foreground">{getTranslation(language, 'yourAvailability')}: </span>
                                  <span className={isMeAvailable ? 'text-emerald-500' : 'text-muted-foreground'}>
                                    {isMeAvailable ? getTranslation(language, 'yes') : getTranslation(language, 'no')}
                                  </span>
                                </div>
                              )}

                              {availableUsers.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{getTranslation(language, 'available')}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {availableUsers.map((u) => (
                                      <span key={u.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-foreground border border-border/40">
                                        <span className={`w-1.5 h-1.5 rounded-full ${getDotColorClass(u.color)}`} />
                                        <span>{u.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {unavailableUsers.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{getTranslation(language, 'unavailable')}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {unavailableUsers.map((u) => (
                                      <span key={u.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                                        <span>{u.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grid Legend & Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/80">
          {/* Heatmap Legend */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              {getTranslation(language, 'overlapIntensity')}:
            </span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-3 rounded bg-muted/40 border border-border" title="None" />
              <span className="w-5 h-3 rounded bg-blue-900/70 ring-1 ring-inset ring-blue-700/30" title="Low" />
              <span className="w-5 h-3 rounded bg-sky-600/60 ring-1 ring-inset ring-sky-500/30" title="Low-Mid" />
              <span className="w-5 h-3 rounded bg-teal-500/70 ring-1 ring-inset ring-teal-400/40" title="Mid" />
              <span className="w-5 h-3 rounded bg-lime-500 ring-1 ring-inset ring-lime-400/50" title="High" />
              <span className="w-5 h-3 rounded bg-emerald-400 ring-1 ring-inset ring-emerald-300/60" title="Peak" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">Low → Peak</span>
          </div>

          {/* User Help tip */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            {currentUser ? (
              <span>{touchMode === 'paint' ? getTranslation(language, 'gridHelpTextMobile') : getTranslation(language, 'gridHelpText')}</span>
            ) : (
              <span>{language === 'en' ? 'Submit name in sidebar to edit your schedule.' : 'Nhập tên của bạn ở thanh bên để chỉnh sửa lịch.'}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

