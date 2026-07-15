export type ColorPickerProps = {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  label: string;
};

export type AvatarPickerProps = {
  avatars: string[];
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  label: string;
};
