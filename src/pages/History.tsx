import { useState, useMemo } from 'react';
import { useCueGraph } from '../lib/store';
import { EventCard } from '../components/EventCard';
import { Modal } from '../components/Modal';
import type { EventInstance } from '../lib/types';

export function History() {
  const { eventTypes, eventInstances, eventLinks, deleteEvent } = useCueGraph();

  const [selectedEvent, setSelectedEvent] = useState<EventInstance | null>(null);
  const [filterTypeIds, setFilterTypeIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...eventInstances];

    // Filter by date range
    if (dateRange !== 'all') {
      const now = Date.now();
      const rangeMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[dateRange];

      filtered = filtered.filter(e =>
        now - new Date(e.timestampUTC).getTime() <= rangeMs
      );
    }

    // Filter by event type
    if (filterTypeIds.length > 0) {
      filtered = filtered.filter(e => filterTypeIds.includes(e.eventTypeId));
    }

    // Sort by time (newest first)
    return filtered.sort((a, b) =>
      new Date(b.timestampUTC).getTime() - new Date(a.timestampUTC).getTime()
    );
  }, [eventInstances, filterTypeIds, dateRange]);

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: EventInstance[] } = {};

    filteredEvents.forEach(event => {
      const date = new Date(event.timestampUTC);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });

    return groups;
  }, [filteredEvents]);

  const handleToggleTypeFilter = (typeId: string) => {
    setFilterTypeIds(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const selectedEventType = selectedEvent
    ? eventTypes.find(t => t.id === selectedEvent.eventTypeId)
    : null;

  const selectedEventLinks = selectedEvent
    ? {
        causes: eventLinks
          .filter(l => l.toEventId === selectedEvent.id)
          .map(l => {
            const fromEvent = eventInstances.find(e => e.id === l.fromEventId);
            const fromType = fromEvent ? eventTypes.find(t => t.id === fromEvent.eventTypeId) : null;
            return { link: l, event: fromEvent, eventType: fromType };
          })
          .filter(x => x.event && x.eventType),
        effects: eventLinks
          .filter(l => l.fromEventId === selectedEvent.id)
          .map(l => {
            const toEvent = eventInstances.find(e => e.id === l.toEventId);
            const toType = toEvent ? eventTypes.find(t => t.id === toEvent.eventTypeId) : null;
            return { link: l, event: toEvent, eventType: toType };
          })
          .filter(x => x.event && x.eventType),
      }
    : { causes: [], effects: [] };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          View and manage your logged events
        </p>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <div className="flex gap-2">
              {(['24h', '7d', '30d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range === '24h' && 'Last 24h'}
                  {range === '7d' && 'Last 7d'}
                  {range === '30d' && 'Last 30d'}
                  {range === 'all' && 'All time'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Types ({filterTypeIds.length > 0 ? filterTypeIds.length : 'All'})
            </label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleToggleTypeFilter(type.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterTypeIds.includes(type.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type.emoji} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events list */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No events found. Start logging!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateLabel, events]) => (
              <div key={dateLabel}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {dateLabel}
                </h2>
                <div className="space-y-2">
                  {events.map(event => {
                    const eventType = eventTypes.find(t => t.id === event.eventTypeId);
                    if (!eventType) return null;

                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        eventType={eventType}
                        onClick={() => setSelectedEvent(event)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
      >
        {selectedEvent && selectedEventType && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedEventType.emoji}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedEventType.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedEvent.timestampUTC).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedEvent.intensity && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intensity: {selectedEvent.intensity}/5
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${
                        i < selectedEvent.intensity!
                          ? 'bg-primary-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.note && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note:
                </p>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedEvent.note}
                </p>
              </div>
            )}

            {selectedEventLinks.causes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Believed Causes:
                </p>
                <div className="space-y-2">
                  {selectedEventLinks.causes.map(({ event, eventType }) => (
                    <div
                      key={event!.id}
                      className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-xl">{eventType!.emoji}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {eventType!.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedEventLinks.effects.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Believed Effects:
                </p>
                <div className="space-y-2">
                  {selectedEventLinks.effects.map(({ event, eventType }) => (
                    <div
                      key={event!.id}
                      className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-xl">{eventType!.emoji}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {eventType!.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteEvent}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Delete Event
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
