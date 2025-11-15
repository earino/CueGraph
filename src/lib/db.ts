import Dexie, { type Table } from 'dexie';
import type { EventType, EventInstance, EventLink, UserSettings } from './types';

export class CueGraphDB extends Dexie {
  eventTypes!: Table<EventType>;
  eventInstances!: Table<EventInstance>;
  eventLinks!: Table<EventLink>;
  userSettings!: Table<UserSettings & { id: number }>;

  constructor() {
    super('CueGraphDB');
    this.version(1).stores({
      eventTypes: 'id, label, category, isBuiltIn',
      eventInstances: 'id, eventTypeId, timestampUTC',
      eventLinks: 'id, fromEventId, toEventId, createdAt',
      userSettings: 'id'
    });
  }
}

export const db = new CueGraphDB();

// Initialize default user settings if not present
export async function initializeSettings(): Promise<UserSettings> {
  const existing = await db.userSettings.get(1);
  if (existing) {
    const { id, ...settings } = existing;
    return settings;
  }

  const defaultSettings: UserSettings = {
    onboardingCompleted: false,
    pinnedEventTypeIds: [],
    theme: 'system',
    questions: [],
    graphEdgeThreshold: 0.3,
    analyticsEnabled: true, // Enabled by default, users can opt out in Settings
  };

  await db.userSettings.put({ id: 1, ...defaultSettings });
  return defaultSettings;
}

// Initialize built-in event types
export async function initializeBuiltInEventTypes(builtInTypes: EventType[]): Promise<void> {
  const existingCount = await db.eventTypes.count();

  if (existingCount === 0) {
    // First time initialization - add all built-in types
    await db.eventTypes.bulkPut(builtInTypes);
  } else {
    // Check if there are new built-in types to add
    for (const builtInType of builtInTypes) {
      const existing = await db.eventTypes.get(builtInType.id);
      if (!existing) {
        await db.eventTypes.put(builtInType);
      }
    }
  }
}

// Helper function to update settings
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const current = await db.userSettings.get(1);
  if (current) {
    await db.userSettings.update(1, updates);
  } else {
    const defaultSettings = await initializeSettings();
    await db.userSettings.update(1, { ...defaultSettings, ...updates });
  }
}
