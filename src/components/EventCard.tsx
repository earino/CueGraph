import { Trash2 } from 'lucide-react';
import type { EventInstance, EventType } from '../lib/types';

interface EventCardProps {
  event: EventInstance;
  eventType: EventType;
  onClick?: () => void;
  onDelete?: () => void;
}

export function EventCard({ event, eventType, onClick, onDelete }: EventCardProps) {
  // Convert UTC to local time
  const date = new Date(event.timestampUTC);
  const localTime = new Date(date.getTime() - event.localOffsetMinutes * 60 * 1000);
  const timeString = localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {eventType.emoji && (
          <span className="text-3xl flex-shrink-0">{eventType.emoji}</span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {eventType.label}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {timeString}
              </span>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1">
            {event.intensity && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Intensity:</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < event.intensity!
                          ? 'bg-primary-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {event.note && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                📝 Note
              </span>
            )}
          </div>

          {event.note && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {event.note}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
