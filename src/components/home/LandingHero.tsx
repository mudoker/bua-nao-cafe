"use client";

import { Calendar, Coffee, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getTranslation, Language } from '@/utils/translations';

export default function LandingHero({ language }: { language: Language }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-8 space-y-4 flex flex-col items-center">
      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner inline-flex items-center justify-center mb-1">
        <Coffee className="w-10 h-10 text-primary animate-pulse" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
        <Sparkles className="w-3 h-3" />
        <span>{language === 'en' ? 'Frictionless Group Scheduler' : 'Tìm lịch rảnh nhóm nhanh chóng'}</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground m-0 leading-tight">
        {getTranslation(language, 'landingTitle')}{' '}
        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
          {getTranslation(language, 'landingTitleGrad')}
        </span>
      </h1>
      <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed font-semibold">
        {getTranslation(language, 'landingDesc')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{getTranslation(language, 'zeroAccounts')}</span>
        </span>
        <span className="w-1.5 h-1.5 bg-border rounded-full" />
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{getTranslation(language, 'realtimeSync')}</span>
        </span>
        <span className="w-1.5 h-1.5 bg-border rounded-full" />
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span>{getTranslation(language, 'mobilePainting')}</span>
        </span>
      </div>
    </div>
  );
}
