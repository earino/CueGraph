# CueGraph Codebase Architecture Overview

## Project Summary

**CueGraph** is a privacy-first Progressive Web App (PWA) that helps users build a personal graph of life events and discover patterns in how those events correlate and trigger each other. All data stays local on the user's device (IndexedDB) with optional anonymous analytics via PostHog.

**Key Characteristics:**
- TypeScript + React 18 with Vite
- Mobile-first responsive design using Tailwind CSS
- HashRouter for GitHub Pages compatibility
- Offline-capable PWA
- Fully client-side architecture

---

## 1. APP STRUCTURE & MAIN COMPONENTS

### Directory Layout
```
src/
├── components/          # Reusable UI components
├── lib/                # Core business logic & utilities
├── pages/              # Page-level components (views)
├── data/               # Static data (built-in event types)
├── styles/             # Global CSS
├── App.tsx             # Root routing component
└── main.tsx            # React entry point
```

### File Organization by Type

**Pages (5 main screens):**
- `/pages/Log.tsx` - Event logging (home screen)
- `/pages/Graph.tsx` - Interactive event graph visualization
- `/pages/Insights.tsx` - Pattern discovery & recommendations
- `/pages/History.tsx` - Event timeline with filtering
- `/pages/Settings.tsx` - User preferences & data management
- `/pages/Onboarding.tsx` - Welcome flow (3-step tutorial)

**Core Libraries:**
- `/lib/store.tsx` - Central state management (React Context + Dexie)
- `/lib/db.ts` - IndexedDB database schema & initialization
- `/lib/types.ts` - TypeScript interfaces
- `/lib/telemetry.ts` - PostHog analytics wrapper
- `/lib/analytics.ts` - Edge inference & correlation detection
- `/lib/useToasts.tsx` - Toast notification system

**Components (13 reusable):**
- `NavBar.tsx` - Bottom navigation bar (5 main routes)
- `Toast.tsx` - Toast notification display
- `Modal.tsx` - Modal dialog wrapper
- `EventCard.tsx` - Event display card with intensity/notes
- `EventButton.tsx` - Quick-log button for event types
- `BottomSheet.tsx` - Slide-up sheet for cause selection
- `Chip.tsx` - Tag/category badge component
- `GraphEgoView.tsx` - Ego-centric graph visualization
- `ConsentBanner.tsx` - Analytics consent banner
- `InstallPrompt.tsx` - PWA install prompt
- `UpdateNotification.tsx` - PWA update notification
- `DebugInfo.tsx` - Debug information panel
- `Modal.tsx` - Reusable modal dialog

---

## 2. HOW LOGGING CURRENTLY WORKS

### Logging Architecture Overview

**Two-Layer Telemetry System:**

1. **PostHog Analytics** (`lib/telemetry.ts`)
   - Only initialized if `VITE_POSTHOG_API_KEY` & `VITE_POSTHOG_HOST` environment variables are set
   - Requires explicit user consent via `ConsentBanner`
   - Opt-in by default, can be toggled in Settings
   - Privacy-preserving configuration:
     - No session recording
     - No surveys
     - No auto-capture or page tracking
     - No IP collection
     - Only localStorage persistence

2. **Event Tracking Points**

Core events being tracked:
```
- app_opened
- event_type_created (with category)
- event_logged (with has_note, has_intensity flags)
- cause_link_added
- settings_updated (with fields list)
- data_cleared
- screen_view (with screen name)
- onboarding_first_event_logged (with event_id)
- onboarding_completed (with question_count, pinned_count)
- consent_accepted/declined
- insight_viewed
- graph_node_viewed
```

### Data Sanitization

The `trackEvent()` function explicitly removes potentially sensitive fields:
- `label` - Event name
- `note` - User notes
- `text` - Text content
- `content` - Any content
- `eventTypeId` - Event type identifiers
- `eventId` - Event identifiers

### Consent Flow

```
App loads → User hasn't given consent → ConsentBanner shows
  ↓
User selects Accept → initTelemetry() called → Events tracked
User selects Decline → analyticsEnabled set to false → No tracking
```

### Log Locations

**Browser Console Debug Output:**
- `console.error()` on database initialization failures
- No structured logging to console in production

**Local Storage:**
- PostHog stores its own distinct_id for analytics in localStorage
- Settings persisted in IndexedDB (not visible in browser console)

---

## 3. USER FLOW

### Complete User Journey

