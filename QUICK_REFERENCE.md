# CueGraph Quick Reference

## Project at a Glance

**What it does:** A privacy-first app that lets users log life events and discover patterns in how those events correlate and trigger each other.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB (Dexie)

**Key Features:**
- Event logging with intensity/notes
- User-marked causal links
- Automatic correlation detection
- Interactive graph visualization
- Offline-capable PWA
- Optional anonymous analytics

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                     │
├──────────────┬──────────────┬──────────────┬─────┬──────┤
│   Log Page   │ Graph Page   │ Insights     │Hist│Setting
│  (home)      │(visualization)│(patterns)    │ory  │ s
└──────────────┴──────────────┴──────────────┴─────┴──────┘
         ↓                              ↓
┌─────────────────────────────────────────────────────────┐
│                Navigation & Layout                       │
│  NavBar (bottom) + Onboarding + Routes + ConsentBanner  │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│              State Management (React Context)            │
│   CueGraphProvider + useLiveQuery (Dexie React Hooks)   │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│                  Core Libraries                          │
├─────────────────┬───────────────┬──────────────┬────────┤
│  Analytics      │  Telemetry    │  Database    │ Types  │
│ (inferrence,    │  (PostHog)    │  (Dexie)     │(TypeSc)│
│  correlations)  │               │              │        │
└─────────────────┴───────────────┴──────────────┴────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│           Local Storage (IndexedDB - Dexie)             │
├──────────────┬────────────────┬──────────┬───────────────┤
│ eventTypes   │ eventInstances │eventLinks│ userSettings  │
│ (19 built-in)│   (logs)       │ (links)  │ (preferences) │
└──────────────┴────────────────┴──────────┴───────────────┘
```

---

## Core Data Model

```
EventType (what happened)
├── id: UUID or slug
├── label: "Ate spicy food"
├── emoji: "🌶"
├── category: action|symptom|mood|situation|other
└── isBuiltIn: boolean

    ↓ (one-to-many)

EventInstance (when it happened)
├── id: UUID
├── eventTypeId: FK
├── timestampUTC: ISO string
├── localOffsetMinutes: timezone
├── intensity?: 1-5 rating
└── note?: text

    ↓ (many-to-many via)

EventLink (user says "this caused that")
├── id: UUID
├── fromEventId: FK to EventInstance
├── toEventId: FK to EventInstance
└── confidence?: 0-1 (future use)

UserSettings (singleton)
├── onboardingCompleted: boolean (gates app access)
├── pinnedEventTypeIds: string[]
├── theme: system|light|dark
├── graphEdgeThreshold: 0-1 (default 0.3)
├── analyticsEnabled: boolean
└── consentGiven?: boolean (undefined|true|false)
```

---

## Page-by-Page Breakdown

| Page | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| **Onboarding** | `/onboarding` | 3-step welcome flow | Welcome hero, first event, how it works |
| **Log** | `/log` | Event logging (home) | Quick-log buttons, create event type, cause linking |
| **Graph** | `/graph` | Visualization | Ego-centric view, incoming/outgoing edges |
| **Insights** | `/insights` | Pattern discovery | Inferred correlations, strength scores |
| **History** | `/history` | Timeline | Filter by type/date, delete events |
| **Settings** | `/settings` | Preferences | Theme, analytics, pinned events, clear data |

---

## Key Algorithms

### Edge Computation (3 steps)

**1. aggregateUserLinks()** → User-Marked Edges
- Groups EventLinks by (fromType → toType)
- Computes time window from p10-p90 percentiles
- Output: TypeEdgeStats with userLinkCount > 0

**2. inferCorrelations()** → Auto-Detected Patterns
- Tests 5 candidate time windows
- Counts coincidences (how often toType follows fromType)
- Computes rate ratio: P(toType in window | fromType) / P(toType outside)
- Filters: min 3 matches, min 1.5x rate ratio
- Assigns inferredStrength (0-1 score)
- Output: TypeEdgeStats with edgeSources=['inferred']

**3. mergeEdges()** → Combined Signal
- Merges user + inferred evidence
- Keeps user-provided time windows when available
- Allows edges to have both sources

### Result: TypeEdgeStats
```
{
  fromEventTypeId, toEventTypeId,
  minHours, maxHours,           // time window
  countFrom, countTo,            // occurrence counts
  matchedPairs, medianDelayHours, // correlation stats
  rateInsideWindowPerHour,        // probability metrics
  userLinkCount, inferredStrength,// evidence
  edgeSources                     // ['user'] | ['inferred'] | both
}
```

---

## Logging & Analytics System

### PostHog Integration

**Initialization Path:**
```
App starts
  → ConsentBanner shown (if consentGiven === undefined)
  → User accepts/declines consent
  → If accepted AND analyticsEnabled:
    → initTelemetry() called
    → PostHog initialized (only if env vars set at build time)
```

**Tracked Events:**
- `app_opened` - App loaded
- `event_type_created` - New event type created
- `event_logged` - Event logged (with has_note, has_intensity)
- `cause_link_added` - User marked cause relationship
- `screen_view` - Page viewed (screen name)
- `settings_updated` - Preference changed
- `onboarding_completed` - User finished tutorial
- `consent_accepted/declined` - Privacy decision
- `graph_node_viewed` - Graph visualization interaction
- `insight_viewed` - Insight explored
- `data_cleared` - All data deleted

**Data Sanitization:**
Labels, notes, eventTypeIds, and timestamps are NEVER sent to PostHog.

---

## User Flow Summary

```
NEW USER
  ↓
