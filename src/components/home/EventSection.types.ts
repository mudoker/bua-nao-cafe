import { AccountEventSummary } from '@/types';

export type EventSectionProps = {
  title: string;
  emptyText: string;
  events: AccountEventSummary[];
  onOpenEvent: (id: string) => void;
  muted?: boolean;
};
