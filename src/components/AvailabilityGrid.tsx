"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { generateSlots, formatSlotTime, formatSlotDate, getDayName, getFormattedDate } from '../utils/time';
import { Brush, Eraser, HelpCircle, ChevronLeft, ChevronRight, CalendarDays, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');
  const [touchMode, setTouchMode] = useState<'paint' | 'scroll'>('scroll');
  const [activeMobileDateIndex, setActiveMobileDateIndex] = useState(0);

  // Hover slot detail tooltip
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const gridContainerRef = useRef<HTMLDivElement>(null);

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
    
    let mode: 'add' | 'remove' = 'add';
    if (activeTool === 'eraser') {
      mode = 'remove';
    } else {
      mode = isAvailable ? 'remove' : 'add';
    }

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
    const isAvailable = availability[currentUser.id]?.includes(slotId) || false;
    const mode = isAvailable ? 'remove' : 'add';
    setPaintMode(mode);
    setPaintedSlots([slotId]);
    toggleSlotAvailability(slotId);
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
      
      if (paintMode === 'add' && !hasSlot) {
        toggleSlotAvailability(slotId);
      } else if (paintMode === 'remove' && hasSlot) {
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

    if (intensity <= 20) return 'bg-blue-500/20 text-blue-800 dark:text-blue-300';
    if (intensity <= 40) return 'bg-cyan-500/35 text-cyan-800 dark:text-cyan-300';
    if (intensity <= 60) return 'bg-emerald-500/40 text-emerald-800 dark:text-emerald-300';
    if (intensity <= 80) return 'bg-lime-500/60 text-lime-900 dark:text-lime-200';
    
    return 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]';
  };

  const handleMouseMove = (slotId: string, e: React.MouseEvent) => {
    setHoveredSlot(slotId);
    if (gridContainerRef.current) {
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - containerRect.left + 15,
        y: e.clientY - containerRect.top + 15,
      });
    }
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
    <Card className={cn("flex-1 flex flex-col gap-4 border-border bg-card shadow-sm overflow-hidden", className)} ref={gridContainerRef}>
      {/* Grid Controls */}
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-border">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span>{getTranslation(language, 'heatmapTitle')}</span>
        </CardTitle>

        {/* Tools panel */}
        {currentUser && (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center bg-muted dark:bg-zinc-800 rounded-lg p-0.5 border border-border">
              <Button
                variant={activeTool === 'brush' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTool('brush')}
                className="flex items-center gap-1 text-[11px] font-bold h-7 cursor-pointer"
              >
                <Brush className="w-3 h-3 shrink-0" />
                <span>{getTranslation(language, 'paintMode')}</span>
              </Button>
              <Button
                variant={activeTool === 'eraser' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTool('eraser')}
                className="flex items-center gap-1 text-[11px] font-bold h-7 cursor-pointer"
              >
                <Eraser className="w-3 h-3 shrink-0" />
                <span>{getTranslation(language, 'eraseMode')}</span>
              </Button>
            </div>

            {/* Mobile Touch Mode toggle */}
            <div className="sm:hidden flex items-center bg-muted dark:bg-zinc-800 rounded-lg p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setTouchMode('paint')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  touchMode === 'paint' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {getTranslation(language, 'paintMobile')}
              </button>
              <button
                type="button"
                onClick={() => setTouchMode('scroll')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  touchMode === 'scroll' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {getTranslation(language, 'scrollMobile')}
              </button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4 flex-1 flex flex-col min-h-0">
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
        <div className="overflow-auto flex-1 min-h-0 border border-border rounded-xl relative bg-card">
          <table
            className="w-full border-collapse table-fixed select-none"
            style={{ minWidth: `${80 + filteredDates.length * 90}px` }}
            onMouseLeave={() => setHoveredSlot(null)}
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
            <tbody>
              {uniqueTimes.map((timeStr) => {
                const formattedTime = formatSlotTime(`2000-01-01T${timeStr}`);

                return (
                  <tr key={timeStr} className="border-b border-border/50 last:border-0 h-10">
                    {/* Left Column (Sticky Time) */}
                    <td className="sticky left-0 z-10 bg-card border-r border-border text-[10px] font-bold text-muted-foreground text-center align-middle p-0.5 leading-none">
                      {formattedTime}
                    </td>

                    {/* Day cells */}
                    {filteredDates.map((dateStr, idx) => {
                      const slotId = `${dateStr}T${timeStr}`;
                      const isFinalized = currentEvent.finalizedSlot === slotId;
                      const cellBg = getCellBgClass(slotId);
                      const { percentage } = getCellDetails(slotId);
                      const isMeAvailable = currentUser && availability[currentUser.id]?.includes(slotId);
                      const isDimmed = currentUser && !isMeAvailable && percentage > 0;

                      return (
                        <td
                          key={slotId}
                          data-slot-id={slotId}
                          className={`border-r border-border/50 p-0 text-center relative cursor-crosshair heatmap-cell font-bold transition-all ${cellBg} ${
                            idx !== activeMobileDateIndex ? 'hidden sm:table-cell' : 'table-cell'
                          } ${isDimmed ? 'opacity-[0.22] dark:opacity-[0.15]' : 'opacity-100'}`}
                          onMouseDown={(e) => handleMouseDown(slotId, e)}
                          onMouseEnter={() => handleMouseEnterCell(slotId)}
                          onMouseMove={(e) => handleMouseMove(slotId, e)}
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
              <span className="w-5 h-3 rounded bg-muted/40 border border-border" title="0%" />
              <span className="w-5 h-3 rounded bg-blue-500/20" title="1-20%" />
              <span className="w-5 h-3 rounded bg-cyan-500/35" title="21-40%" />
              <span className="w-5 h-3 rounded bg-emerald-500/40" title="41-60%" />
              <span className="w-5 h-3 rounded bg-lime-500/60" title="61-80%" />
              <span className="w-5 h-3 rounded bg-emerald-600" title="81-100%" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">0% → 100%</span>
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

      {/* Floating Tooltip Card */}
      {hoveredSlot && (
        (() => {
          const { overlapCount, totalCount, percentage, availableUsers, unavailableUsers } = getCellDetails(hoveredSlot);
          const isMeAvailable = currentUser && availability[currentUser.id]?.includes(hoveredSlot);
          const isFinalized = currentEvent.finalizedSlot === hoveredSlot;

          return (
            <div
              className="absolute bg-card/95 border border-border p-3 rounded-xl shadow-xl max-w-[200px] z-40 text-xs pointer-events-none transition-opacity duration-150 backdrop-blur-sm border-border"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
              }}
            >
              <div className="font-bold border-b border-border/80 pb-1 mb-1.5 text-foreground flex items-center gap-1">
                <span>{formatSlotDate(hoveredSlot)}</span>
                <span>@</span>
                <span>{formatSlotTime(hoveredSlot)}</span>
              </div>

              {isFinalized && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 font-bold text-[9px] mb-2 border border-violet-500/20">
                  <Award className="w-3.5 h-3.5 fill-current" />
                  <span>{getTranslation(language, 'finalized')}</span>
                </div>
              )}

              {/* Overlap Summary */}
              <div className="flex items-center gap-1.5 mb-2 font-bold">
                <span className="text-primary">
                  {overlapCount} / {totalCount} {getTranslation(language, 'available')}
                </span>
                <span className="text-[10px] text-muted-foreground">({Math.round(percentage)}%)</span>
              </div>

              {/* Your state indicator */}
              {currentUser && (
                <div className="mb-2 text-[10px] font-bold">
                  <span>{getTranslation(language, 'yourAvailability')}: </span>
                  <span className={isMeAvailable ? 'text-emerald-500' : 'text-muted-foreground'}>
                    {isMeAvailable ? getTranslation(language, 'yes') : getTranslation(language, 'no')}
                  </span>
                </div>
              )}

              {/* Available list */}
              {availableUsers.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{getTranslation(language, 'available')}</div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {availableUsers.map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-foreground border border-border/40">
                        <span className={`w-1.5 h-1.5 rounded-full ${getDotColorClass(u.color)}`} />
                        <span>{u.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unavailable list */}
              {unavailableUsers.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{getTranslation(language, 'unavailable')}</div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {unavailableUsers.map((u) => (
                      <span key={u.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                        <span>{u.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}
    </Card>
  );
}
