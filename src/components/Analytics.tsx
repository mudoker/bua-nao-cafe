"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { generateSlots, formatSlotTime } from '../utils/time';
import { BarChart3, TrendingUp, Info, Calendar, Percent, Users, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';

export default function Analytics({ className }: { className?: string }) {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const availability = useEventStore((state) => state.availability);
  const language = useEventStore((state) => state.language);

  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!currentEvent) return null;

  const completedParticipants = participants.filter(p => p.isCompleted);
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

  const slots = generateSlots(
    currentEvent.dates,
    currentEvent.visibleHoursStart,
    currentEvent.visibleHoursEnd,
    currentEvent.slotDuration
  );

  // 1. Calculate Daily Availability totals (Histogram)
  const dailyAvailability = currentEvent.dates.map((dateStr) => {
    const daySlots = slots.filter((s) => s.startsWith(dateStr));
    let totalVotes = 0;
    
    daySlots.forEach((slotId) => {
      completedParticipants.forEach((p) => {
        if (availability[p.id]?.includes(slotId)) {
          totalVotes++;
        }
      });
    });

    const maxPossibleVotes = daySlots.length * totalCompleted;
    const percentage = maxPossibleVotes > 0 ? (totalVotes / maxPossibleVotes) * 100 : 0;

    return {
      dateStr,
      percentage,
      totalVotes,
      formattedDate: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { weekday: 'short' }),
    };
  });

  // 2. Calculate Hourly availability profile (Peak Attendance)
  const uniqueTimes = Array.from(new Set(slots.map((s) => s.split('T')[1]))).sort();
  const hourlyProfile = uniqueTimes.map((timeStr, idx) => {
    let votes = 0;
    const correspondingSlots = currentEvent.dates.map((d) => `${d}T${timeStr}`);
    
    correspondingSlots.forEach((slotId) => {
      completedParticipants.forEach((p) => {
        if (availability[p.id]?.includes(slotId)) {
          votes++;
        }
      });
    });

    const totalPossible = correspondingSlots.length * totalCompleted;
    const score = totalPossible > 0 ? (votes / totalPossible) * 100 : 0;

    return {
      timeStr,
      idx,
      score,
      votes,
      formattedTime: formatSlotTime(`2000-01-01T${timeStr}`),
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

    if (slotVotes > highestOverlapCount) {
      highestOverlapCount = slotVotes;
      highestOverlapSlot = slotId;
    }
  });

  const avgAvailability = slots.length > 0 && totalCompleted > 0
    ? Math.round((totalAvailableSlotsCount / (slots.length * totalCompleted)) * 100)
    : 0;

  const highestOverlapPct = totalCompleted > 0 ? Math.round((highestOverlapCount / totalCompleted) * 100) : 0;

  // Chart sizes
  const width = 500;
  const height = 150;
  const padding = 20;

  // Path generator for Curved Area Chart (Peak Attendance)
  const getAreaPath = () => {
    if (hourlyProfile.length === 0) return '';
    const points = hourlyProfile.map((h, index) => {
      const x = padding + (index / (hourlyProfile.length - 1)) * (width - padding * 2);
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
    if (hourlyProfile.length === 0) return '';
    const points = hourlyProfile.map((h, index) => {
      const x = padding + (index / (hourlyProfile.length - 1)) * (width - padding * 2);
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
                ? `${new Date(highestOverlapSlot.split('T')[0]).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { month: 'short', day: 'numeric' })} @ ${formatSlotTime(highestOverlapSlot)}`
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
                        <span className="block text-[8px] text-muted-foreground">({day.totalVotes} {language === 'en' ? 'total votes' : 'lượt rảnh'})</span>
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
                    <span className="block text-[8px] font-semibold">{day.formattedDate.split(' ')[1]}</span>
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
            </div>

            <div className="h-44 bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
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

                  {hourlyProfile.length > 0 && (
                    <path d={getAreaPath()} fill="url(#areaGradient)" />
                  )}

                  {hourlyProfile.length > 0 && (
                    <path d={getLinePath()} stroke="rgb(99, 102, 241)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  )}

                  {hourlyProfile.map((h, index) => {
                    const x = padding + (index / (hourlyProfile.length - 1)) * (width - padding * 2);
                    const y = height - padding - (h.score / 100) * (height - padding * 2);

                    return (
                      <circle
                        key={h.timeStr}
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

                <div className="absolute inset-0 flex">
                  {hourlyProfile.map((h, index) => (
                    <div
                      key={h.timeStr}
                      className="flex-1 h-full cursor-pointer relative"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {hoveredPoint === index && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg p-1.5 shadow-md z-30 pointer-events-none text-[9px] font-bold text-foreground text-center mb-1 whitespace-nowrap"
                          style={{
                            left: `${(index / (hourlyProfile.length - 1)) * 100}%`
                          }}
                        >
                          {h.formattedTime}
                          <span className="block text-primary">
                            {Math.round(h.score)}% {language === 'en' ? 'Popular' : 'Mức độ rảnh'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between border-t border-border/60 pt-2 text-[9px] font-bold text-muted-foreground px-4">
                <span>{hourlyProfile[0]?.formattedTime || ''}</span>
                <span>{hourlyProfile[Math.floor(hourlyProfile.length / 2)]?.formattedTime || ''}</span>
                <span>{hourlyProfile[hourlyProfile.length - 1]?.formattedTime || ''}</span>
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
