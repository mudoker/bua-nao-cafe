"use client";

import { CheckSquare, Redo2, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTranslation } from '@/utils/translations';
import { HeaderToolbeltProps } from './HeaderToolbelt.types';

export default function HeaderToolbelt({
  currentUser,
  language,
  undoStackLength,
  redoStackLength,
  onUndo,
  onRedo,
  onClear,
  onFill,
}: HeaderToolbeltProps) {
  return (
    <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-xl bg-card border border-border p-1 rounded-lg shadow-sm">{currentUser.avatar}</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-none">{currentUser.name}</span>
          <span className="text-[10px] text-muted-foreground font-semibold mt-1">
            {currentUser.isCompleted ? getTranslation(language, 'availSubmitted') : getTranslation(language, 'editingSchedule')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onUndo} disabled={undoStackLength <= 1} className="h-8 w-8 cursor-pointer rounded-lg" title={language === 'en' ? 'Undo edit' : 'Hoàn tác'}>
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="icon" onClick={onRedo} disabled={redoStackLength === 0} className="h-8 w-8 cursor-pointer rounded-lg" title={language === 'en' ? 'Redo edit' : 'Làm lại'}>
          <Redo2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={onClear} className="text-[11px] font-bold border-border/80 hover:bg-red-500/10 hover:text-red-500 cursor-pointer h-8 px-3" title={language === 'en' ? 'Clear all selected slots' : 'Xóa sạch tất cả các ô đã chọn'}>
          <Trash2 className="w-3.5 h-3.5" />
          <span>{getTranslation(language, 'clear')}</span>
        </Button>
        <Button onClick={onFill} size="sm" className="text-[11px] font-bold cursor-pointer h-8 px-3" title={language === 'en' ? 'Select all slots in grid' : 'Chọn tất cả các ô trên lịch'}>
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{getTranslation(language, 'selectAll')}</span>
        </Button>
      </div>
    </div>
  );
}