```
1. NEW USER ARRIVES
   ↓
   [Onboarding Screen 1: Welcome Hero]
   - Welcome banner with gradient
   - App value proposition
   - Privacy assurance
   → User clicks "Get started"
   ↓
   
2. [Onboarding Screen 2: First Event]
   - 8 starter events presented
   - User selects one (or creates custom)
   - Event logged immediately
   - Celebration animation (confetti)
   → Move to Screen 3
   ↓
   
3. [Onboarding Screen 3: How It Works]
   - Explain the 3-step loop:
     1. Log events as they happen
     2. Connect the dots (cause-effect)
     3. Discover patterns
   - Pro tip about logging more events
   → User clicks "Start tracking"
   ↓
   
4. [USER COMPLETES ONBOARDING]
   - onboardingCompleted = true
   - Redirected to /log
   ↓
   
5. [LOG PAGE - Home Screen]
   - Quick-log buttons for pinned event types
   - Create new event type button
   - After logging an event:
     → "What caused this?" BottomSheet appears
     → User can select past events (last 72h) as causes
     → Or dismiss to continue
   ↓
   
6. [NAVIGATION]
   User explores via NavBar (5 tabs):
   
   a) LOG (📝) - Quick event logging
      ↓
   b) GRAPH (🕸️) - Explore event relationships
      - Select event type
      - View incoming edges (what causes it)
      - View outgoing edges (what it causes)
      - Interactive ego-centric graph visualization
      ↓
   c) INSIGHTS (💡) - Discover patterns
      - Auto-generated correlation insights
      - Based on inferred edges (low user evidence)
      - Click to view in graph
      ↓
   d) HISTORY (📅) - Timeline view
      - Filter by event type
      - Filter by time range (24h, 7d, 30d, all)
      - Group by date (Today, Yesterday, specific date)
      - View event details
      - Delete individual events
      ↓
   e) SETTINGS (⚙️) - Preferences
      - Pinned events management
      - Theme (system/light/dark)
      - Graph edge threshold slider
      - Analytics toggle
      - Advanced section (collapsible)
      - Clear all data button
      ↓
   
7. [SETTINGS FLOW]
   - View/manage pinned events
   - Change theme preference
   - Adjust graph sensitivity
   - Enable/disable analytics
   - Access debug info
   - Clear all data (with confirmation)
   ↓
   
8. [GRAPH VIEW DETAILS]
   - Select event type from dropdown
   - View stats: total count, last 90 days
   - Incoming edges: what typically precedes this event
   - Outgoing edges: what typically follows
   - Each edge shows:
     * Time window (hours)
     * Probability/correlation strength
     * Number of user-marked links
     * Median delay
   - Click nodes to navigate to other events
```

### Key User Actions

| Action | Screen | Effect |
|--------|--------|--------|
| Quick-log event | Log | Creates instance, shows cause sheet |
| Create event type | Log | Opens modal, creates type, logs first instance |
| Create link | History/Log | Marks cause-effect relationship |
| Filter history | History | Shows subset of events |
| View graph | Graph | Shows inferred correlations |
| Toggle analytics | Settings | Controls PostHog tracking |
| Pin event | Settings | Adds quick-log button to home |
| Clear data | Settings | Resets app to initial state |

---

## 4. EXISTING ONBOARDING/TUTORIAL FEATURES

### Onboarding Page (`/pages/Onboarding.tsx`)

**3-Step Guided Experience:**

**Step 1: Welcome Hero**
- Animated gradient background with moving blobs
- Main value proposition: "Discover what triggers what in your life"
- Two feature highlights:
  - "Log life events in seconds"
  - "Discover surprising patterns"
- Privacy callout: "All your data stays on your device"
- "Get started" button

**Step 2: Log First Event**
- Prompts: "Let's log your first event"
- 8 pre-selected starter events:
  - 🌶 Ate spicy food (action)
  - ☕ Had coffee (action)
  - 😊 Felt great (mood)
  - 🤕 Had a headache (symptom)
  - 💪 Worked out (action)
  - 😰 Felt stressed (mood)
  - 😴 Slept poorly (symptom)
  - 🍺 Had a drink (action)
- Staggered entrance animations
- Celebration confetti on selection
- Custom event creation fallback

**Step 3: How It Works**
- 3 numbered steps with icons:
  1. Log events as they happen
  2. Connect the dots (cause-effect)
  3. Discover surprising patterns
- Pro tip: "The more you log, the better patterns you'll discover!"
- "Start tracking" button to complete

### Onboarding State

- Tracked via `settings.onboardingCompleted` boolean
- If false: all routes redirect to `/onboarding`
- No skip option (must complete to use app)
- Tracked events:
  - `onboarding_first_event_logged`
  - `onboarding_completed`

