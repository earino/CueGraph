import { useState } from 'react';
import { useCueGraph } from '../lib/store';
import { useToasts } from '../lib/useToasts';
import { EventButton } from '../components/EventButton';
import { Modal } from '../components/Modal';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import type { EventInstance, EventType } from '../lib/types';

export function Log() {
  const { eventTypes, settings, logEvent, createLink, eventInstances, createEventType, updateUserSettings } = useCueGraph();
  const { addToast } = useToasts();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCauseSheet, setShowCauseSheet] = useState(false);
  const [justLoggedEvent, setJustLoggedEvent] = useState<EventInstance | null>(null);

  // New event type form
  const [newEventName, setNewEventName] = useState('');
  const [newEventEmoji, setNewEventEmoji] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<EventType['category']>('other');
  const [pinNewEvent, setPinNewEvent] = useState(false);

  const pinnedTypes = eventTypes.filter(t =>
    settings?.pinnedEventTypeIds.includes(t.id)
  );

  const handleQuickLog = async (eventType: EventType) => {
    const event = await logEvent(eventType.id);
    setJustLoggedEvent(event);
    addToast(`Logged: ${eventType.label} ${eventType.emoji || ''}`, 'success');

    // Show "what caused this?" sheet
    setShowCauseSheet(true);
  };

  const handleCreateEventType = async () => {
    if (!newEventName.trim()) return;

    const newType = await createEventType({
      label: newEventName.trim(),
      emoji: newEventEmoji || undefined,
      category: newEventCategory,
    });

    if (pinNewEvent && settings) {
      await updateUserSettings({
        pinnedEventTypeIds: [...settings.pinnedEventTypeIds, newType.id],
      });
    }

    // Log this new event immediately
    await handleQuickLog(newType);

    // Reset form
    setNewEventName('');
    setNewEventEmoji('');
    setNewEventCategory('other');
    setPinNewEvent(false);
    setShowCreateModal(false);

    addToast('Event type created!', 'success');
  };

  const handleAddCause = async (causeEventId: string) => {
    if (!justLoggedEvent) return;

    await createLink(causeEventId, justLoggedEvent.id);
    addToast('Cause link added!', 'success');
  };

  // Get recent events for "what caused this?" (last 72 hours)
  const getRecentEvents = (): Array<{ event: EventInstance; eventType: EventType; hoursAgo: number }> => {
    if (!justLoggedEvent) return [];

    const justLoggedTime = new Date(justLoggedEvent.timestampUTC).getTime();
    const lookbackMs = 72 * 60 * 60 * 1000; // 72 hours

    return eventInstances
      .filter(e => {
        const eventTime = new Date(e.timestampUTC).getTime();
        const deltaMs = justLoggedTime - eventTime;
        return e.id !== justLoggedEvent.id && deltaMs > 0 && deltaMs <= lookbackMs;
      })
      .map(e => {
        const eventType = eventTypes.find(t => t.id === e.eventTypeId)!;
        const hoursAgo = (justLoggedTime - new Date(e.timestampUTC).getTime()) / (1000 * 60 * 60);
        return { event: e, eventType, hoursAgo };
      })
      .sort((a, b) => a.hoursAgo - b.hoursAgo);
  };

  const recentEvents = getRecentEvents();
  const justLoggedType = justLoggedEvent
    ? eventTypes.find(t => t.id === justLoggedEvent.eventTypeId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Log Event
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Quick log an event that just happened
        </p>

        {/* Pinned event types */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {pinnedTypes.map(eventType => (
            <EventButton
              key={eventType.id}
              eventType={eventType}
              onClick={() => handleQuickLog(eventType)}
              variant="large"
            />
          ))}
        </div>

        {/* Create new event button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
        >
          + Add New Event Type
        </button>

        {/* Recent activity */}
        {eventInstances.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {eventInstances
                .slice()
                .sort((a, b) => new Date(b.timestampUTC).getTime() - new Date(a.timestampUTC).getTime())
                .slice(0, 5)
                .map(instance => {
                  const eventType = eventTypes.find(t => t.id === instance.eventTypeId);
                  if (!eventType) return null;

                  const date = new Date(instance.timestampUTC);
                  const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
                  const timeAgoStr = timeAgo < 60
                    ? `${timeAgo}m ago`
                    : timeAgo < 1440
                    ? `${Math.floor(timeAgo / 60)}h ago`
                    : `${Math.floor(timeAgo / 1440)}d ago`;

                  return (
                    <div
                      key={instance.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-2xl">{eventType.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {eventType.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {timeAgoStr}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Create event modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Event Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event name *
            </label>
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g., Morning coffee"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emoji (optional)
            </label>
            <input
              type="text"
              value={newEventEmoji}
              onChange={(e) => setNewEventEmoji(e.target.value)}
              placeholder="☕"
              maxLength={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as EventType['category'])}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="action">Action</option>
              <option value="symptom">Symptom</option>
              <option value="mood">Mood</option>
              <option value="situation">Situation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pinNewEvent}
              onChange={(e) => setPinNewEvent(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Pin to home screen
            </span>
          </label>

          <button
            onClick={handleCreateEventType}
            disabled={!newEventName.trim()}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create & Log
          </button>
        </div>
      </Modal>

      {/* What caused this? bottom sheet */}
      <BottomSheet
        isOpen={showCauseSheet}
        onClose={() => setShowCauseSheet(false)}
        title={justLoggedType ? `What caused "${justLoggedType.label}"?` : 'Add cause'}
      >
        {recentEvents.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select events from the past 72 hours that might have caused this:
            </p>

            <div className="space-y-2">
              {recentEvents.map(({ event, eventType, hoursAgo }) => {
                const hoursStr = hoursAgo < 1
                  ? `${Math.round(hoursAgo * 60)}m ago`
                  : hoursAgo < 24
                  ? `${Math.round(hoursAgo)}h ago`
                  : `${Math.round(hoursAgo / 24)}d ago`;

                return (
                  <Chip
                    key={event.id}
                    label={`${eventType.label} (${hoursStr})`}
                    emoji={eventType.emoji}
                    onClick={() => {
                      handleAddCause(event.id);
                      setShowCauseSheet(false);
                    }}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No recent events found in the past 72 hours. Start logging more events to build connections!
          </p>
        )}

        <button
          onClick={() => setShowCauseSheet(false)}
          className="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg"
        >
          Skip for now
        </button>
      </BottomSheet>
    </div>
  );
}
