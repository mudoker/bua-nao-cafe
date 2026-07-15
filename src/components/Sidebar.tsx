"use client";
import React, { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { Users, Filter, CheckCircle2, Circle, AlertCircle, X, Trash2, Edit2, Check, HelpCircle, Activity } from 'lucide-react';
import { Participant } from '../types';

export default function Sidebar() {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const currentUser = useEventStore((state) => state.currentUser);
  const filters = useEventStore((state) => state.filters);
  const recentActivity = useEventStore((state) => state.recentActivity);

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

  const getColorClass = (colorName: string) => {
    const map: Record<string, string> = {
      indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      fuchsia: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20',
      orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    };
    return map[colorName] || 'text-slate-500 bg-slate-500/10 border-slate-500/20';
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
    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
      {/* Participant List Panel */}
      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground m-0 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Participants ({totalParticipants})</span>
          </h2>
          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {completionRate}% submitted
          </span>
        </div>

        {/* Completion Progress Bar */}
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Participants scroll area */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {participants.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground font-medium flex flex-col items-center gap-1">
              <HelpCircle className="w-6 h-6 text-muted-foreground/50" />
              <span>No participants yet</span>
              <span className="text-[10px]">Invite people using the link above!</span>
            </div>
          ) : (
            participants.map((p) => {
              const isFiltered = filters.selectedParticipantIds.includes(p.id);
              const isMe = currentUser && currentUser.id === p.id;
              const isHost = currentUser?.isHost;

              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isFiltered
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div
                    onClick={() => toggleParticipantFilter(p.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    title={`Click to filter grid to ${p.name}'s schedule`}
                  >
                    {/* Status circle and Avatar */}
                    <div className="relative shrink-0">
                      <span className="text-lg">{p.avatar}</span>
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
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-1.5 py-0.5 text-xs bg-background text-foreground border border-primary rounded outline-none w-28"
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameSave(p.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameSave(p.id)}
                            className="p-0.5 bg-emerald-500 text-white rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-semibold truncate ${isFiltered ? 'text-primary' : 'text-foreground'}`}>
                            {p.name}
                          </span>
                          {isMe && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 rounded">You</span>}
                          {p.isHost && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">Host</span>}
                        </div>
                      )}
                      
                      {/* Last active indicator */}
                      <span className="text-[9px] text-muted-foreground font-medium block">
                        {p.isOnline ? 'Active now' : `Last seen ${new Date(p.lastActive).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>

                  {/* Submit completion indicator & host actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {/* Check badge */}
                    {p.isCompleted ? (
                      <span title="Completed submission">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </span>
                    ) : (
                      <span title="Pending submission">
                        <Circle className="w-4 h-4 text-muted-foreground/40" />
                      </span>
                    )}

                    {/* Host action panel */}
                    {isHost && !isMe && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                        <button
                          onClick={() => {
                            setEditingId(p.id);
                            setEditingName(p.name);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                          title="Rename participant"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeParticipant(p.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-red-500/10 cursor-pointer"
                          title="Remove participant"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Filter Options Panel */}
      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground m-0 flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filters & Controls</span>
          </h2>
          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold text-destructive hover:underline cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Working hours checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="filter-working"
              checked={filters.workingHoursOnly}
              onChange={(e) => setFilter('workingHoursOnly', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="filter-working" className="text-xs font-semibold text-foreground cursor-pointer select-none">
              Preferred Working Hours Only
            </label>
          </div>

          {/* Weekend toggle */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="filter-weekends"
              checked={filters.hideWeekend}
              onChange={(e) => setFilter('hideWeekend', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <label htmlFor="filter-weekends" className="text-xs font-semibold text-foreground cursor-pointer select-none">
              Hide Weekends
            </label>
          </div>

          {/* Min Overlap Slider */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Minimum Overlap</span>
              <span className="text-primary">{filters.minOverlapPercentage}% +</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="20"
              value={filters.minOverlapPercentage}
              onChange={(e) => setFilter('minOverlapPercentage', parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer h-1 bg-muted rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
              <span>Any</span>
              <span>40%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Selected participants filtering alert */}
          {filters.selectedParticipantIds.length > 0 && (
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-1.5 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span>Filtering grid to see overlaps of {filters.selectedParticipantIds.length} participant(s).</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log Feed */}
      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm flex-1 min-h-[200px] flex flex-col">
        <h2 className="text-sm font-bold text-foreground mb-3 shrink-0 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span>Real-time Activity</span>
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-56 pr-1 font-medium">
          {recentActivity.length === 0 ? (
            <div className="text-center text-[11px] text-muted-foreground/60 py-6">
              Listening for activity...
            </div>
          ) : (
            recentActivity.map((log) => (
              <div key={log.id} className="text-xs border-b border-border/40 pb-1.5 last:border-0">
                <p className="text-foreground leading-snug">{log.message}</p>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
