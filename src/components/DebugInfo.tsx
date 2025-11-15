import { isPostHogConfigured, isAnalyticsEnabled } from '../lib/telemetry';

export function DebugInfo() {
  const configured = isPostHogConfigured();
  const enabled = isAnalyticsEnabled();

  // Check if env vars are present at build time
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 p-4 rounded-lg mb-6">
      <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">🐛 PostHog Debug Info</h3>
      <div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
        <p><strong>Configured:</strong> {configured ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Enabled:</strong> {enabled ? '✅ Yes' : '❌ No'}</p>
        <p><strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 10)}...` : '❌ Not set'}</p>
        <p><strong>Host:</strong> {host || '❌ Not set'}</p>
      </div>
    </div>
  );
}
