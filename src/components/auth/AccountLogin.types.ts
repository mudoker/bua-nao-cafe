import React from 'react';

export type LoginInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
  onClearError: () => void;
  type?: string;
  autoFocus?: boolean;
};
