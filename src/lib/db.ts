import fs from 'fs';
import path from 'path';
import { Participant, EventDetails, AvailabilityMap } from '../types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface SavedEvent {
  currentEvent: EventDetails;
  participants: Participant[];
  availability: AvailabilityMap;
}

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf-8');
  }
}

export function getEvent(id: string): SavedEvent | null {
  ensureDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    return db[id] || null;
  } catch (error) {
    console.error('Error reading DB:', error);
    return null;
  }
}

export function getEvents(): SavedEvent[] {
  ensureDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    return Object.values(db);
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
}

export function saveEvent(id: string, eventData: SavedEvent) {
  ensureDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);
    db[id] = eventData;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}
