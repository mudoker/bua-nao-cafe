"use client";

import { BarChart3, Grid as GridIcon, Lightbulb, Users } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import Suggestions from '@/components/Suggestions';
import Analytics from '@/components/Analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Language } from '@/utils/translations';

type HomeDashboardProps = {
  activeMobileTab: 'grid' | 'team' | 'suggestions' | 'charts';
  language: Language;
  onMobileTabChange: (value: string) => void;
};

export default function HomeDashboard({ activeMobileTab, language, onMobileTabChange }: HomeDashboardProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6">
        <div className="hidden lg:grid lg:grid-cols-[20rem_1fr] gap-6 items-start">
          <div className="flex flex-col gap-6 sticky top-6">
            <Sidebar />
            <Suggestions />
          </div>
          <div className="flex flex-col gap-6">
            <AvailabilityGrid />
            <Analytics className="shrink-0" />
          </div>
        </div>

        <Tabs
          value={activeMobileTab}
          onValueChange={onMobileTabChange}
          className="w-full lg:hidden flex flex-col gap-4"
        >
          <TabsList className="grid grid-cols-4 w-full h-11 bg-muted/60 dark:bg-zinc-900 border border-border p-1 rounded-xl">
            <TabsTrigger value="grid" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <GridIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Grid' : 'Biểu đồ'}</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Team' : 'Thành viên'}</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Alerts' : 'Khung giờ'}</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer">
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Charts' : 'Thống kê'}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grid" className="mt-0 focus-visible:outline-none"><AvailabilityGrid /></TabsContent>
          <TabsContent value="team" className="mt-0 focus-visible:outline-none"><Sidebar /></TabsContent>
          <TabsContent value="suggestions" className="mt-0 focus-visible:outline-none"><Suggestions /></TabsContent>
          <TabsContent value="charts" className="mt-0 focus-visible:outline-none"><Analytics /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
