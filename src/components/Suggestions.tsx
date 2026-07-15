"use client";

import { useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { formatSlotTime, formatSlotDate } from '../utils/time';
import { Sparkles, Calendar, Check, Award, ArrowUpRight, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Suggestions() {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const currentUser = useEventStore((state) => state.currentUser);
  const getRecommendations = useEventStore((state) => state.getRecommendations);
  const finalizeSlot = useEventStore((state) => state.finalizeSlot);
  const language = useEventStore((state) => state.language);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!currentEvent) return null;

  const recommendations = getRecommendations();
  const completedParticipants = participants.filter(p => p.isCompleted);
  const hasSubmissions = completedParticipants.length > 0;

  const handleFinalize = (slotId: string) => {
    const isCurrentlyFinalized = currentEvent.finalizedSlot === slotId;
    finalizeSlot(isCurrentlyFinalized ? null : slotId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-lime-500 bg-lime-500/10 border-lime-500/20';
    if (score >= 30) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-border mb-4">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 m-0">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{getTranslation(language, 'recommendedWindows')}</span>
        </CardTitle>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {getTranslation(language, 'aiRanking')}
        </span>
      </CardHeader>

      <CardContent className="space-y-3">
        {!hasSubmissions ? (
          <div className="text-center py-8 text-xs text-muted-foreground font-semibold flex flex-col items-center gap-2">
            <Calendar className="w-8 h-8 text-muted-foreground/40" />
            <span>{getTranslation(language, 'awaitingResponses')}</span>
            <span className="text-[10px] max-w-xs leading-normal font-medium text-center">
              {getTranslation(language, 'awaitingDesc')}
            </span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6 text-xs text-amber-500 font-semibold flex flex-col items-center gap-2 bg-amber-500/5 rounded-xl border border-amber-500/10 p-4 animate-fadeIn">
            <AlertCircle className="w-8 h-8 text-amber-500/60" />
            <span>{getTranslation(language, 'noOverlap')}</span>
            <span className="text-[10px] text-muted-foreground max-w-xs leading-normal font-medium text-center">
              {getTranslation(language, 'noOverlapDesc')}
            </span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {recommendations.slice(0, 5).map((rec, index) => {
              const isExpanded = expandedId === rec.slotId;
              const isFinalized = currentEvent.finalizedSlot === rec.slotId;
              const isHost = currentUser?.isHost;

              return (
                <div
                  key={rec.slotId}
                  className={`border rounded-xl p-3 transition-all relative overflow-hidden ${
                    isFinalized
                      ? 'border-violet-500 bg-violet-500/5 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'border-border bg-muted/20 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20'
                  }`}
                >
                  {/* Ranking number badge */}
                  <div className="absolute top-0 left-0 bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg border-r border-b border-primary/20">
                    #{index + 1}
                  </div>

                  <div className="flex items-start justify-between gap-2 mt-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground block">
                        {formatSlotDate(rec.slotId)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-bold mt-0.5 block">
                        {formatSlotTime(rec.slotId)}
                      </span>
                    </div>

                    {/* Score badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getScoreColor(rec.score)}`}>
                      {language === 'en' ? 'Score' : 'Điểm'} {Math.round(rec.score)}
                    </span>
                  </div>

                  {/* Overlap Summary progress bar */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>
                        {rec.overlapCount} / {rec.totalCount}{' '}
                        {language === 'en' ? 'participants' : 'thành viên'}
                      </span>
                      <span>
                        {Math.round(rec.percentage)}%{' '}
                        {language === 'en' ? 'match' : 'trùng khớp'}
                      </span>
                    </div>
                    <div className="w-full bg-muted dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isFinalized ? 'bg-violet-500' : 'bg-primary'}`}
                        style={{ width: `${rec.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    {/* Reasons toggle */}
                    <Button
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : rec.slotId)}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer p-0 h-auto hover:bg-transparent"
                    >
                      <span>{getTranslation(language, 'whyRecommended')}</span>
                      {isExpanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronRight className="w-3 h-3 ml-0.5" />}
                    </Button>

                    {/* Finalize slot button */}
                    {isHost ? (
                      <Button
                        onClick={() => handleFinalize(rec.slotId)}
                        size="sm"
                        className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          isFinalized
                            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                            : 'bg-background border border-border text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {isFinalized ? <Check className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                        <span>{isFinalized ? getTranslation(language, 'finalized') : getTranslation(language, 'finalizeSlot')}</span>
                      </Button>
                    ) : (
                      isFinalized && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">
                          <Award className="w-3 h-3 fill-current" />
                          <span>{getTranslation(language, 'finalizedHost')}</span>
                        </span>
                      )
                    )}
                  </div>

                  {/* Reason details drawer */}
                  {isExpanded && (
                    <div className="mt-2.5 p-2 bg-background/50 border border-border/60 rounded-xl space-y-1 animate-slideDown">
                      {rec.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[9px] text-muted-foreground font-semibold">
                          <ArrowUpRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