Onboarding (mandatory)
  ├─ Welcome hero
  ├─ Log first event (8 starters or custom)
  └─ How it works (3-step loop)
  ↓
Home Screen (Log page)
  ├─ Quick-log buttons (pinned events)
  ├─ Create new event type
  └─ After logging → "What caused this?" sheet
  ↓
Navigation (NavBar bottom)
  ├─ 📝 Log
  ├─ 🕸️ Graph (ego-centric visualization)
  ├─ 💡 Insights (inferred patterns)
  ├─ 📅 History (timeline with filters)
  └─ ⚙️ Settings (preferences)
  ↓
Settings allows:
  ├─ Pin/unpin event types
  ├─ Choose theme
  ├─ Adjust graph sensitivity
  ├─ Toggle analytics
  └─ Clear all data
```

---

## State Management Pattern

**Provider:** CueGraphProvider (React Context)

**Data Source:** IndexedDB (Dexie ORM)

**Reactivity:** useLiveQuery hooks auto-subscribe to changes

**CRUD Operations in Context:**
- Event Types: createEventType, updateEventType, deleteEventType
- Event Instances: logEvent, updateEvent, deleteEvent
- Event Links: createLink, deleteLink
- Settings: updateUserSettings

**Usage in Components:**
```typescript
const { eventTypes, settings, logEvent, createLink } = useCueGraph();
```

---

## Key Files Checklist

### Pages (6)
- `/pages/Log.tsx` - Home/event logging
- `/pages/Graph.tsx` - Visualization
- `/pages/History.tsx` - Timeline
- `/pages/Insights.tsx` - Pattern discovery
- `/pages/Settings.tsx` - Preferences
- `/pages/Onboarding.tsx` - Welcome flow

### Libraries (6)
- `/lib/store.tsx` - State management
- `/lib/db.ts` - Database schema
- `/lib/types.ts` - TypeScript interfaces
- `/lib/telemetry.ts` - PostHog wrapper
- `/lib/analytics.ts` - Correlation engine
- `/lib/useToasts.tsx` - Toast notifications

### Components (13)
- NavBar, Toast, Modal, EventCard, EventButton
- BottomSheet, Chip, GraphEgoView
- ConsentBanner, InstallPrompt, UpdateNotification
- DebugInfo

### Static Data (1)
- `/data/eventTypes.json` - 19 pre-seeded event types

---

## Build & Deployment

**Build Tool:** Vite
**Framework:** React 18 + TypeScript
**Styling:** Tailwind CSS + CSS variables
**PWA:** vite-plugin-pwa (offline support)
**Routing:** HashRouter (GitHub Pages compatible)

**Environment Variables (Optional):**
- `VITE_POSTHOG_API_KEY` - For analytics
- `VITE_POSTHOG_HOST` - PostHog instance URL

**Build Command:**
```bash
npm run build
# Output: dist/ (static files)
```

**Deployment:**
- Can deploy `dist/` to any static host
- GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.
- Works offline after initial load

---

## Key Design Decisions

1. **Privacy First:** All data local (IndexedDB), never synced to servers
2. **Correlation Algorithm:** Tests 5 time windows, uses rate ratios (Bayesian-ish)
3. **Onboarding:** Mandatory 3-step flow before app access
4. **Analytics:** Opt-in with explicit consent, no user content tracked
5. **PWA:** Offline-capable with install prompts
6. **Routing:** HashRouter for GitHub Pages (not history API)
7. **Dark Mode:** System preference + manual override
8. **State:** React Context (not Redux) for simplicity
9. **DB:** Dexie (IndexedDB wrapper) for type safety

---

## Performance Considerations

- **useLiveQuery:** Automatic re-renders on DB changes (reactive)
- **memoization:** useMemo in page components for expensive calculations
- **Edge filtering:** GraphEdgeThreshold setting lets users control detail level
- **Data seeding:** 19 built-in types loaded once at init
- **Offline:** Service Worker caches static assets

---

## Future Expansion Points

1. **Data Export:** CSV/JSON export of events and links
2. **Multi-device Sync:** Cloud-based optional sync
3. **Advanced Analytics:** Confidence intervals, statistical tests
4. **Custom Themes:** User-defined colors
5. **Browser Notifications:** Reminders to log events
6. **Integration:** Calendar, health apps, etc.
7. **ML Models:** Predictive event forecasting
8. **Sharing:** Read-only shares of graphs

---

## Useful Imports Reference

```typescript
// State & data
import { useCueGraph } from '../lib/store';
import { db } from '../lib/db';

// Analytics
import { trackEvent } from '../lib/telemetry';

// Algorithms
import { computeAllEdges, getOutgoingEdges, getIncomingEdges, getSuggestedInsights } from '../lib/analytics';

// UI utilities
import { useToasts } from '../lib/useToasts';

// Routing
import { useLocation, useNavigate } from 'react-router-dom';
```

