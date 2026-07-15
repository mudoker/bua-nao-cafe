"use client";

import { Input } from '@/components/ui/input';
import { LoginInputProps } from './AccountLogin.types';

export default function LoginInput({
  id,
  label,
  value,
  placeholder,
  icon,
  onChange,
  onClearError,
  type = 'text',
  autoFocus,
}: LoginInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {icon}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onClearError();
          }}
          placeholder={placeholder}
          className="h-12 pl-9 pr-3 font-bold"
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
