import { isPostHogConfigured, isAnalyticsEnabled } from '../lib/telemetry';

export function DebugInfo() {
  const configured = isPostHogConfigured();
  const enabled = isAnalyticsEnabled();

  // Check if env vars are present at build time
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  return (
    <div className="fixed bottom-20 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">PostHog Debug</h3>
      <div className="space-y-1">
        <p>Configured: {configured ? '✅' : '❌'}</p>
        <p>Enabled: {enabled ? '✅' : '❌'}</p>
        <p>API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : '❌ Not set'}</p>
        <p>Host: {host || '❌ Not set'}</p>
      </div>
    </div>
  );
}
