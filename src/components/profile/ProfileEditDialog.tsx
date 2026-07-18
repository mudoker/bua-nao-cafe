"use client";

import React, { useState, useEffect } from 'react';
import { User, Lock, Settings, Check } from 'lucide-react';
import { useEventStore } from '@/store/useEventStore';
import { getTranslation } from '@/utils/translations';
import { COLORS, AVATARS } from '@/constants/profileOptions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ColorPicker from '../onboarding/ColorPicker';
import AvatarPicker from '../onboarding/AvatarPicker';

interface ProfileEditDialogProps {
  trigger?: React.ReactElement;
}

export default function ProfileEditDialog({ trigger }: ProfileEditDialogProps) {
  const currentUser = useEventStore((state) => state.currentUser);
  const language = useEventStore((state) => state.language);
  const updateParticipant = useEventStore((state) => state.updateParticipant);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setSelectedColor(currentUser.color || COLORS[0]);
      setSelectedAvatar(currentUser.avatar || AVATARS[0]);
      setPassword(currentUser.password || '');
    }
  }, [currentUser, open]);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateParticipant(currentUser.id, {
      name: name.trim(),
      color: selectedColor,
      avatar: selectedAvatar,
      password: password.trim() || undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
    }, 800);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="flex h-7 items-center gap-1 px-2 text-[10px] font-bold border-border bg-card shadow-sm cursor-pointer"
    >
      <Settings className="w-3 h-3" />
      <span>{language === 'en' ? 'Profile' : 'Tài khoản'}</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="max-w-[340px] sm:max-w-[380px] p-5 rounded-2xl border-border bg-card">
        <DialogHeader className="pb-3 border-b border-border/80">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 m-0 text-foreground">
            <Settings className="w-4 h-4 text-primary" />
            <span>{language === 'en' ? 'Profile Settings' : 'Thiết Lập Tài Khoản'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-3">
          <Tabs defaultValue="board" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 dark:bg-muted/20 p-0.5 rounded-lg border border-border/40">
              <TabsTrigger value="board" className="text-xs font-bold py-1 cursor-pointer">
                {language === 'en' ? 'Board Profile' : 'Hồ Sơ Sự Kiện'}
              </TabsTrigger>
              <TabsTrigger value="global" className="text-xs font-bold py-1 cursor-pointer">
                {language === 'en' ? 'Global Account' : 'Tài Khoản'}
              </TabsTrigger>
            </TabsList>

            {/* Board Profile Tab */}
            <TabsContent value="board" className="space-y-4 pt-4 outline-none">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label htmlFor="profile-username" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary/75" />
                  <span>{language === 'en' ? 'Your Display Name' : 'Tên hiển thị'}</span>
                </label>
                <Input
                  id="profile-username"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Huy, John"
                  required
                  className="h-9 text-xs font-bold focus-visible:ring-1 bg-muted/20 border-border text-foreground"
                />
              </div>

              {/* Color Picker */}
              <ColorPicker
                colors={COLORS}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                label={language === 'en' ? 'Choose Theme Color' : 'Chọn màu chủ đề'}
              />

              {/* Avatar Picker */}
              <AvatarPicker
                avatars={AVATARS}
                selectedAvatar={selectedAvatar}
                onSelectAvatar={setSelectedAvatar}
                label={language === 'en' ? 'Select Emoji Avatar' : 'Chọn hình đại diện'}
              />
            </TabsContent>

            {/* Global Account Tab */}
            <TabsContent value="global" className="space-y-4 pt-4 outline-none">
              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="profile-password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-primary/75" />
                  <span>{language === 'en' ? 'Account Password' : 'Mật khẩu bảo vệ'}</span>
                </label>
                <Input
                  id="profile-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Optional (leave blank to remove)' : 'Không bắt buộc (để trống để xóa)'}
                  className="h-9 text-xs font-bold focus-visible:ring-1 bg-muted/20 border-border text-foreground"
                />
                <span className="text-[10px] text-muted-foreground block font-medium leading-normal">
                  {language === 'en'
                    ? 'Protects your schedule edits and recovers your session across browser sessions.'
                    : 'Bảo vệ lịch chỉnh sửa của bạn và khôi phục tài khoản trên các thiết bị khác.'}
                </span>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 font-bold text-xs cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {language === 'en' ? 'Cancel' : 'Hủy'}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={success}
              className={`h-8 font-bold text-xs cursor-pointer min-w-[70px] ${
                success ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''
              }`}
            >
              {success ? (
                <Check className="w-4 h-4 animate-bounce" />
              ) : (
                language === 'en' ? 'Save' : 'Lưu'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
