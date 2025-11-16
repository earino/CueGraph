import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CueGraphProvider, useCueGraph } from './lib/store';
import { ToastProvider } from './lib/useToasts';
import { ToastContainer } from './components/Toast';
import { ConsentBanner } from './components/ConsentBanner';
import { NavBar } from './components/NavBar';
import { Onboarding } from './pages/Onboarding';
import { Log } from './pages/Log';
import { History } from './pages/History';
import { Graph } from './pages/Graph';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { useEffect, useState } from 'react';

function AppRoutes() {
  const { settings } = useCueGraph();
  const [themeClass, setThemeClass] = useState('');

  // Handle theme changes
  useEffect(() => {
    if (!settings) return;

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        setThemeClass('dark');
      } else if (settings.theme === 'light') {
        setThemeClass('');
      } else {
        // System theme
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeClass(isDark ? 'dark' : '');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings?.theme]);

  // Apply theme class to document
  useEffect(() => {
    if (themeClass) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeClass]);

  if (!settings) {
    return <div>Loading...</div>;
  }

  // If onboarding not completed, redirect to onboarding
  if (!settings.onboardingCompleted) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
        <ConsentBanner />
      </>
    );
  }

  // Main app routes
  return (
    <div className="pb-16">
      <Routes>
        <Route path="/log" element={<Log />} />
        <Route path="/history" element={<History />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/log" replace />} />
        <Route path="*" element={<Navigate to="/log" replace />} />
      </Routes>
      <NavBar />
      <ToastContainer />
      <ConsentBanner />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <CueGraphProvider>
          <AppRoutes />
        </CueGraphProvider>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
