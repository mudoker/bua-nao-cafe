export function generateSlots(
  dates: string[],
  startHour: number,
  endHour: number,
  durationMinutes: number
): string[] {
  const slots: string[] = [];
  
  dates.forEach((dateStr) => {
    // Generate slots from startHour to endHour
    for (let hour = startHour; hour < endHour; hour++) {
      const slotsPerHour = 60 / durationMinutes;
      for (let s = 0; s < slotsPerHour; s++) {
        const minute = s * durationMinutes;
        const hrStr = hour.toString().padStart(2, '0');
        const minStr = minute.toString().padStart(2, '0');
        slots.push(`${dateStr}T${hrStr}:${minStr}`);
      }
    }
  });

  return slots;
}

export function parseSlot(slotId: string): Date {
  return new Date(slotId);
}

export function formatSlotTime(slotId: string): string {
  const timePart = slotId.split('T')[1];
  if (!timePart) return '';
  const [hourStr, minStr] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minStr} ${ampm}`;
}

type DateLanguage = 'en' | 'vi';

const getDateLocale = (language: DateLanguage = 'en') => language === 'vi' ? 'vi-VN' : 'en-US';

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSlotDate(slotId: string, language: DateLanguage = 'en'): string {
  const datePart = slotId.split('T')[0];
  if (!datePart) return '';
  const date = parseLocalDate(datePart);
  return date.toLocaleDateString(getDateLocale(language), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getDayName(dateStr: string, language: DateLanguage = 'en'): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(getDateLocale(language), { weekday: 'short' });
}

export function getFormattedDate(dateStr: string, language: DateLanguage = 'en'): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(getDateLocale(language), { month: 'short', day: 'numeric' });
}

export function getHoursArray(startHour: number, endHour: number): number[] {
  const hours: number[] = [];
  for (let i = startHour; i <= endHour; i++) {
    hours.push(i);
  }
  return hours;
}

export function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${ampm}`;
}
