import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useCueGraph } from '../lib/store';
import { useToasts } from '../lib/useToasts';
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
  const [showCelebration, setShowCelebration] = useState(false);

  // New event type form
  const [newEventName, setNewEventName] = useState('');
  const [newEventEmoji, setNewEventEmoji] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<EventType['category']>('other');
  const [pinNewEvent, setPinNewEvent] = useState(false);

  const pinnedTypes = eventTypes.filter(t =>
    (settings?.pinnedEventTypeIds ?? []).includes(t.id)
  );

  const handleQuickLog = async (eventType: EventType) => {
    const event = await logEvent(eventType.id);
    setJustLoggedEvent(event);

    // Show celebration
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1000);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Log Event
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            What just happened?
          </p>
        </motion.div>

        {/* Pinned event types */}
        {pinnedTypes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {pinnedTypes.map((eventType, index) => (
              <motion.div
                key={eventType.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => handleQuickLog(eventType)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                >
                  <div className="text-4xl mb-2">{eventType.emoji}</div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {eventType.label}
                  </p>
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6 mb-6 text-center"
          >
            <div className="text-4xl mb-3">👋</div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No events pinned yet
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create your first event below to start tracking!
            </p>
          </motion.div>
        )}

        {/* Create new event button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </motion.button>

        {/* Recent activity */}
        {eventInstances.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {eventInstances
                .slice()
                .sort((a, b) => new Date(b.timestampUTC).getTime() - new Date(a.timestampUTC).getTime())
                .slice(0, 5)
                .map((instance, index) => {
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
                    <motion.div
                      key={instance.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                    >
                      <div className="text-3xl">{eventType.emoji}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {eventType.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {timeAgoStr}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
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
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
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
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors text-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as EventType['category'])}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors"
            >
              <option value="action">Action</option>
              <option value="symptom">Symptom</option>
              <option value="mood">Mood</option>
              <option value="situation">Situation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pinNewEvent}
              onChange={(e) => setPinNewEvent(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Pin to home screen for quick access
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateEventType}
            disabled={!newEventName.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg"
          >
            Create & Log Event
          </motion.button>
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
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🤔</div>
            <p className="text-gray-600 dark:text-gray-400">
              No recent events found in the past 72 hours.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Start logging more events to build connections!
            </p>
          </div>
        )}

        <button
          onClick={() => setShowCauseSheet(false)}
          className="w-full mt-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </BottomSheet>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.5 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-8xl"
            >
              ✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
