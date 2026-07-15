import { Participant } from '@/types';
import { Language } from '@/utils/translations';

export type HeaderToolbeltProps = {
  currentUser: Participant;
  language: Language;
  undoStackLength: number;
  redoStackLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onFill: () => void;
};
