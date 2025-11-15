export interface EventType {
  id: string;               // UUID or slug
  label: string;            // e.g. "Eat spicy food"
  emoji?: string;           // e.g. "🌶"
  category: "action" | "symptom" | "mood" | "situation" | "other";
  color?: string;           // optional accent color key
  createdAt: string;        // ISO timestamp
  isBuiltIn?: boolean;      // true for seeded event types
}

export interface EventInstance {
  id: string;
  eventTypeId: string;
  timestampUTC: string;       // ISO UTC timestamp
  localOffsetMinutes: number; // timezone offset at log time (Date.getTimezoneOffset())
  intensity?: number;         // optional 1–5 rating
  note?: string;              // short free-text note
}

export interface EventLink {
  id: string;
  fromEventId: string;   // candidate cause instance
  toEventId: string;     // candidate effect instance
  createdAt: string;     // ISO timestamp
  confidence?: number;   // optional 0–1 confidence slider for future use
}

export type EdgeSource = "user" | "inferred";

export interface TypeEdgeStats {
  fromEventTypeId: string;
  toEventTypeId: string;

  // Main time window for this edge (v1: single window per edge)
  minHours: number;
  maxHours: number;

  // Counts & basic stats
  countFrom: number;           // how often "from" occurred (within analysis range)
  countTo: number;             // how often "to" occurred
  matchedPairs: number;        // how many times "to" followed "from" within the window

  // Delay stats (based on matched pairs)
  medianDelayHours?: number;
  p25DelayHours?: number;
  p75DelayHours?: number;

  // Rates (for baseline vs conditional comparison)
  rateInsideWindowPerHour?: number;
  rateOutsideWindowPerHour?: number;
  totalWindowHours?: number;
  totalOutsideWindowHours?: number;

  // Evidence tracking
  userLinkCount: number;       // how many EventLinks support this edge
  inferredStrength: number;    // 0–1 correlation-like score from analytics
  edgeSources: EdgeSource[];   // e.g. ["user"] or ["user", "inferred"]
}

export interface UserSettings {
  onboardingCompleted: boolean;
  pinnedEventTypeIds: string[];    // for home quick-log buttons
  theme: "system" | "light" | "dark";
  questions: string[];             // free-text "what am I curious about?" from onboarding
  graphEdgeThreshold: number;      // default min inferredStrength to show edges (0–1)
  analyticsEnabled: boolean;       // whether anonymous usage analytics is on
}
