"use client";

import { Users } from 'lucide-react';
import { AccountEventSummary } from '@/types';
import { Language } from '@/utils/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EventSection from './EventSection';

type EventListPanelProps = {
  events: AccountEventSummary[];
  language: Language;
  onOpenEvent: (id: string) => void;
};

export default function EventListPanel({ events, language, onOpenEvent }: EventListPanelProps) {
  const pendingEvents = events.filter((event) => event.isPending);
  const previousEvents = events.filter((event) => !event.isPending);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>{language === 'en' ? 'Your events' : 'Lịch của bạn'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {events.length === 0 ? (
          <p className="text-xs font-semibold text-muted-foreground">
            {language === 'en' ? 'No saved events for this account yet.' : 'Chưa có lịch nào cho tài khoản này.'}
          </p>
        ) : (
          <>
            <EventSection
              title={language === 'en' ? 'Pending' : 'Đang chờ'}
              emptyText={language === 'en' ? 'Nothing pending.' : 'Không có lịch đang chờ.'}
              events={pendingEvents}
              onOpenEvent={onOpenEvent}
            />
            <EventSection
              title={language === 'en' ? 'Previous' : 'Đã qua'}
              emptyText={language === 'en' ? 'No previous events.' : 'Chưa có lịch đã qua.'}
              events={previousEvents}
              onOpenEvent={onOpenEvent}
              muted
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
