"use client";

import React, { useState } from 'react';
import { ArrowRight, Coffee, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { useEventStore } from '@/store/useEventStore';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import LoginInput from './LoginInput';

export default function AccountLogin() {
  const login = useEventStore((state) => state.login);
  const language = useEventStore((state) => state.language);
  const setLanguage = useEventStore((state) => state.setLanguage);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(language === 'en' ? 'Please enter a username.' : 'Vui lòng nhập tên đăng nhập.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    await login(name.trim(), password || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black leading-none">Bữa Nào Cafe?</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  {language === 'en' ? 'Group scheduling' : 'Lên lịch nhóm'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'en' ? 'Welcome back' : 'Chào mừng trở lại'}</span>
                </p>
                <h2 className="m-0 text-2xl font-black tracking-normal text-foreground">
                  {language === 'en' ? 'Enter your board' : 'Vào bảng lịch của bạn'}
                </h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
                  {language === 'en'
                    ? 'Use the same name to see previous and pending events.'
                    : 'Dùng cùng một tên để xem lịch cũ và lịch đang chờ.'}
                </p>
              </div>
              <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-[10px] font-black">
                {(['en', 'vi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${language === lang ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <LoginInput
                id="account-name"
                label={language === 'en' ? 'Username' : 'Tên đăng nhập'}
                value={name}
                placeholder={language === 'en' ? 'e.g., Elsa Phun Lua' : 'VD: Elsa Phun Lua'}
                icon={<UserRound className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />}
                onChange={setName}
                onClearError={() => setError('')}
                autoFocus
              />
              <LoginInput
                id="account-password"
                label={language === 'en' ? 'Password optional' : 'Mật khẩu tùy chọn'}
                value={password}
                placeholder={language === 'en' ? 'Protect host access' : 'Bảo vệ quyền chủ lịch'}
                icon={<LockKeyhole className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />}
                onChange={setPassword}
                onClearError={() => setError('')}
                type="password"
              />
              {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</div>}
              <Button type="submit" className="w-full h-12 justify-between px-4 font-black cursor-pointer" disabled={isSubmitting}>
                <span>{isSubmitting ? (language === 'en' ? 'Entering...' : 'Đang vào...') : (language === 'en' ? 'Continue' : 'Tiếp tục')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
