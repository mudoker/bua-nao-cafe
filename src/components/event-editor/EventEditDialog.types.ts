import { EventDetails } from '@/types';
import { Language } from '@/utils/translations';

export type EventEditDialogProps = {
  event: EventDetails;
  language: Language;
  onSave: (updates: Partial<EventDetails>) => void;
};
