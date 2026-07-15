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

export function formatSlotDate(slotId: string): string {
  const datePart = slotId.split('T')[0];
  if (!datePart) return '';
  const date = new Date(datePart);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getFormattedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
