interface ChipProps {
  label: string;
  emoji?: string;
  onClick?: () => void;
  selected?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}

export function Chip({ label, emoji, onClick, selected = false, variant = 'default' }: ChipProps) {
  const variantStyles = {
    default: selected
      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
    primary: 'bg-primary-600 text-white border-primary-600',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5
        rounded-full
        text-sm font-medium
        border
        transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md active:scale-95' : 'cursor-default'}
        ${variantStyles[variant]}
      `}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}
