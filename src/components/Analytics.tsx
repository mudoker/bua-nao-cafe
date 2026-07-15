"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { generateSlots, formatSlotTime } from '../utils/time';
import { BarChart3, TrendingUp, Info, Calendar, Percent, Users, Award } from 'lucide-react';

export default function Analytics() {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const availability = useEventStore((state) => state.availability);

  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!currentEvent) return null;

  const completedParticipants = participants.filter(p => p.isCompleted);
  const totalCompleted = completedParticipants.length;

  if (totalCompleted === 0) {
    return (
      <div className="border border-border bg-card rounded-2xl p-6 shadow-sm text-center py-12">
        <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground mb-1">Analytics Dashboard</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Insights, peak attendance graphs, and daily histograms will render here once responses are submitted.
        </p>
      </div>
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
      weekday: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });

  // 2. Calculate Hourly availability profile (Peak Attendance)
  const uniqueTimes = Array.from(new Set(slots.map((s) => s.split('T')[1]))).sort();
  const hourlyProfile = uniqueTimes.map((timeStr, idx) => {
    let votes = 0;
    // Look at this time slot across all days
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
      // Control points for a smooth cubic curve
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    // Close area shape
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
    <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground m-0">Analytics & Feedback</h2>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">Interactive Metrics</span>
      </div>

      {/* Grid statistics summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Responded</span>
          <div className="flex items-baseline gap-1 mt-1">
            <Users className="w-4 h-4 text-primary shrink-0 self-center" />
            <span className="text-lg font-bold text-foreground">{totalCompleted}</span>
            <span className="text-[10px] text-muted-foreground">/ {participants.length}</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Peak Attendance</span>
          <div className="flex items-baseline gap-1 mt-1">
            <Award className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
            <span className="text-lg font-bold text-foreground">{highestOverlapPct}%</span>
            <span className="text-[10px] text-muted-foreground">({highestOverlapCount} people)</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex flex-col justify-center col-span-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Availability</span>
          <div className="flex items-baseline gap-1 mt-1">
            <Percent className="w-4 h-4 text-primary shrink-0 self-center" />
            <span className="text-lg font-bold text-foreground">{avgAvailability}%</span>
            <span className="text-[10px] text-muted-foreground">of slots</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Best Slot</span>
          <span className="text-xs font-bold text-foreground truncate mt-1">
            {highestOverlapSlot
              ? `${new Date(highestOverlapSlot.split('T')[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ ${formatSlotTime(highestOverlapSlot)}`
              : 'None'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Chart 1: Daily Availability Histogram */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Popularity By Day (Total Votes)</span>
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
                      {Math.round(day.percentage)}% Popular
                      <span className="block text-[8px] text-muted-foreground">({day.totalVotes} total votes)</span>
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
                <div key={day.dateStr} className="text-center w-full truncate">
                  <span className="block">{day.weekday}</span>
                  <span className="block text-[8px] font-medium">{day.formattedDate.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Peak Attendance Area curve */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Peak Hours Profile (Time of Day)</span>
          </div>

          <div className="h-44 bg-muted/10 border border-border/40 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
            {/* SVG Line chart */}
            <div className="flex-1 w-full relative">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference grid lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(100,116,139,0.1)" strokeDasharray="3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(100,116,139,0.1)" strokeDasharray="3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(100,116,139,0.15)" />

                {/* Curved Fill Area */}
                {hourlyProfile.length > 0 && (
                  <path d={getAreaPath()} fill="url(#areaGradient)" />
                )}

                {/* Curved Stroke Line */}
                {hourlyProfile.length > 0 && (
                  <path d={getLinePath()} stroke="rgb(99, 102, 241)" strokeWidth="3" fill="none" strokeLinecap="round" />
                )}

                {/* Interactive Points */}
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

              {/* Invisible touch overlay regions for hover points */}
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
                        className="absolute bottom-full left-1/2 -translate-x-1/2 bg-card border border-border rounded p-1.5 shadow-md z-30 pointer-events-none text-[9px] font-bold text-foreground text-center mb-1 whitespace-nowrap"
                        style={{
                          left: `${(index / (hourlyProfile.length - 1)) * 100}%`
                        }}
                      >
                        {h.formattedTime}
                        <span className="block text-primary">{Math.round(h.score)}% Popular</span>
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
      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2.5 text-xs text-muted-foreground leading-normal">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Pro Tip:</strong> Click participants in the sidebar list to isolate and inspect individual timetables, or adjust the overlap slider to hide slots below a certain attendance percentage.
        </span>
      </div>
    </div>
  );
}
