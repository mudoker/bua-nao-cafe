"use client";

import { Check, QrCode, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getTranslation } from '@/utils/translations';
import { HeaderShareControlsProps } from './HeaderShareControls.types';
import ShareQrCode from './ShareQrCode';

export default function HeaderShareControls({ copied, language, onShare }: HeaderShareControlsProps) {
  return (
    <div className="flex items-center">
      <Button
        onClick={onShare}
        variant="outline"
        size="sm"
        className="rounded-l-lg rounded-r-none border-r-0 font-bold cursor-pointer h-9 px-3.5"
        title={language === 'en' ? 'Share board invitation' : 'Chia sẻ lời mời'}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{copied ? getTranslation(language, 'copiedLink') : getTranslation(language, 'copyInvite')}</span>
      </Button>
      <Dialog>
        <DialogTrigger
          className="inline-flex items-center justify-center rounded-l-none cursor-pointer h-9 w-9 border-l border-border rounded-r-lg bg-background border border-input text-foreground hover:bg-muted dark:hover:bg-zinc-800"
          title={getTranslation(language, 'qrCode')}
        >
          <QrCode className="w-3.5 h-3.5" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs flex flex-col items-center justify-center p-6 bg-card border-border glow-primary rounded-2xl">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">
              {getTranslation(language, 'qrCode')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-border mt-2">
            <ShareQrCode />
          </div>
          <span className="text-[10px] text-center text-muted-foreground font-semibold mt-3 max-w-xs leading-normal">
            {getTranslation(language, 'scanQr')}
          </span>
        </DialogContent>
      </Dialog>
    </div>
  );
}
