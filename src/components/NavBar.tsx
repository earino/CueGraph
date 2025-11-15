import { Link, useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/telemetry';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  screen: string;
}

const navItems: NavItem[] = [
  { path: '/log', label: 'Log', icon: '📝', screen: 'log' },
  { path: '/graph', label: 'Graph', icon: '🕸️', screen: 'graph' },
  { path: '/insights', label: 'Insights', icon: '💡', screen: 'insights' },
  { path: '/history', label: 'History', icon: '📅', screen: 'history' },
  { path: '/settings', label: 'Settings', icon: '⚙️', screen: 'settings' },
];

export function NavBar() {
  const location = useLocation();

  const handleNavClick = (screen: string) => {
    trackEvent('screen_view', { screen });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.screen)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors
                ${isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
                }
              `}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
