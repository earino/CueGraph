import type { EventType } from '../lib/types';

interface EventButtonProps {
  eventType: EventType;
  onClick: () => void;
  variant?: 'default' | 'small' | 'large';
  selected?: boolean;
}

export function EventButton({ eventType, onClick, variant = 'default', selected = false }: EventButtonProps) {
  const sizes = {
    small: 'px-3 py-2 text-sm',
    default: 'px-4 py-3 text-base',
    large: 'px-6 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizes[variant]}
        rounded-xl
        font-medium
        transition-all
        active:scale-95
        ${selected
          ? 'bg-primary-600 text-white shadow-lg'
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {eventType.emoji && (
          <span className="text-xl">{eventType.emoji}</span>
        )}
        <span className="truncate">{eventType.label}</span>
      </div>
    </button>
  );
}