### Post-Onboarding Guides

- ConsentBanner appears after onboarding with analytics info
- Settings page has expandable "Advanced" section
- Debug info accessible in Settings (when available)

---

## 5. DATA MODEL & STORAGE STRUCTURE

### Data Schema (IndexedDB)

**Database: `CueGraphDB`**

#### Table 1: `eventTypes`
```typescript
interface EventType {
  id: string;               // UUID or slug
  label: string;            // e.g., "Eat spicy food"
  emoji?: string;           // e.g., "🌶"
  category: "action" | "symptom" | "mood" | "situation" | "other";
  color?: string;           // optional accent color key
  createdAt: string;        // ISO timestamp
  isBuiltIn?: boolean;      // true for seeded types
}

Indices: id, label, category, isBuiltIn
```

#### Table 2: `eventInstances`
```typescript
interface EventInstance {
  id: string;
  eventTypeId: string;
  timestampUTC: string;       // ISO UTC timestamp
  localOffsetMinutes: number; // timezone offset at log time
  intensity?: number;         // optional 1–5 rating
  note?: string;              // optional free-text note
}

Indices: id, eventTypeId, timestampUTC
```

#### Table 3: `eventLinks`
```typescript
interface EventLink {
  id: string;
  fromEventId: string;   // candidate cause instance ID
  toEventId: string;     // candidate effect instance ID
  createdAt: string;     // ISO timestamp
  confidence?: number;   // optional 0–1 for future use
}

Indices: id, fromEventId, toEventId, createdAt
```

#### Table 4: `userSettings`
```typescript
interface UserSettings {
  id: number;                    // Always 1 (singleton)
  onboardingCompleted: boolean;  // Gates access to main app
  pinnedEventTypeIds: string[];  // Quick-log buttons on home
  theme: "system" | "light" | "dark";
  questions: string[];           // Deprecated/unused (for future)
  graphEdgeThreshold: number;    // 0–1 min strength to show edges
  analyticsEnabled: boolean;     // PostHog tracking
  consentGiven?: boolean;        // undefined=not asked, true=yes, false=no
}

Indices: id
```

### Storage Access Pattern

**Live Queries via Dexie React Hooks:**
```typescript
const eventTypes = useLiveQuery(() => db.eventTypes.toArray(), []) || [];
const eventInstances = useLiveQuery(() => db.eventInstances.toArray(), []) || [];
const eventLinks = useLiveQuery(() => db.eventLinks.toArray(), []) || [];
const settingsRow = useLiveQuery(() => db.userSettings.get(1), []);
```

All tables are reactive—UI updates immediately when data changes.

### Built-in Event Types

19 pre-seeded event types in `src/data/eventTypes.json`:
- **Actions (6):** eat spicy food, caffeine late, got drunk, hard workout, high sugar, new shampoo
- **Symptoms (7):** headache, poor sleep, dandruff flare, skin flush, itchy scalp, muscle soreness, skin breakout
- **Moods (2):** felt great, high stress day, mood dip/brain fog, felt like Sunday snuck away
- **Situations (2):** late to work
- Plus utility pairs (e.g., eat spicy → feel spicy bathroom)

### Data Relationships

```
EventType ──── (many) ──── EventInstance
                                ↓
                            EventLink
                                ↓
                           EventLink
                              /   \
                    from_instance  to_instance
```

Analysis of edges (correlations) is computed on-the-fly from instances and links.

---

## 6. ROUTING & NAVIGATION STRUCTURE

### Router Setup

**Type:** HashRouter (for GitHub Pages compatibility)
**Base Path:** `/` (configured in vite.config.ts)

### Route Map

```
/onboarding
  └─ Onboarding (3-screen flow)

/ (redirects to /log)

Main App Routes (if onboardingCompleted):
├─ /log           → Log (event logging, home)
├─ /graph         → Graph (interactive visualization)
├─ /insights      → Insights (pattern discovery)
├─ /history       → History (timeline view)
├─ /settings      → Settings (preferences)
└─ /* (wildcard)  → Redirects to /log

Onboarding Routes (if !onboardingCompleted):
├─ /onboarding    → Onboarding (allowed)
└─ /* (wildcard)  → Redirects to /onboarding
```

### Navigation Components

**NavBar** (`components/NavBar.tsx`)
- Fixed at bottom (mobile-safe area aware)
- 5 icon-based tabs:
  - 📝 Log `/log`
  - 🕸️ Graph `/graph`
  - 💡 Insights `/insights`
  - 📅 History `/history`
  - ⚙️ Settings `/settings`
