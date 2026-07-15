"use client";

import { Suspense } from 'react';
import HomeContent from '@/components/home/HomeContent';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-bold text-sm">
        Loading group scheduler...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
