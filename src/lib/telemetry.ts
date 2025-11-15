import posthog from 'posthog-js';
import type { UserSettings } from './types';

// Build-time env vars (injected by Vite)
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

// Runtime state
let isInitialized = false;
let isEnabled = false;

// Check if PostHog is available at build time
const isPostHogAvailable = Boolean(POSTHOG_API_KEY && POSTHOG_HOST);

/**
 * Initialize telemetry based on user settings
 * Only initializes if PostHog credentials were provided at build time AND user has enabled analytics
 */
export function initTelemetry(settings: UserSettings): void {
  if (!isPostHogAvailable) {
    // No PostHog credentials at build time - no-op
    return;
  }

  if (!settings.analyticsEnabled) {
    // User has disabled analytics
    isEnabled = false;
    return;
  }

  if (!isInitialized) {
    posthog.init(POSTHOG_API_KEY!, {
      api_host: POSTHOG_HOST,
      // Privacy-preserving settings
      disable_session_recording: true,
      disable_surveys: true,
      autocapture: false, // Disable automatic event capture
      capture_pageview: false, // We'll manually track screens
      capture_pageleave: false,
      ip: false, // Don't capture IP
      // Respect Do Not Track
      respect_dnt: true,
      // Disable persistence of user properties
      disable_persistence: false, // We need some persistence for distinct_id
      persistence: 'localStorage',
    });

    isInitialized = true;
  }

  isEnabled = true;
}

/**
 * Track an anonymous usage event
 * @param name - Event name (e.g., "screen_view", "event_logged")
 * @param properties - Optional properties (must NOT contain user content)
 */
export function trackEvent(name: string, properties?: Record<string, any>): void {
  if (!isPostHogAvailable || !isEnabled || !isInitialized) {
    // No-op if PostHog not available, disabled, or not initialized
    return;
  }

  // Strip any potentially sensitive fields to be extra safe
  const sanitizedProperties = properties ? { ...properties } : {};

  // Remove any fields that might contain user content
  delete sanitizedProperties.label;
  delete sanitizedProperties.note;
  delete sanitizedProperties.text;
  delete sanitizedProperties.content;
  delete sanitizedProperties.eventTypeId;
  delete sanitizedProperties.eventId;

  posthog.capture(name, sanitizedProperties);
}

/**
 * Enable or disable analytics at runtime
 * @param enabled - Whether to enable analytics
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (!isPostHogAvailable) {
    // No-op if PostHog not available at build time
    return;
  }

  isEnabled = enabled;

  if (!enabled && isInitialized) {
    // User disabled analytics - reset PostHog to clear any stored data
    posthog.reset();
  }
}

/**
 * Check if analytics is currently enabled
 */
export function isAnalyticsEnabled(): boolean {
  return isPostHogAvailable && isEnabled;
}

/**
 * Check if PostHog was configured at build time
 */
export function isPostHogConfigured(): boolean {
  return isPostHogAvailable;
}
