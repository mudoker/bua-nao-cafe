import { Language } from '@/utils/translations';

export type HeaderShareControlsProps = {
  copied: boolean;
  language: Language;
  onShare: () => void;
};
