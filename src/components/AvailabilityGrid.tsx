"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { generateSlots, formatSlotTime, formatSlotDate, getDayName, getFormattedDate, parseLocalDate } from '../utils/time';
import { HelpCircle, ChevronLeft, ChevronRight, CalendarDays, Award, Eye, Pencil } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const submitAvailability = useEventStore((state) => state.submitAvailability);

  // Local grid interaction state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const isMouseDownRef = useRef(false);
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [paintedSlots, setPaintedSlots] = useState<string[]>([]);
  const [touchMode, setTouchMode] = useState<'paint' | 'scroll'>('scroll');
  const [activeMobileDateIndex, setActiveMobileDateIndex] = useState(0);
  const [longPressedSlot, setLongPressedSlot] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null);
  const [dragTooltipSlot, setDragTooltipSlot] = useState<string | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isTouchDraggingRef = useRef(false);
  const touchDragModeRef = useRef<'add' | 'remove' | null>(null);
  const touchPaintedSlotsRef = useRef<string[]>([]);
  const dragPathRef = useRef<string[]>([]);
  const initialAvailabilityRef = useRef<string[]>([]);
  const lastTapRef = useRef<{ slotId: string; time: number } | null>(null);

  const dragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const autoScrollTimerRef = useRef<number | null>(null);

  const runAutoScroll = () => {
    const isDragging = isMouseDownRef.current || isTouchDraggingRef.current;
    if (!isDragging) {
      autoScrollTimerRef.current = null;
      return;
    }

    const container = gridContainerRef.current;
    const pointer = dragPointerRef.current;

    if (container && pointer) {
      const rect = container.getBoundingClientRect();
      const { x, y } = pointer;

      const edgeThresholdX = 60; // px
      const maxScrollSpeedX = 16;

      const edgeThresholdY = 70; // px
      const maxScrollSpeedY = 16;

      let scrollX = 0;
      let scrollY = 0;

      // Horizontal auto scroll the container
      if (rect.right - x < edgeThresholdX) {
        const dist = Math.max(0, rect.right - x);
        const intensity = (edgeThresholdX - dist) / edgeThresholdX;
        scrollX = intensity * maxScrollSpeedX;
      } else if (x - rect.left < edgeThresholdX) {
        const dist = Math.max(0, x - rect.left);
        const intensity = (edgeThresholdX - dist) / edgeThresholdX;
        scrollX = -intensity * maxScrollSpeedX;
      }

      // Vertical auto scroll the entire window
      const viewportHeight = window.innerHeight;
      if (y < edgeThresholdY) {
        const intensity = (edgeThresholdY - y) / edgeThresholdY;
        scrollY = -intensity * maxScrollSpeedY;
      } else if (viewportHeight - y < edgeThresholdY) {
        const intensity = (edgeThresholdY - (viewportHeight - y)) / edgeThresholdY;
        scrollY = intensity * maxScrollSpeedY;
      }

      if (scrollX !== 0) {
        container.scrollLeft += scrollX;
      }
      if (scrollY !== 0) {
        window.scrollBy(0, scrollY);
      }
    }

    autoScrollTimerRef.current = requestAnimationFrame(runAutoScroll);
  };

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTimeRef = useRef(0);
  const touchStartRef = useRef<{
    slotId: string;
    x: number;
    y: number;
    moved: boolean;
    longPressTriggered: boolean;
  } | null>(null);

  if (!currentEvent) return null;

  // Filter dates
  const filteredDates = currentEvent.dates.filter(dateStr => {
    if (filters.hideWeekend) {
      const day = parseLocalDate(dateStr).getDay();
      return day !== 0 && day !== 6; // exclude Sat/Sun
    }
    return true;
  });

  const isSlotInPreferredHours = (slotId: string) => {
    if (!filters.workingHoursOnly) return true;
    const timePart = slotId.split('T')[1];
    const hour = Number(timePart?.split(':')[0] || 0);
    const start = currentEvent.preferredWorkingHoursStart ?? currentEvent.visibleHoursStart;
    const end = currentEvent.preferredWorkingHoursEnd ?? currentEvent.visibleHoursEnd;
    return hour >= start && hour < end;
  };

  const activeParticipants = React.useMemo(() => participants.filter((p) => {
    if (filters.selectedParticipantIds.length > 0) {
      return filters.selectedParticipantIds.includes(p.id);
    }
    return p.isCompleted;
  }), [participants, filters.selectedParticipantIds]);

  const slots = generateSlots(
    filteredDates,
    currentEvent.visibleHoursStart,
    currentEvent.visibleHoursEnd,
    currentEvent.slotDuration
  ).filter(isSlotInPreferredHours);

  // Find min and max overlap count across all active slots in the grid
  const { maxOverlap, minOverlap } = React.useMemo(() => {
    let maxVal = 0;
    let minVal = Infinity;
    
    // Helper to count votes for a slot
    const getSlotOverlapCount = (slotId: string) => {
      return activeParticipants.filter((p) => availability[p.id]?.includes(slotId)).length;
    };

    slots.forEach((slotId) => {
      const count = getSlotOverlapCount(slotId);
      const percentage = activeParticipants.length > 0 ? (count / activeParticipants.length) * 100 : 0;
      if (percentage < filters.minOverlapPercentage) return;
      if (count > maxVal) maxVal = count;
      if (count > 0 && count < minVal) minVal = count;
    });

    return {
      maxOverlap: maxVal,
      minOverlap: minVal === Infinity ? 0 : minVal,
    };
  }, [slots, activeParticipants, availability, filters.minOverlapPercentage]);

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
    if (Date.now() - lastTouchTimeRef.current < 700) return;
    if (!currentUser) return;
    
    // Left click only
    if (e.button !== 0) return;

    setIsMouseDown(true);
    isMouseDownRef.current = true;
    const isAvailable = availability[currentUser.id]?.includes(slotId) || false;
    const mode: 'add' | 'remove' = isAvailable ? 'remove' : 'add';

    setPaintMode(mode);
    setPaintedSlots([slotId]);

    // Initialize drag path & initial availability
    dragPathRef.current = [slotId];
    initialAvailabilityRef.current = [...(availability[currentUser.id] || [])];

    // Close tooltips immediately on press
    setLongPressedSlot(null);
    setHoveredSlot(null);
    setDragTooltipSlot(null);

    // Skip history on mouse down, commit on mouse up
    toggleSlotAvailability(slotId, true);

    // Start auto scroll
    dragPointerRef.current = { x: e.clientX, y: e.clientY };
    if (!autoScrollTimerRef.current) {
      autoScrollTimerRef.current = requestAnimationFrame(runAutoScroll);
    }
  };

  const handleMouseEnterCell = (slotId: string) => {
    if (!isMouseDown || !paintMode || !currentUser) return;

    const path = dragPathRef.current;
    if (path.length > 1 && path[path.length - 2] === slotId) {
      // User is dragging backwards!
      const poppedSlotId = path.pop();
      setPaintedSlots(prev => prev.filter(id => id !== poppedSlotId));

      // Revert availability of popped slot to initial state
      const wasInitiallyAvailable = initialAvailabilityRef.current.includes(poppedSlotId || '');
      const currentSlots = useEventStore.getState().availability[currentUser.id] || [];
      
      let updatedSlots = [...currentSlots];
      if (wasInitiallyAvailable) {
        if (!updatedSlots.includes(poppedSlotId || '')) {
          updatedSlots.push(poppedSlotId || '');
        }
      } else {
        updatedSlots = updatedSlots.filter(id => id !== poppedSlotId);
      }
      
      submitAvailability(updatedSlots, true);
    } else if (!path.includes(slotId)) {
      // Moving to a new slot
      path.push(slotId);
      setPaintedSlots(prev => [...prev, slotId]);

      const isAdd = paintMode === 'add';
      paintSlotsAvailability([slotId], isAdd, true);
    }
  };

  const handleGlobalMouseUp = () => {
    setIsMouseDown(prev => {
      if (prev && currentUser) {
        // Commit final state to undo stack and sync
        const currentSlots = useEventStore.getState().availability[currentUser.id] || [];
        submitAvailability(currentSlots, false);
      }
      return false;
    });
    isMouseDownRef.current = false;
    setPaintMode(null);
    setPaintedSlots([]);
    setHoveredSlot(null);

    // Stop auto scroll
    if (autoScrollTimerRef.current) {
      cancelAnimationFrame(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    dragPointerRef.current = null;
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const clearTooltipCloseTimer = () => {
    if (tooltipCloseTimerRef.current) {
      clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = null;
    }
  };

  const closeLongPressTooltipSoon = () => {
    clearTooltipCloseTimer();
    tooltipCloseTimerRef.current = setTimeout(() => {
      setLongPressedSlot(null);
    }, 1800);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);

    // Hide tooltip when tapped outside or when changing mode
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.heatmap-cell') && !target.closest('button')) {
        setLongPressedSlot(null);
        setHoveredSlot(null);
        setDragTooltipSlot(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        dragPointerRef.current = { x: e.clientX, y: e.clientY };
        if (!autoScrollTimerRef.current) {
          autoScrollTimerRef.current = requestAnimationFrame(runAutoScroll);
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      clearLongPressTimer();
      clearTooltipCloseTimer();
      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
      }
    };
  }, [currentUser]);

  // Touch handlers registered directly on the container DOM element to support { passive: false } preventDefault dragging
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!currentUser) return;

      const target = e.target as HTMLElement;
      const cell = target.closest('.heatmap-cell');
      if (!cell) return;

      const slotId = cell.getAttribute('data-slot-id');
      if (!slotId) return;

      const touch = e.touches[0];
      if (!touch) return;

      lastTouchTimeRef.current = Date.now();
      setLongPressedSlot(null);
      setDragTooltipSlot(null);
      setHoveredSlot(null);

      touchStartRef.current = {
        slotId,
        x: touch.clientX,
        y: touch.clientY,
        moved: false,
        longPressTriggered: false,
      };

      const now = Date.now();
      const lastTap = lastTapRef.current;
      const isDoubleTap = lastTap && lastTap.slotId === slotId && (now - lastTap.time < 350);
      lastTapRef.current = { slotId, time: now };

      if (isDoubleTap && touchMode === 'paint') {
        // Double tap triggers drag mode on mobile paint!
        isTouchDraggingRef.current = true;
        setIsTouchDragging(true);
        setDragStartSlot(slotId);
        setDragTooltipSlot(slotId);

        // Determine paint mode (opposite of state BEFORE Tap 1)
        // Since Tap 1 already toggled it, the current state matches the toggle direction
        const currentSlots = useEventStore.getState().availability[currentUser.id] || [];
        const isAvailable = currentSlots.includes(slotId);
        const mode = isAvailable ? 'add' : 'remove';
        touchDragModeRef.current = mode;
        touchPaintedSlotsRef.current = [slotId];

        // Initialize drag path & initial availability
        dragPathRef.current = [slotId];
        initialAvailabilityRef.current = [...currentSlots];

        // Start auto scroll
        dragPointerRef.current = { x: touch.clientX, y: touch.clientY };
        if (!autoScrollTimerRef.current) {
          autoScrollTimerRef.current = requestAnimationFrame(runAutoScroll);
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(40);
        }

        // Cancel long press timer since we are already dragging
        clearLongPressTimer();
      } else {
        // Single touch:
        // Set long press timer only in view mode (touchMode === 'scroll') to show details tooltip
        clearLongPressTimer();
        if (touchMode !== 'paint') {
          longPressTimerRef.current = setTimeout(() => {
            const start = touchStartRef.current;
            if (start && start.slotId === slotId && !start.moved) {
              start.longPressTriggered = true;
              setLongPressedSlot(slotId);
            }
          }, 500);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;

      const touch = e.touches[0];
      if (!touch) return;

      const moved = Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 10;
      if (moved) {
        start.moved = true;
        if (!isTouchDraggingRef.current) {
          clearLongPressTimer();
        }
      }

      if (isTouchDraggingRef.current && currentUser) {
        // Prevent screen scrolling while drag-painting
        if (e.cancelable) {
          e.preventDefault();
        }

        // Update pointer position for auto scroll
        dragPointerRef.current = { x: touch.clientX, y: touch.clientY };
        if (!autoScrollTimerRef.current) {
          autoScrollTimerRef.current = requestAnimationFrame(runAutoScroll);
        }

        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = element?.closest('.heatmap-cell');
        const slotId = cell?.getAttribute('data-slot-id');

        if (slotId) {
          const path = dragPathRef.current;
          if (path.length > 1 && path[path.length - 2] === slotId) {
            // User is dragging backwards!
            const poppedSlotId = path.pop();

            // Revert availability of popped slot to initial state
            const wasInitiallyAvailable = initialAvailabilityRef.current.includes(poppedSlotId || '');
            const currentSlots = useEventStore.getState().availability[currentUser.id] || [];

            let updatedSlots = [...currentSlots];
            if (wasInitiallyAvailable) {
              if (!updatedSlots.includes(poppedSlotId || '')) {
                updatedSlots.push(poppedSlotId || '');
              }
            } else {
              updatedSlots = updatedSlots.filter(id => id !== poppedSlotId);
            }

            submitAvailability(updatedSlots, true);
          } else if (!path.includes(slotId)) {
            // Moving forward to a new cell
            path.push(slotId);

            const isAdd = touchDragModeRef.current === 'add';
            paintSlotsAvailability([slotId], isAdd, true);
          }
        }
      }
    };

    const onTouchEnd = () => {
      const start = touchStartRef.current;
      clearLongPressTimer();
      touchStartRef.current = null;

      // Stop auto scroll
      if (autoScrollTimerRef.current) {
        cancelAnimationFrame(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      dragPointerRef.current = null;

      if (isTouchDraggingRef.current) {
        isTouchDraggingRef.current = false;
        setIsTouchDragging(false);
        setDragTooltipSlot(null);
        setDragStartSlot(null);

        // Commit final state
        if (currentUser) {
          const finalSlots = useEventStore.getState().availability[currentUser.id] || [];
          submitAvailability(finalSlots, false);
        }
        return;
      }

      if (!start || start.moved || start.longPressTriggered) {
        closeLongPressTooltipSoon();
        return;
      }

      // Tap in edit mode: toggles immediately and commits
      if (touchMode === 'paint' && currentUser) {
        toggleSlotAvailability(start.slotId, false);
        setLongPressedSlot(null);
        return;
      }

      // Tap in view mode: open details tooltip
      setLongPressedSlot(start.slotId);
      closeLongPressTooltipSoon();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [currentUser, touchMode, paintSlotsAvailability, toggleSlotAvailability, submitAvailability]);

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
    const { overlapCount, percentage } = getCellDetails(slotId);

    if (currentEvent.finalizedSlot === slotId) {
      return 'bg-violet-600 border border-amber-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.8)] pulse-emerald';
    }

    if (filters.minOverlapPercentage > 0 && percentage < filters.minOverlapPercentage) {
      return 'bg-muted/20 hover:bg-muted/35 dark:bg-muted/10 dark:hover:bg-muted/20';
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

    // Partial overlap moves from warm to green so it reads as "getting better".
    if (intensity <= 20) return 'bg-amber-300/65 text-amber-950 dark:bg-amber-500/45 dark:text-amber-100 ring-1 ring-inset ring-amber-400/45';
    if (intensity <= 40) return 'bg-orange-400/70 text-orange-950 dark:bg-orange-500/55 dark:text-orange-100 ring-1 ring-inset ring-orange-400/45';
    if (intensity <= 60) return 'bg-teal-400/75 text-teal-950 dark:bg-teal-500/65 dark:text-teal-50 ring-1 ring-inset ring-teal-300/45';
    if (intensity <= 80) return 'bg-lime-400/90 text-lime-950 dark:bg-lime-500/80 ring-1 ring-inset ring-lime-300/50 shadow-[0_0_8px_rgba(132,204,22,0.3)]';
    return 'bg-emerald-400 text-emerald-950 ring-1 ring-inset ring-emerald-300/60 shadow-[0_0_14px_rgba(52,211,153,0.5)] font-black';
  };


  const handleCellDoubleClick = (slotId: string) => {
    if (currentUser?.isHost) {
      const question = language === 'en' 
        ? `Finalize meeting at ${formatSlotDate(slotId, language)} at ${formatSlotTime(slotId)}?`
        : `Chốt lịch họp vào ${formatSlotDate(slotId, language)} lúc ${formatSlotTime(slotId)}?`;
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
        {currentUser && (
          <Button
            type="button"
            variant={touchMode === 'paint' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              clearLongPressTimer();
              clearTooltipCloseTimer();
              setLongPressedSlot(null);
              setTouchMode(touchMode === 'paint' ? 'scroll' : 'paint');
            }}
            className="flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-bold sm:hidden"
          >
            {touchMode === 'paint' ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            <span>{touchMode === 'paint' ? getTranslation(language, 'viewMode') : getTranslation(language, 'editMode')}</span>
          </Button>
        )}
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
                {getDayName(filteredDates[activeMobileDateIndex], language)}
              </span>
              <span className="text-[10px] text-muted-foreground font-bold mt-1 block leading-none">
                {getFormattedDate(filteredDates[activeMobileDateIndex], language)}
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

        {/* Mobile Drag Mode Banner */}
        {isTouchDragging && (
          <div className="flex sm:hidden items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold">
              {language === 'en' 
                ? 'Drag mode active! Swipe to select/deselect slots.' 
                : 'Đang bật chế độ kéo! Vuốt để chọn hoặc xóa nhanh các ô.'}
            </span>
          </div>
        )}

        {/* Main Grid View */}
        <ScrollArea
          viewportRef={gridContainerRef}
          orientation="horizontal"
          className="border border-border rounded-xl bg-card"
        >
          <table
            className="w-full min-h-full border-collapse table-fixed select-none sm:[min-width:var(--table-min-width)]"
            style={{ ['--table-min-width' as any]: `${80 + filteredDates.length * 90}px` }}
          >
            {/* Header Row (Dates) */}
            <thead className="hidden sm:table-header-group sticky top-0 z-20 bg-card border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
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
                      {getDayName(dateStr, language)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold leading-tight mt-0.5">
                      {getFormattedDate(dateStr, language)}
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
                  <tr key={timeStr} className="h-12 border-b border-border/50 last:border-0 sm:h-16">
                    {/* Left Column (Sticky Time) */}
                    <td className="sticky left-0 z-10 h-12 bg-card border-r border-border text-[10px] font-bold text-muted-foreground text-center align-middle p-0.5 leading-none sm:h-16 w-16 sm:w-20 shrink-0">
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

                      const isTooltipOpen = dragTooltipSlot === slotId || longPressedSlot === slotId || hoveredSlot === slotId;

                      const cellEl = (
                        <td
                          data-slot-id={slotId}
                          className={`h-12 border-r border-border/50 p-0 text-center relative cursor-crosshair heatmap-cell font-bold sm:h-16 select-none ${cellBg} ${
                            idx !== activeMobileDateIndex ? 'hidden sm:table-cell' : 'table-cell'
                          } ${isDimmed ? 'opacity-60 dark:opacity-50' : 'opacity-100'} ${
                            (isMouseDown || isTouchDragging) ? '' : 'transition-all duration-100'
                          }`}
                          onMouseDown={(e) => handleMouseDown(slotId, e)}
                          onMouseEnter={() => {
                            if (currentUser) {
                              handleMouseEnterCell(slotId);
                            }
                            if (Date.now() - lastTouchTimeRef.current > 700) {
                              setHoveredSlot(slotId);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredSlot(null);
                          }}
                          onDoubleClick={() => handleCellDoubleClick(slotId)}
                        >
                          {isFinalized && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs animate-bounce" title="Finalized!">
                              👑
                            </div>
                          )}
                        </td>
                      );

                      if (!isTooltipOpen) {
                        return <React.Fragment key={slotId}>{cellEl}</React.Fragment>;
                      }

                      return (
                        <Tooltip key={slotId} open={true}>
                          <TooltipTrigger render={cellEl} />
                          <TooltipContent
                            side={dragTooltipSlot === slotId ? "top" : "right"}
                            sideOffset={8}
                            className="p-0 border-0 bg-transparent shadow-none max-w-[220px] pointer-events-none select-none"
                          >
                            {dragTooltipSlot === slotId ? (
                              <div className="bg-primary text-primary-foreground font-bold p-2.5 rounded-xl shadow-2xl text-xs text-center animate-bounce border border-primary-foreground/20 select-none pointer-events-none">
                                👆 {language === 'en' ? 'Double-tap & drag to paint/erase!' : 'Chạm đúp & kéo để tô/xóa!'}
                              </div>
                            ) : (
                              <div className="bg-card border border-border p-3 rounded-xl shadow-2xl text-xs backdrop-blur-sm">
                                <div className="font-bold border-b border-border/80 pb-1.5 mb-2 text-foreground flex items-center gap-1">
                                  <span>{formatSlotDate(slotId, language)}</span>
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
                                    <span className="text-black dark:text-white">{getTranslation(language, 'yourAvailability')}: </span>
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
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>

        {/* Grid Legend & Instructions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/80">
          {/* Heatmap Legend */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              {getTranslation(language, 'overlapIntensity')}:
            </span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-3 rounded bg-muted/40 border border-border" title="None" />
              <span className="w-5 h-3 rounded bg-amber-300/65 ring-1 ring-inset ring-amber-400/45" title="Low" />
              <span className="w-5 h-3 rounded bg-orange-400/70 ring-1 ring-inset ring-orange-400/45" title="Low-Mid" />
              <span className="w-5 h-3 rounded bg-teal-400/75 ring-1 ring-inset ring-teal-300/45" title="Mid" />
              <span className="w-5 h-3 rounded bg-lime-400/90 ring-1 ring-inset ring-lime-300/50" title="High" />
              <span className="w-5 h-3 rounded bg-emerald-400 ring-1 ring-inset ring-emerald-300/60" title="Peak" />
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">{getTranslation(language, 'lowToPeak')}</span>
          </div>

          {/* User Help tip */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            {currentUser ? (
              <>
                <span className="sm:hidden">{getTranslation(language, 'gridHelpTextMobile')}</span>
                <span className="hidden sm:inline">{getTranslation(language, 'gridHelpText')}</span>
              </>
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
