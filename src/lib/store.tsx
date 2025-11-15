import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db, initializeSettings, initializeBuiltInEventTypes, updateSettings } from './db';
import type { EventType, EventInstance, EventLink, UserSettings, TypeEdgeStats } from './types';
import { computeAllEdges } from './analytics';
import { initTelemetry, trackEvent } from './telemetry';
import builtInEventTypes from '../data/eventTypes.json';

interface CueGraphContextValue {
  // Data
  eventTypes: EventType[];
  eventInstances: EventInstance[];
  eventLinks: EventLink[];
  settings: UserSettings | null;
  edges: TypeEdgeStats[];

  // Event Types
  createEventType: (eventType: Omit<EventType, 'id' | 'createdAt'>) => Promise<EventType>;
  updateEventType: (id: string, updates: Partial<EventType>) => Promise<void>;
  deleteEventType: (id: string) => Promise<void>;

  // Event Instances
  logEvent: (eventTypeId: string, options?: {
    intensity?: number;
    note?: string;
    timestamp?: Date;
  }) => Promise<EventInstance>;
  updateEvent: (id: string, updates: Partial<EventInstance>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Event Links
  createLink: (fromEventId: string, toEventId: string) => Promise<EventLink>;
  deleteLink: (id: string) => Promise<void>;

  // Settings
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;

  // Utility
  clearAllData: () => Promise<void>;
  refreshEdges: () => void;
}

const CueGraphContext = createContext<CueGraphContextValue | null>(null);

export function CueGraphProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [edges, setEdges] = useState<TypeEdgeStats[]>([]);

  // Live queries from IndexedDB
  const eventTypes = useLiveQuery(() => db.eventTypes.toArray(), []) || [];
  const eventInstances = useLiveQuery(() => db.eventInstances.toArray(), []) || [];
  const eventLinks = useLiveQuery(() => db.eventLinks.toArray(), []) || [];
  const settingsRow = useLiveQuery(() => db.userSettings.get(1), []);

  const settings: UserSettings | null = settingsRow
    ? {
        onboardingCompleted: settingsRow.onboardingCompleted,
        pinnedEventTypeIds: settingsRow.pinnedEventTypeIds,
        theme: settingsRow.theme,
        questions: settingsRow.questions,
        graphEdgeThreshold: settingsRow.graphEdgeThreshold,
        analyticsEnabled: settingsRow.analyticsEnabled,
        consentGiven: settingsRow.consentGiven,
      }
    : null;

  // Initialize database on mount
  useEffect(() => {
    async function init() {
      try {
        await initializeSettings();
        await initializeBuiltInEventTypes(builtInEventTypes as EventType[]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }
    init();
  }, []);

  // Initialize telemetry when settings are available and consent is given
  useEffect(() => {
    if (settings) {
      // Only initialize if consent has been explicitly given
      if (settings.consentGiven === true && settings.analyticsEnabled) {
        initTelemetry(settings);
        trackEvent('app_opened');
      }
    }
  }, [settings?.analyticsEnabled, settings?.consentGiven]);

  // Recompute edges when data changes
  const refreshEdges = useCallback(() => {
    if (eventTypes.length > 0 && eventInstances.length > 0) {
      const computed = computeAllEdges(eventTypes, eventInstances, eventLinks);
      setEdges(computed);
    }
  }, [eventTypes, eventInstances, eventLinks]);

  useEffect(() => {
    refreshEdges();
  }, [refreshEdges]);

  // Event Types
  const createEventType = useCallback(async (
    eventType: Omit<EventType, 'id' | 'createdAt'>
  ): Promise<EventType> => {
    const newEventType: EventType = {
      ...eventType,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.eventTypes.add(newEventType);
    trackEvent('event_type_created', { category: eventType.category });
    return newEventType;
  }, []);

  const updateEventType = useCallback(async (
    id: string,
    updates: Partial<EventType>
  ): Promise<void> => {
    await db.eventTypes.update(id, updates);
  }, []);

  const deleteEventType = useCallback(async (id: string): Promise<void> => {
    // Delete all instances and links related to this event type
    const instancesToDelete = await db.eventInstances
      .where('eventTypeId')
      .equals(id)
      .toArray();

    const instanceIds = instancesToDelete.map(i => i.id);

    // Delete links
    await db.eventLinks
      .filter(link =>
        instanceIds.includes(link.fromEventId) ||
        instanceIds.includes(link.toEventId)
      )
      .delete();

    // Delete instances
    await db.eventInstances.where('eventTypeId').equals(id).delete();

    // Delete event type
    await db.eventTypes.delete(id);
  }, []);

  // Event Instances
  const logEvent = useCallback(async (
    eventTypeId: string,
    options: {
      intensity?: number;
      note?: string;
      timestamp?: Date;
    } = {}
  ): Promise<EventInstance> => {
    const timestamp = options.timestamp || new Date();
    const newEvent: EventInstance = {
      id: uuidv4(),
      eventTypeId,
      timestampUTC: timestamp.toISOString(),
      localOffsetMinutes: timestamp.getTimezoneOffset(),
      intensity: options.intensity,
      note: options.note,
    };

    await db.eventInstances.add(newEvent);
    trackEvent('event_logged', {
      has_note: Boolean(options.note),
      has_intensity: Boolean(options.intensity),
    });

    return newEvent;
  }, []);

  const updateEvent = useCallback(async (
    id: string,
    updates: Partial<EventInstance>
  ): Promise<void> => {
    await db.eventInstances.update(id, updates);
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    // Delete related links
    await db.eventLinks
      .filter(link => link.fromEventId === id || link.toEventId === id)
      .delete();

    // Delete event
    await db.eventInstances.delete(id);
  }, []);

  // Event Links
  const createLink = useCallback(async (
    fromEventId: string,
    toEventId: string
  ): Promise<EventLink> => {
    const newLink: EventLink = {
      id: uuidv4(),
      fromEventId,
      toEventId,
      createdAt: new Date().toISOString(),
    };

    await db.eventLinks.add(newLink);
    trackEvent('cause_link_added');

    return newLink;
  }, []);

  const deleteLink = useCallback(async (id: string): Promise<void> => {
    await db.eventLinks.delete(id);
  }, []);

  // Settings
  const updateUserSettings = useCallback(async (
    updates: Partial<UserSettings>
  ): Promise<void> => {
    await updateSettings(updates);
    trackEvent('settings_updated', {
      fields: Object.keys(updates),
    });
  }, []);

  // Utility
  const clearAllData = useCallback(async (): Promise<void> => {
    await db.eventInstances.clear();
    await db.eventLinks.clear();
    await db.eventTypes.clear();
    await db.userSettings.clear();

    // Reinitialize
    await initializeSettings();
    await initializeBuiltInEventTypes(builtInEventTypes as EventType[]);

    trackEvent('data_cleared');
  }, []);

  const value: CueGraphContextValue = {
    eventTypes,
    eventInstances,
    eventLinks,
    settings,
    edges,
    createEventType,
    updateEventType,
    deleteEventType,
    logEvent,
    updateEvent,
    deleteEvent,
    createLink,
    deleteLink,
    updateUserSettings,
    clearAllData,
    refreshEdges,
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <CueGraphContext.Provider value={value}>
      {children}
    </CueGraphContext.Provider>
  );
}

export function useCueGraph() {
  const context = useContext(CueGraphContext);
  if (!context) {
    throw new Error('useCueGraph must be used within CueGraphProvider');
  }
  return context;
}
