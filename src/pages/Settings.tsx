import { useState } from 'react';
import { useCueGraph } from '../lib/store';
import { setAnalyticsEnabled, isPostHogConfigured } from '../lib/telemetry';
import { Modal } from '../components/Modal';
import { DebugInfo } from '../components/DebugInfo';
import { useInstallPrompt } from '../components/InstallPrompt';
import { Download, CheckCircle, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import type { UserSettings } from '../lib/types';
import { exitOnboardingMode, enterOnboardingMode, getCompletionPercentage, getCurrentStreak } from '../lib/onboardingLogic';
import { getPhaseDescription } from '../lib/onboardingContent';

export function Settings() {
  const { settings, updateUserSettings, eventTypes, clearAllData } = useCueGraph();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

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

  const handleToggleOnboardingMode = async () => {
    const updates = settings.onboardingMode ? exitOnboardingMode() : enterOnboardingMode();
    await updateUserSettings(updates);
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

        {/* 60-Day Guided Onboarding */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Guided Onboarding
            </h2>
          </div>

          {settings.onboardingStartDate ? (
            <>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Day</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {settings.currentOnboardingDay}/60
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {settings.onboardingDaysCompleted.length}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{getCompletionPercentage(settings).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${getCompletionPercentage(settings)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Phase</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {settings.onboardingPhase.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Streak</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {getCurrentStreak(settings)} days 🔥
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {getPhaseDescription(settings.onboardingPhase)}
              </p>

              <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.onboardingMode}
                  onChange={handleToggleOnboardingMode}
                  className="mt-1 w-5 h-5 text-purple-600 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Show daily goals and guidance
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {settings.onboardingMode
                      ? 'You\'re in guided mode. Daily prompts help you build great habits.'
                      : 'You\'re in advanced mode. Enable this to see daily goals again.'}
                  </p>
                </div>
              </label>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You haven't started the guided onboarding journey yet. It will begin automatically after completing the initial setup.
            </p>
          )}
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

        {/* Install App */}
        {(isInstallable || isInstalled) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Install App
            </h2>

            {isInstalled ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    App installed!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    CueGraph is installed and ready to use offline.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Install CueGraph for quick access from your home screen and offline use.
                </p>
                <button
                  onClick={promptInstall}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Install CueGraph
                </button>
              </>
            )}
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

        {/* Advanced Debugging */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Advanced Debugging
            </h2>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4">
              <DebugInfo />
            </div>
          )}
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
    </div>
  );
}
