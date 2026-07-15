"use client";

import React, { useEffect, useState } from 'react';
import { useEventStore } from '../store/useEventStore';
import { getTranslation } from '../utils/translations';
import { COLORS, AVATARS } from '../constants/profileOptions';
import { Users, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import AvatarPicker from './onboarding/AvatarPicker';
import ColorPicker from './onboarding/ColorPicker';
import OnboardingError from './onboarding/OnboardingError';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OnboardingProps {
  onJoinSuccess?: () => void;
}

export default function ParticipantOnboarding({ onJoinSuccess }: OnboardingProps) {
  const account = useEventStore((state) => state.account);
  const currentEvent = useEventStore((state) => state.currentEvent);
  const participants = useEventStore((state) => state.participants);
  const joinAsParticipant = useEventStore((state) => state.joinAsParticipant);
  const resetEvent = useEventStore((state) => state.resetEvent);
  const language = useEventStore((state) => state.language);

  const [name, setName] = useState(account?.name || '');
  const [password, setPassword] = useState(account?.password || '');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (!account) return;

    const matchingParticipant = participants.find((participant) => {
      const participantAccount = participant.accountName || normalize(participant.name);
      return participantAccount === normalize(account.name) || normalize(participant.name) === normalize(account.name);
    });

    if (matchingParticipant?.password && matchingParticipant.password !== account.password) {
      setError(
        language === 'en'
          ? 'This username already exists in this event, but the password does not match.'
          : 'Tên này đã tồn tại trong lịch này, nhưng mật khẩu không khớp.'
      );
    }
  }, [account, participants, language]);

  if (!currentEvent) return null;

  const handleBack = () => {
    resetEvent();
    if (typeof window === 'undefined') return;

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('event');
    window.history.pushState({}, '', url.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(getTranslation(language, 'nameError'));
      return;
    }
    if (name.length > 25) {
      setError(getTranslation(language, 'nameTooLong'));
      return;
    }
    setError('');

    try {
      joinAsParticipant(name.trim(), selectedColor, selectedAvatar, password || undefined);
      if (onJoinSuccess) onJoinSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      if (message === 'PASSWORD_MISMATCH') {
        setError(
          language === 'en'
            ? 'This username already exists in this event, but the password does not match.'
            : 'Tên này đã tồn tại trong lịch này, nhưng mật khẩu không khớp.'
        );
      } else if (message === 'USERNAME_TAKEN') {
        setError(
          language === 'en'
            ? 'This username is already used by another participant in this event.'
            : 'Tên này đã được một thành viên khác dùng trong lịch này.'
        );
      } else {
        setError(message);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border glow-primary">
      <div className="px-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-8 px-2 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Back' : 'Quay lại'}</span>
        </Button>
      </div>
      <CardHeader className="flex flex-col items-center text-center pb-2">
        <div className="p-3 bg-primary/10 rounded-full mb-3 border border-primary/20"><Calendar className="w-8 h-8 text-primary" /></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
          {getTranslation(language, 'joinWorkspace')}
        </span>
        <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">
          {currentEvent.title}
        </CardTitle>
        {currentEvent.description && (
          <CardDescription className="text-xs font-semibold text-muted-foreground mt-2 max-w-xs line-clamp-2">
            {currentEvent.description}
          </CardDescription>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-2">
          {/* Name input */}
          <div className="space-y-2">
            <label htmlFor="participant-name" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {getTranslation(language, 'displayName')}
            </label>
            <Input
              id="participant-name"
              type="text"
              required
              placeholder={getTranslation(language, 'namePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="font-semibold text-foreground h-11 px-3.5"
            />
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label htmlFor="participant-password" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {language === 'en' ? 'Password (Optional)' : 'Mật khẩu (Tùy chọn)'}
            </label>
            <Input
              id="participant-password"
              type="password"
              placeholder={language === 'en' ? 'Protects your schedule edits' : 'Bảo vệ lịch chỉnh sửa của bạn'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="font-semibold text-foreground h-11 px-3.5"
            />
            <p className="text-[10px] text-muted-foreground font-semibold leading-tight">
              {language === 'en' 
                ? 'Create a password to keep others from editing your slots, or enter your password to reload your schedule.' 
                : 'Tạo mật khẩu để tránh người khác chỉnh sửa lịch của bạn, hoặc nhập lại mật khẩu để tải lịch đã lưu.'}
            </p>
          </div>

          <OnboardingError message={error} />
          <ColorPicker colors={COLORS} selectedColor={selectedColor} onSelectColor={setSelectedColor} label={getTranslation(language, 'chooseTheme')} />
          <AvatarPicker avatars={AVATARS} selectedAvatar={selectedAvatar} onSelectAvatar={setSelectedAvatar} label={getTranslation(language, 'selectAvatar')} />
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer hover:scale-[1.005] active:scale-[0.995] transition-all py-6"
          >
            <span>{getTranslation(language, 'enterScheduler')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold pt-2 border-t border-border w-full">
            <Users className="w-4 h-4" />
            <span>{getTranslation(language, 'noRegistration')}</span>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
