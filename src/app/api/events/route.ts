import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('user')?.trim().toLowerCase();
  const password = searchParams.get('password') || undefined;

  if (!name) {
    return NextResponse.json([]);
  }

  const now = Date.now();
  const events = (await getEvents())
    .map(({ currentEvent, participants }) => {
      const participant = participants.find((p) => {
        const participantAccount = p.accountName || p.name.trim().toLowerCase();
        if (participantAccount !== name) return false;
        return p.password ? p.password === password : !password;
      });

      if (!participant) return null;

      const deadlineTime = currentEvent.deadline ? new Date(currentEvent.deadline).getTime() : null;
      const isPending = !currentEvent.finalizedSlot && (!deadlineTime || deadlineTime >= now);

      return {
        id: currentEvent.id,
        title: currentEvent.title,
        description: currentEvent.description,
        organizer: currentEvent.organizer,
        dates: currentEvent.dates,
        timezone: currentEvent.timezone,
        isPending,
        finalizedSlot: currentEvent.finalizedSlot,
        participant,
      };
    })
    .filter(Boolean);

  return NextResponse.json(events);
}