- Active tab highlighted in primary color
- Click tracking: `trackEvent('screen_view', { screen })`

### Conditional Rendering Logic

```
App.tsx
  ├─ CueGraphProvider (state)
  │  └─ ToastProvider (notifications)
  │     └─ AppRoutes
  │        ├─ If !onboardingCompleted:
  │        │  ├─ Route(/onboarding) → Onboarding
  │        │  ├─ Route(*) → Redirect to /onboarding
  │        │  └─ ConsentBanner
  │        │
  │        └─ If onboardingCompleted:
  │           ├─ Route(/log) → Log
  │           ├─ Route(/graph) → Graph
  │           ├─ Route(/insights) → Insights
  │           ├─ Route(/history) → History
  │           ├─ Route(/settings) → Settings
  │           ├─ Route(*) → Redirect to /log
  │           ├─ NavBar
  │           ├─ ToastContainer
  │           └─ ConsentBanner
  │
  ├─ UpdateNotification (PWA)
  └─ InstallPrompt (PWA)
```

### URL Query Parameters

Some pages support query params (e.g., Insights):
- `/graph?from=eventTypeId&to=eventTypeId` - View specific edge
- (Currently not fully implemented for deep linking)

---

## KEY LIBRARIES & DEPENDENCIES

| Package | Version | Purpose |
|---------|---------|---------|
| **react** | 18.3.1 | UI framework |
| **react-dom** | 18.3.1 | React rendering |
| **react-router-dom** | 6.26.1 | Client-side routing |
| **dexie** | 4.0.8 | IndexedDB abstraction |
| **dexie-react-hooks** | 1.1.7 | Dexie + React integration |
| **framer-motion** | 12.23.24 | Animations |
| **lucide-react** | 0.553.0 | Icon library |
| **tailwindcss** | 3.4.10 | CSS styling |
| **posthog-js** | 1.165.0 | Analytics (optional) |
| **uuid** | 10.0.0 | Unique ID generation |
| **vite-plugin-pwa** | 0.20.5 | PWA support |

---

## ANALYTICS & CORRELATION ENGINE

### Analytics System (`lib/analytics.ts`)

**3-Step Edge Computation:**

1. **aggregateUserLinks()** - User-marked edges
   - Groups EventLinks by (fromTypeId → toTypeId)
   - Computes time window based on p10-p90 percentiles
   - Creates TypeEdgeStats with userLinkCount > 0

2. **inferCorrelations()** - Auto-detected patterns
   - Tests 5 candidate time windows: 0-12h, 0-24h, 0-48h, 12-72h, 24-168h
   - For each (from, to) pair: counts coincidences
   - Computes rate ratio: (hits in window) / (hits outside window)
   - Filters by thresholds (min 3 matches, min 1.5x rate ratio)
   - Assigns inferredStrength 0–1 score
   - Returns inferred edges with edgeSources=['inferred']

3. **mergeEdges()** - Combine both signals
   - Prioritizes user evidence for time windows
   - Keeps inferred rates if not present
   - Allows single edge to have both sources

### Edge Stats Structure

```typescript
interface TypeEdgeStats {
  fromEventTypeId: string;
  toEventTypeId: string;
  
  // Time window
  minHours: number;
  maxHours: number;
  
  // Counts
  countFrom: number;          // instances of from type
  countTo: number;            // instances of to type
  matchedPairs: number;       // times to followed from
  
  // Delays
  medianDelayHours?: number;
  p25DelayHours?: number;
  p75DelayHours?: number;
  
  // Rates
  rateInsideWindowPerHour?: number;
  rateOutsideWindowPerHour?: number;
  totalWindowHours?: number;
  totalOutsideWindowHours?: number;
  
  // Evidence
  userLinkCount: number;      // manual links
  inferredStrength: number;   // 0–1 correlation score
  edgeSources: ['user'] | ['inferred'] | ['user', 'inferred'];
}
```

### Filtering & Usage

- **Graph view:** Shows edges above `settings.graphEdgeThreshold` (default 0.3)
- **Insights view:** Shows inferred-only edges with strength > threshold
- **Sorting:** By inferredStrength desc, then userLinkCount, then matchedPairs

---

## STYLING & THEME

### Tailwind Configuration

- **Color scheme:** Purple (primary), with light/dark modes
- **Dark mode:** CSS class-based (`dark` on `<html>`)
- **Safe areas:** PWA safe-zone padding for notches/bottom nav

### CSS Variables (Custom Properties)

