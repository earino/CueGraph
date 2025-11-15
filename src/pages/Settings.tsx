import { useState } from 'react';
import { useCueGraph } from '../lib/store';
import { setAnalyticsEnabled, isPostHogConfigured } from '../lib/telemetry';
import { Modal } from '../components/Modal';
import { DebugInfo } from '../components/DebugInfo';
import type { UserSettings } from '../lib/types';

export function Settings() {
  const { settings, updateUserSettings, eventTypes, clearAllData } = useCueGraph();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);

  if (!settings) return <div>Loading...</div>;

  const handleThemeChange = async (theme: UserSettings['theme']) => {
    await updateUserSettings({ theme });
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    await updateUserSettings({ analyticsEnabled: enabled });
    setAnalyticsEnabled(enabled);
  };

  const handleEdgeThresholdChange = async (threshold: number) => {
    await updateUserSettings({ graphEdgeThreshold: threshold });
  };

  const handleTogglePinned = async (eventTypeId: string) => {
    const newPinned = settings.pinnedEventTypeIds.includes(eventTypeId)
      ? settings.pinnedEventTypeIds.filter(id => id !== eventTypeId)
      : [...settings.pinnedEventTypeIds, eventTypeId];

    await updateUserSettings({ pinnedEventTypeIds: newPinned });
  };

  const handleClearData = async () => {
    await clearAllData();
    setShowClearConfirm(false);
  };

  const pinnedTypes = eventTypes.filter(t => settings.pinnedEventTypeIds.includes(t.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Customize your CueGraph experience
        </p>

        {/* Pinned Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pinned Events
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Quick access buttons on your home screen
          </p>

          <div className="space-y-2 mb-4">
            {pinnedTypes.map(type => (
              <div
                key={type.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-gray-900 dark:text-gray-100">{type.label}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowPinnedModal(true)}
            className="w-full py-2 border border-primary-600 text-primary-600 dark:text-primary-400 font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            Manage Pinned Events
          </button>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Appearance
          </h2>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['system', 'light', 'dark'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.theme === theme
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Graph Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Graph Display
          </h2>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Edge Threshold: {settings.graphEdgeThreshold.toFixed(2)}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Minimum correlation strength to show edges in the graph
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.graphEdgeThreshold}
            onChange={(e) => handleEdgeThresholdChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Show more</span>
            <span>Show less</span>
          </div>
        </div>

        {/* Analytics */}
        {isPostHogConfigured() && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Analytics
            </h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analyticsEnabled}
                onChange={(e) => handleAnalyticsToggle(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Share anonymous usage analytics
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Help improve CueGraph by sharing anonymous usage data. We collect:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-disc space-y-1">
                  <li>Which screens you visit</li>
                  <li>Feature usage (e.g., "event logged", "link added")</li>
                  <li>Configuration changes</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  We <strong>never</strong> collect:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4 list-disc space-y-1">
                  <li>Event labels or content</li>
                  <li>Your notes or timestamps</li>
                  <li>Any personally identifying information</li>
                </ul>
              </div>
            </label>
          </div>
        )}

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Privacy
          </h2>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">All your event data is stored locally</strong> in your browser's IndexedDB.
            </p>
            <p>
              There are no servers, accounts, or tracking of your event contents.
            </p>
            <p>
              Your event logs, notes, and timestamps never leave your device.
            </p>
            {isPostHogConfigured() && (
              <p>
                Optional anonymous usage analytics (if enabled above) only track high-level feature usage to help improve the app.
              </p>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Data
          </h2>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Clear All Data from This Device
          </button>
        </div>

        {/* Version */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          CueGraph v1.0.0
        </div>
      </div>

      {/* Manage pinned events modal */}
      <Modal
        isOpen={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
        title="Manage Pinned Events"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select events to show as quick-log buttons on your home screen
        </p>

        <div className="space-y-2">
          {eventTypes.map(type => {
            const isPinned = settings.pinnedEventTypeIds.includes(type.id);
            return (
              <label
                key={type.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={() => handleTogglePinned(type.id)}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-xl">{type.emoji}</span>
                <span className="text-gray-900 dark:text-gray-100">{type.label}</span>
              </label>
            );
          })}
        </div>
      </Modal>

      {/* Clear data confirmation modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
      >
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          This will permanently delete all your events, links, and custom event types from this device. This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleClearData}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Delete Everything
          </button>
        </div>
      </Modal>

      {/* Debug info - remove after troubleshooting */}
      <DebugInfo />
    </div>
  );
}
