"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { generateSlots, formatSlotDate, formatSlotTime, parseLocalDate } from '../utils/time';
import { BarChart3, TrendingUp, Info, Calendar, Percent, Users, Award, CircleHelp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

export default function Analytics({ className }: { className?: string }) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const availability = useEventStore((state) => state.availability);
  const filters = useEventStore((state) => state.filters);
  const language = useEventStore((state) => state.language);

  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!currentEvent) return null;

  const completedParticipants = filters.selectedParticipantIds.length > 0
    ? participants.filter((p) => filters.selectedParticipantIds.includes(p.id))
    : participants.filter(p => p.isCompleted);
  const totalCompleted = completedParticipants.length;

  if (totalCompleted === 0) {
    return (
      <Card className={cn("border-border bg-card shadow-sm text-center py-12", className)}>
        <CardContent className="flex flex-col items-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">{getTranslation(language, 'analyticsTitle')}</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto font-semibold text-center">
            {language === 'en'
              ? 'Insights, peak attendance graphs, and daily histograms will render here once responses are submitted.'
              : 'Các thông tin phân tích, biểu đồ giờ cao điểm và thống kê theo ngày sẽ hiển thị ở đây sau khi các thành viên gửi lịch rảnh.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredDates = currentEvent.dates.filter((dateStr) => {
    if (!filters.hideWeekend) return true;
    const day = parseLocalDate(dateStr).getDay();
    return day !== 0 && day !== 6;
  });

  const slots = generateSlots(
    filteredDates,
    currentEvent.visibleHoursStart,
    currentEvent.visibleHoursEnd,
    currentEvent.slotDuration
  ).filter((slotId) => {
    if (!filters.workingHoursOnly) return true;
    const hour = Number(slotId.split('T')[1]?.split(':')[0] || 0);
    const start = currentEvent.preferredWorkingHoursStart ?? currentEvent.visibleHoursStart;
    const end = currentEvent.preferredWorkingHoursEnd ?? currentEvent.visibleHoursEnd;
    return hour >= start && hour < end;
  });

  // 1. Calculate the best single-slot overlap for each day.
  const dailyAvailability = filteredDates.map((dateStr) => {
    const daySlots = slots.filter((s) => s.startsWith(dateStr));
    let bestVotes = 0;
    
    daySlots.forEach((slotId) => {
      const votes = completedParticipants.filter((p) => availability[p.id]?.includes(slotId)).length;
      bestVotes = Math.max(bestVotes, votes);
    });

    const percentage = totalCompleted > 0 ? (bestVotes / totalCompleted) * 100 : 0;
    const date = parseLocalDate(dateStr);

    return {
      dateStr,
      percentage,
      bestVotes,
      dayNumber: date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { day: 'numeric' }),
      weekday: date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { weekday: 'short' }),
    };
  });

  // 2. Calculate direct per-slot overlap over the visible schedule.
  const slotProfile = slots.map((slotId, idx) => {
    const votes = completedParticipants.filter((p) => availability[p.id]?.includes(slotId)).length;
    const score = totalCompleted > 0 ? (votes / totalCompleted) * 100 : 0;

    return {
      slotId,
      idx,
      score,
      votes,
      formattedDate: formatSlotDate(slotId, language),
      formattedTime: formatSlotTime(slotId),
    };
  });

  // 3. Overall stats
  let totalAvailableSlotsCount = 0;
  let highestOverlapCount = 0;
  let highestOverlapSlot = '';

  slots.forEach((slotId) => {
    let slotVotes = 0;
    completedParticipants.forEach((p) => {
      if (availability[p.id]?.includes(slotId)) {
        slotVotes++;
        totalAvailableSlotsCount++;
      }
    });

    const slotPercentage = totalCompleted > 0 ? (slotVotes / totalCompleted) * 100 : 0;
    if (slotPercentage < filters.minOverlapPercentage) return;

    if (slotVotes > highestOverlapCount) {
      highestOverlapCount = slotVotes;
      highestOverlapSlot = slotId;
    }
  });

  const avgAvailability = slots.length > 0 && totalCompleted > 0
    ? Math.round((totalAvailableSlotsCount / (slots.length * totalCompleted)) * 100)
    : 0;

  const highestOverlapPct = totalCompleted > 0 ? Math.round((highestOverlapCount / totalCompleted) * 100) : 0;
  const visibleSlotProfile = slotProfile.filter((slot) => slot.score >= filters.minOverlapPercentage);

  // Chart sizes
  const width = 500;
  const height = 150;
  const padding = 20;

  // Path generator for Curved Area Chart (Peak Attendance)
  const getAreaPath = () => {
    if (visibleSlotProfile.length === 0) return '';
    const divisor = Math.max(visibleSlotProfile.length - 1, 1);
    const points = visibleSlotProfile.map((h, index) => {
      const x = padding + (index / divisor) * (width - padding * 2);
      const y = height - padding - (h.score / 100) * (height - padding * 2);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    path += ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    return path;
  };

  const getLinePath = () => {
    if (visibleSlotProfile.length === 0) return '';
    const divisor = Math.max(visibleSlotProfile.length - 1, 1);
    const points = visibleSlotProfile.map((h, index) => {
      const x = padding + (index / divisor) * (width - padding * 2);
      const y = height - padding - (h.score / 100) * (height - padding * 2);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span>{getTranslation(language, 'analyticsTitle')}</span>
        </CardTitle>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{getTranslation(language, 'interactiveMetrics')}</span>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Grid statistics summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stat 1 */}
          <div className="p-3 bg-muted/20 border border-border/65 rounded-xl flex flex-col justify-center dark:bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{getTranslation(language, 'totalResponded')}</span>
            <div className="flex items-baseline gap-1 mt-1 font-semibold">
              <Users className="w-4 h-4 text-primary shrink-0 self-center" />
              <span className="text-lg font-bold text-foreground">{totalCompleted}</span>
              <span className="text-[10px] text-muted-foreground">/ {participants.length}</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-3 bg-muted/20 border border-border/65 rounded-xl flex flex-col justify-center dark:bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{getTranslation(language, 'peakAttendance')}</span>
            <div className="flex items-baseline gap-1 mt-1 font-semibold">
              <Award className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
              <span className="text-lg font-bold text-foreground">{highestOverlapPct}%</span>
              <span className="text-[10px] text-muted-foreground">
                ({highestOverlapCount} {language === 'en' ? 'people' : 'người'})
              </span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-3 bg-muted/20 border border-border/65 rounded-xl flex flex-col justify-center col-span-1 dark:bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{getTranslation(language, 'avgAvailability')}</span>
            <div className="flex items-baseline gap-1 mt-1 font-semibold">
              <Percent className="w-4 h-4 text-primary shrink-0 self-center" />
              <span className="text-lg font-bold text-foreground">{avgAvailability}%</span>
              <span className="text-[10px] text-muted-foreground">
                {language === 'en' ? 'of slots' : 'số ô rảnh'}
              </span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-3 bg-muted/20 border border-border/65 rounded-xl flex flex-col justify-center dark:bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{getTranslation(language, 'bestSlot')}</span>
            <span className="text-xs font-bold text-foreground truncate mt-1">
              {highestOverlapSlot
                ? `${formatSlotDate(highestOverlapSlot, language)} @ ${formatSlotTime(highestOverlapSlot)}`
                : 'None'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Daily Availability Histogram */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{getTranslation(language, 'popularityByDay')}</span>
            </div>

            <div className="h-44 bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between relative">
              <div className="flex-1 flex items-end justify-around gap-2 px-1">
                {dailyAvailability.map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex flex-col items-center flex-1 max-w-[40px] group relative"
                    onMouseEnter={() => setHoveredBar(day.dateStr)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover tooltip */}
                    {hoveredBar === day.dateStr && (
                      <div className="absolute -top-10 bg-card border border-border text-[9px] font-bold py-1 px-2 rounded shadow-md z-30 pointer-events-none text-foreground text-center">
                        {Math.round(day.percentage)}% {language === 'en' ? 'Popular' : 'Rảnh'}
                        <span className="block text-[8px] text-muted-foreground">
                          ({day.bestVotes} / {totalCompleted} {language === 'en' ? 'available' : 'người rảnh'})
                        </span>
                      </div>
                    )}
                    {/* Bar */}
                    <div
                      className="w-full bg-primary/20 group-hover:bg-primary/30 rounded-t-md transition-all duration-300 relative overflow-hidden"
                      style={{ height: '100px' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary group-hover:scale-y-[1.03] origin-bottom transition-all duration-500 rounded-t-md"
                        style={{ height: `${day.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* X Axis labels */}
              <div className="flex justify-around gap-2 border-t border-border/60 pt-2 text-[9px] font-bold text-muted-foreground">
                {dailyAvailability.map((day) => (
                  <div key={day.dateStr} className="text-center w-full truncate leading-tight">
                    <span className="block">{day.weekday}</span>
                    <span className="block text-[8px] font-semibold">{day.dayNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Peak Attendance Area curve */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>{getTranslation(language, 'peakHours')}</span>
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={language === 'en' ? 'Explain peak meeting hours' : 'Giải thích khung giờ cao điểm'}
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-64 text-xs leading-normal">
                  {getTranslation(language, 'peakHoursTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="h-44 bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-visible">
              <div className="flex-1 w-full relative">
                <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(100,116,139,0.1)" strokeDasharray="3" />
                  <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(100,116,139,0.1)" strokeDasharray="3" />
                  <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(100,116,139,0.15)" />

                  {visibleSlotProfile.length > 0 && (
                    <path d={getAreaPath()} fill="url(#areaGradient)" />
                  )}

                  {visibleSlotProfile.length > 0 && (
                    <path d={getLinePath()} stroke="rgb(99, 102, 241)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  )}

                  {visibleSlotProfile.map((h, index) => {
                    const divisor = Math.max(visibleSlotProfile.length - 1, 1);
                    const x = padding + (index / divisor) * (width - padding * 2);
                    const y = height - padding - (h.score / 100) * (height - padding * 2);

                    return (
                      <circle
                        key={h.slotId}
                        cx={x}
                        cy={y}
                        r={hoveredPoint === index ? 6 : 0}
                        fill="rgb(99, 102, 241)"
                        stroke="white"
                        strokeWidth="2"
                        className="transition-all duration-100"
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0">
                  {visibleSlotProfile.map((h, index) => {
                    const divisor = Math.max(visibleSlotProfile.length - 1, 1);
                    const x = padding + (index / divisor) * (width - padding * 2);
                    const y = height - padding - (h.score / 100) * (height - padding * 2);

                    return (
                      <button
                        key={h.slotId}
                        type="button"
                        aria-label={`${h.formattedDate} ${h.formattedTime}`}
                        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer z-20"
                        style={{
                          left: `${(x / width) * 100}%`,
                          top: `${(y / height) * 100}%`,
                        }}
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}

                  {/* Single Hovered Point Tooltip */}
                  {hoveredPoint !== null && visibleSlotProfile[hoveredPoint] && (() => {
                    const divisor = Math.max(visibleSlotProfile.length - 1, 1);
                    const h = visibleSlotProfile[hoveredPoint];
                    const x = padding + (hoveredPoint / divisor) * (width - padding * 2);
                    const y = height - padding - (h.score / 100) * (height - padding * 2);

                    return (
                      <div
                        className="absolute bg-card border border-border p-2 rounded-xl shadow-lg z-30 pointer-events-none text-foreground text-center text-[10px] font-bold -translate-x-1/2 -translate-y-full mt-[-10px] min-w-[130px] animate-fade-in"
                        style={{
                          left: `${(x / width) * 100}%`,
                          top: `${(y / height) * 100}%`,
                        }}
                      >
                        <span>{h.formattedDate}</span>
                        <span className="block text-muted-foreground text-[9px] font-semibold">{h.formattedTime}</span>
                        <span className="block text-primary font-extrabold mt-0.5">
                          {h.votes} / {totalCompleted} {language === 'en' ? 'available' : 'người rảnh'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between border-t border-border/60 pt-2 text-[9px] font-bold text-muted-foreground px-4">
                <span>{visibleSlotProfile[0]?.formattedTime || ''}</span>
                <span>{visibleSlotProfile[Math.floor(visibleSlotProfile.length / 2)]?.formattedTime || ''}</span>
                <span>{visibleSlotProfile[visibleSlotProfile.length - 1]?.formattedTime || ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Explanation Tip */}
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2.5 text-xs text-muted-foreground leading-normal font-semibold">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{getTranslation(language, 'proTip')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