```css
:root {
  --color-primary: 147 51 234;        /* Purple */
  --color-background: 255 255 255;    /* White */
  --color-text: 17 24 39;             /* Dark gray */
  --color-border: 229 231 235;        /* Light gray */
}

.dark {
  --color-primary: 168 85 247;        /* Light purple */
  --color-background: 17 24 39;       /* Dark gray */
  --color-text: 243 244 246;          /* Light gray */
  --color-border: 55 65 81;           /* Medium gray */
}
```

### Key Utility Classes

- `.safe-bottom` - Padding for home indicator (mobile)
- `.safe-top` - Padding for notch (mobile)
- `.gradient-purple-pink` - Gradient overlay
- `.gradient-border` - Animated border effect

---

## PWA FEATURES

### Service Worker & Manifest

**Config:** `vite.config.ts` via `vite-plugin-pwa`
- **Register type:** Prompt (user chooses to install)
- **Workbox:** Caches JS, CSS, HTML, images, SVG
- **Offline:** Works after initial load
- **Icons:** 192x192 and 512x512 PNG
- **Theme color:** #6366f1 (purple)

### PWA UI Components

- **InstallPrompt** (`components/InstallPrompt.tsx`) - "Add to home screen"
- **UpdateNotification** (`components/UpdateNotification.tsx`) - "New version available"

---

## STATE MANAGEMENT

### CueGraphProvider (Context-based)

**Single source of truth:** CueGraphContext containing:
- All event types, instances, links
- User settings
- Computed edges
- CRUD operations for all entities

**Data Flow:**
```
App State (via Dexie)
  ↓
useLiveQuery() hooks
  ↓
CueGraphProvider (Context)
  ↓
Components via useCueGraph()
  ↓
(Changes auto-sync to IndexedDB)
```

---

## KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `/src/main.tsx` | React entry point |
| `/src/App.tsx` | Root router & theme management |
| `/src/lib/store.tsx` | State management (CueGraphProvider) |
| `/src/lib/db.ts` | IndexedDB schema & initialization |
| `/src/lib/types.ts` | TypeScript interfaces |
| `/src/lib/telemetry.ts` | PostHog analytics wrapper |
| `/src/lib/analytics.ts` | Edge inference algorithm |
| `/src/lib/useToasts.tsx` | Toast notification system |
| `/src/pages/Log.tsx` | Home screen (event logging) |
| `/src/pages/Graph.tsx` | Graph visualization |
| `/src/pages/History.tsx` | Event timeline |
| `/src/pages/Insights.tsx` | Pattern insights |
| `/src/pages/Settings.tsx` | User preferences |
| `/src/pages/Onboarding.tsx` | Welcome flow (3 steps) |
| `/src/components/NavBar.tsx` | Bottom navigation |
| `/src/components/ConsentBanner.tsx` | Analytics consent |
| `/src/data/eventTypes.json` | Built-in event types (19) |
| `/vite.config.ts` | Build config + PWA setup |
| `/tailwind.config.cjs` | Tailwind theme |

---

## INITIALIZATION FLOW

1. **App Start**
   - ReactDOM renders App
   - App renders CueGraphProvider

2. **CueGraphProvider Initialization**
   - `useEffect` → `initializeSettings()`
   - Creates singleton UserSettings record with defaults
   - `initializeBuiltInEventTypes()` loads 19 pre-seeded types
   - Sets `isInitialized = true`

3. **AppRoutes Rendering**
   - If `settings` is null: shows "Loading..."
   - If `!onboardingCompleted`: routes to Onboarding
   - Else: renders main app with NavBar, routes, etc.

4. **Consent Banner**
   - Shows only if `consentGiven === undefined`
   - User must accept/decline before using app fully

5. **Telemetry**
   - Only initializes if:
     - PostHog env vars set at build time
     - User has given consent (`consentGiven === true`)
     - Settings has `analyticsEnabled === true`

---

## SUMMARY TABLE

| Aspect | Implementation |
|--------|-----------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Routing** | react-router-dom (HashRouter) |
| **State** | React Context + useLiveQuery |
| **Database** | IndexedDB via Dexie |
| **Styling** | Tailwind CSS (mobile-first) |
| **Animations** | Framer Motion |
| **Analytics** | PostHog (optional, with consent) |
| **PWA** | vite-plugin-pwa (offline capable) |
| **Data Model** | 4 tables: Types, Instances, Links, Settings |
| **Main Pages** | 5 (Log, Graph, Insights, History, Settings) + Onboarding |
| **Key Algorithm** | Multi-window correlation inference |
| **Privacy** | All data local, no user content in telemetry |

