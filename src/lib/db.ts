import { neon } from '@neondatabase/serverless';
import { EventRow, SavedEvent } from './db.types';

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return url;
};

const sql = neon(getDatabaseUrl());

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  schemaReady ??= sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      current_event JSONB NOT NULL,
      participants JSONB NOT NULL DEFAULT '[]'::jsonb,
      availability JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.then(() => undefined);

  await schemaReady;
}

const rowToSavedEvent = (row: EventRow): SavedEvent => ({
  currentEvent: row.current_event,
  participants: row.participants,
  availability: row.availability,
});

export async function getEvent(id: string): Promise<SavedEvent | null> {
  await ensureSchema();

  const rows = await sql`
    SELECT id, current_event, participants, availability
    FROM events
    WHERE id = ${id}
    LIMIT 1
  ` as EventRow[];

  return rows[0] ? rowToSavedEvent(rows[0]) : null;
}

export async function getEvents(): Promise<SavedEvent[]> {
  await ensureSchema();

  const rows = await sql`
    SELECT id, current_event, participants, availability
    FROM events
    ORDER BY updated_at DESC
  ` as EventRow[];

  return rows.map(rowToSavedEvent);
}

export async function saveEvent(id: string, eventData: SavedEvent): Promise<void> {
  await ensureSchema();

  await sql`
    INSERT INTO events (id, current_event, participants, availability, updated_at)
    VALUES (
      ${id},
      ${JSON.stringify(eventData.currentEvent)}::jsonb,
      ${JSON.stringify(eventData.participants)}::jsonb,
      ${JSON.stringify(eventData.availability)}::jsonb,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      current_event = EXCLUDED.current_event,
      participants = EXCLUDED.participants,
      availability = EXCLUDED.availability,
      updated_at = NOW()
  `;
}
