import { useCueGraph } from '../lib/store';
import { updateSettings } from '../lib/db';
import { initTelemetry, setAnalyticsEnabled, trackEvent } from '../lib/telemetry';

export function ConsentBanner() {
  const { settings } = useCueGraph();

  // Only show if consent hasn't been given/declined yet
  if (!settings || settings.consentGiven !== undefined) {
    return null;
  }

  const handleAccept = async () => {
    const updatedSettings = { ...settings, consentGiven: true, analyticsEnabled: true };
    await updateSettings({ consentGiven: true, analyticsEnabled: true });
    // Initialize and track immediately after consent
    initTelemetry(updatedSettings);
    trackEvent('consent_accepted');
  };

  const handleDecline = async () => {
    await updateSettings({ consentGiven: false, analyticsEnabled: false });
    setAnalyticsEnabled(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Help us improve CueGraph
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We'd like to collect <strong>anonymous usage analytics</strong> to understand how people use CueGraph and make it better.
              We <strong>never</strong> collect your event data, notes, or any personal information.
            </p>
            <details className="mt-2">
              <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                What we collect
              </summary>
              <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-4 list-disc">
                <li>Which screens you visit</li>
                <li>Feature usage (e.g., "event logged", "link added")</li>
                <li>Configuration changes</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <strong>We never collect:</strong> Event labels, notes, timestamps, or any personally identifying information.
              </p>
            </details>
          </div>
          <div className="flex gap-3 md:flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
