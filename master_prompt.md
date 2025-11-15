
# CueGraph – Master Build Prompt (`master_prompt.md`)

You are an expert front-end engineer, product designer, and data scientist.

Your task is to **design and implement CueGraph**: an open-source, client-only, privacy-first Progressive Web App (PWA) that helps users build a personal **graph of life events and their repercussions**.

Core idea:

- Users log events like:
  - “Ate spicy food”
  - “Felt spicy food” (bathroom)
  - “Skin flush”
  - “Got super drunk Friday”
  - “Late to work Saturday”
  - “Felt like Sunday snuck away from me”
- When logging a new event, CueGraph shows **recent past events** so the user can explicitly say:
  > “I bet THIS caused THAT.”
- Over time, CueGraph also analyzes the log and surfaces **likely correlations**:
  > “You often log ‘Felt spicy food’ within 4–36h after ‘Ate spicy food’.”
- The result is a **personal, time-lagged directed graph**:
  - **Nodes** = event types.
  - **Edges** = relationships between them, combining:
    - **User-asserted causal links** (“I think A causes B”).  
    - **System-inferred correlations** (“A is often followed by B”) from local analytics.

All **event data and personal notes** must stay on the user’s device and be stored locally in the browser.

CueGraph **may** optionally send **strictly anonymous, high-level usage analytics** (e.g., screen views, feature usage counts) to a PostHog instance to help improve the product – but never the contents of user events or notes. Analytics must be fully transparent and user-controllable (see “Analytics & Privacy” below).

The repo will be deployed to GitHub Pages (e.g., at `cuegraph.com`).

---

## High-Level Product Vision

CueGraph answers the question:

> “What are the downstream ripples of the things I do?”

Examples:

### Spicy food cluster

- Node: **Ate spicy food**
- Downstream nodes:
  - **Felt spicy food** (bathroom)
  - **Skin flush**
  - **Dandruff flare** a few days later

### Drinking cluster

- Node: **Got super drunk Friday**
- Downstream nodes:
  - **Felt like shit in the morning**
  - **Late to work Saturday**
  - **Felt like Sunday snuck away from me**

Users can:

- **Log events quickly** on their phone.
- When something happens (good or bad), easily connect it to prior events:
  - “I bet that Friday drinking caused this feeling Sunday.”
- Visit a **node view** for any event type and see:
  - What tends to happen **after** it (outgoing edges).
  - What tends to happen **before** it (incoming edges).
  - Edge strengths and typical delays.
- Explore an **ego graph** centered on one event type.
- Optionally view a **global graph** (for more advanced exploration).
- See **suggested links** (inferred correlations) and confirm/reject them.

Tone:

- Playful but not childish.  
- Graph-y without academic jargon.  
- Always clear about *correlation vs causation*.

---

## Tech Stack & Architecture

- **SPA**:
  - React
  - TypeScript
  - Vite

- **Styling**:
  - Tailwind CSS
  - Mobile-first design

- **Routing**:
  - React Router using `HashRouter` (for GitHub Pages compatibility).

- **PWA**:
  - `public/manifest.webmanifest` with:
    - `name`, `short_name`, icons
    - `theme_color`, `background_color`
    - `display: "standalone"`
  - Service worker (via Vite plugin or custom) to cache app shell & static assets for offline use.

- **Data storage** (user data):
  - IndexedDB (via Dexie or a minimal custom wrapper).
  - React context + hooks for an in-memory store synchronized with IndexedDB.

- **Optional usage analytics**:
  - Integrate **PostHog** (or a similar self-hostable analytics tool) **only for anonymous usage analytics**:
    - Screen/page views (e.g., which main tabs are used).
    - Feature usage events (e.g., “event logged”, “cause link added”, “graph opened”).  
    - No event labels, no event notes, no user-written text, and no fine-grained timestamps tied to personal events.
  - Analytics must be:
    - Configurable via **build-time Vite env vars** (e.g., `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST` accessed through `import.meta.env`).
    - Easy to **disable entirely at build time** (if env vars are missing, the telemetry module must behave as a no-op at runtime; no PostHog bundle initialization).
    - Controlled at runtime by a user setting (opt-in or at minimum easily opt-out).

- **Strict constraints** for user event data:
  - No backend storing personal event data.
  - No runtime LLMs or AI APIs.
  - No network calls for **event content** or notes.
  - Event data must remain usable offline after initial load.

Export/import of data is **not required** for v1 and can be omitted.

---

## Analytics & Privacy Policy (App-Level Requirements)

Design the app from the ground up with a clear, ethical separation between:

1. **Personal event data** (private, local-only)  
2. **Anonymous usage analytics** (optional, aggregate, non-identifying)

### 1. Personal event data

- All `EventType`, `EventInstance`, and `EventLink` records are stored locally in IndexedDB.
- Must **never** be sent over the network.
- Event labels, notes, and timestamps are considered **sensitive** and are **not** included in analytics payloads.

### 2. Anonymous usage analytics (PostHog)

Implement analytics in a way that is privacy-preserving and transparent:

- Only track high-level events, such as:
  - App opened.
  - Screen/tab viewed (e.g., `log_view`, `history_view`, `graph_view`, `insights_view`, `settings_view`).
  - Core feature actions without content:
    - `event_logged` (with a generic property like `has_note: boolean`, but **without** the label or note text).
    - `cause_link_added`.
    - `insight_accepted` / `insight_dismissed`.
  - Configuration changes:
    - `settings_updated` (e.g., theme changed, analytics opt-in/out toggled).

- Do **not** send:
  - Event labels or IDs.
  - User notes or tags.
  - Raw timestamps of personal events.
  - Any personally identifying information.

- PostHog configuration:
  - Disable session recording, heatmaps, or any feature that captures raw UI contents by default.
  - Anonymize IP where possible.
  - Do not use fingerprinting.

- User controls:
  - In Settings, provide a clear toggle like **“Share anonymous usage analytics to help improve CueGraph”** with a short explanation.
  - Respect the toggle at runtime:
    - If disabled, do not send any analytics events.
  - Consider defaulting analytics to **off** or making the choice explicit during onboarding (“Help improve CueGraph by sharing anonymous usage stats?”).

- Technical:
  - Wrap the PostHog client in a small module (e.g., `src/lib/telemetry.ts`) with functions like `trackEvent(name, properties)` that automatically no-op when analytics is disabled or when no valid PostHog key/host was provided at build time.
  - Ensure the app can be built without a PostHog key and still run perfectly (telemetry module should fail gracefully).

---

## Data Model

Define core types in `src/lib/types.ts`.

### `EventType` (node type)

Represents a type of event, e.g. “Ate spicy food”, “Headache”.

```ts
export interface EventType {
  id: string;               // UUID or slug
  label: string;            // e.g. "Eat spicy food"
  emoji?: string;           // e.g. "🌶"
  category: "action" | "symptom" | "mood" | "situation" | "other";
  color?: string;           // optional accent color key
  createdAt: string;        // ISO timestamp
  isBuiltIn?: boolean;      // true for seeded event types
}
```

### `EventInstance` (logged event in time)

Represents a concrete occurrence of an event.

```ts
export interface EventInstance {
  id: string;
  eventTypeId: string;
  timestampUTC: string;       // ISO UTC timestamp
  localOffsetMinutes: number; // timezone offset at log time (Date.getTimezoneOffset())
  intensity?: number;         // optional 1–5 rating
  note?: string;              // short free-text note
}
```

### `EventLink` (user-asserted causal link between instances)

Created when the user explicitly marks one event as a likely cause of another.

```ts
export interface EventLink {
  id: string;
  fromEventId: string;   // candidate cause instance
  toEventId: string;     // candidate effect instance
  createdAt: string;     // ISO timestamp
  confidence?: number;   // optional 0–1 confidence slider for future use
}
```

### `TypeEdgeStats` (aggregated edge between event types)

Represents a directed relationship between event types, combining evidence from user links and inferred correlations.

```ts
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
```

### `UserSettings`

```ts
export interface UserSettings {
  onboardingCompleted: boolean;
  pinnedEventTypeIds: string[];    // for home quick-log buttons
  theme: "system" | "light" | "dark";
  questions: string[];             // free-text “what am I curious about?” from onboarding
  graphEdgeThreshold: number;      // default min inferredStrength to show edges (0–1)
  analyticsEnabled: boolean;       // whether anonymous usage analytics is on
}
```

---

## Built-in Event Types

Seed the app with a set of built-in event types in `src/data/eventTypes.json`. Examples:

- Eat spicy food 🌶 – `category: "action"`
- Felt spicy food (bathroom) 🚽 – `"symptom"`
- Skin flush 😳 – `"symptom"`
- Dandruff flare ❄️ – `"symptom"`
- Got drunk 🍻 – `"action"`
- Late to work ⏰ – `"situation"`
- Felt like shit in the morning 🤢 – `"symptom"`
- Felt like Sunday snuck away 😔 – `"mood"`
- Caffeine late ☕ – `"action"`
- Poor sleep 😴 – `"symptom"`
- Hard workout 🏋️ – `"action"`
- Muscle soreness 💢 – `"symptom"`
- High sugar / dessert 🍰 – `"action"`
- Mood dip / brain fog 🌫️ – `"mood"`
- High stress day 😬 – `"situation"`
- New shampoo / product 🧴 – `"action"`
- Itchy scalp 🪳 – `"symptom"`
- Skin breakout ⚡ – `"symptom"`
- Headache 🤯 – `"symptom"`

Mark seeded types with `isBuiltIn: true`.

---

## UX Flows & Screens

Use a bottom tab bar for primary navigation:

- **Log** (Home)
- **Graph** (Node-centric view)
- **Insights** (Suggested correlations)
- **History**
- **Settings**

Design mobile-first layouts with Tailwind.

Where appropriate, instrument **anonymous usage events** via the telemetry module (e.g., `trackEvent("screen_view", { screen: "log" })`) but never include user-written text or event labels.

### 1. Onboarding (static, no AI)

Goals:

- Explain what CueGraph does.
- Let the user state what they’re curious about.
- Let the user choose initial events to pin.
- Let the user make an explicit choice about anonymous analytics (if enabled).

#### Screen 1 – Intro

- Simple copy describing CueGraph:
  - Maps how your life’s events seem to trigger each other.
  - All event data stays on your device; no accounts or servers.

- If analytics are compiled in (PostHog key present), optionally include a short paragraph and toggle:

  > “You can optionally share anonymous usage statistics (like which screens you visit) to help improve CueGraph. We never send the contents of your events or notes.”  
  >
  > [ ] Share anonymous usage statistics

- This choice sets `UserSettings.analyticsEnabled`.

#### Screen 2 – Questions (no LLM)

Prompt text:

> What 1–4 questions are you curious about?  
>  
> Examples:  
> - Does spicy food mess up my stomach or skin?  
> - Does drinking on weeknights ruin my mornings?  
> - Does poor sleep make me extra snappy?  
> - Does some habit kill my weekends?  

Implementation:

- Provide 2–4 text fields: `Question 1`, `Question 2`, etc.
- Store these strings in `UserSettings.questions`.  
- Do **not** send these questions to analytics.

- Underneath, show **static suggestion chips** (no AI):

  - `[Spicy food & bathroom]`
  - `[Spicy food & skin]`
  - `[Drinking & mornings]`
  - `[Sleep & mood]`
  - `[Sugar & crashes]`

- When a chip is tapped:
  - Auto-fill a question field with a predefined sentence.
  - Mark some relevant built-in `EventType`s to highlight on the next screen.
  - Optionally track an anonymous event like `trackEvent("onboarding_question_chip_selected", { chip: "spicy_bathroom" })` – but without user text.

#### Screen 3 – Choose starter events

- Show a grid/list of built-in `EventType`s (emoji + label).
- Let the user select 3–8 to pin as quick-log buttons.
- Save these in `UserSettings.pinnedEventTypeIds`.
- You **may** record an anonymous count of how many event types were pinned (e.g., `trackEvent("onboarding_pinned_events", { count: 5 })`), but do not send specific labels.

At the end, set `onboardingCompleted = true` and navigate to the **Log** screen.

---

### 2. Log Screen (Home)

Top: **Quick Log**

- Display big, thumb-friendly buttons for `pinnedEventTypeIds`:
  - Each shows emoji + label.

On tap:

- Immediately create an `EventInstance` with:
  - `timestampUTC = new Date().toISOString()`
  - `localOffsetMinutes = new Date().getTimezoneOffset()`
- Show a toast/snackbar: “Logged: Eat spicy food 🌶”.
- Optionally track a generic analytics event like:

  ```ts
  trackEvent("event_logged", { has_note: false });
  ```

  Do **not** send the label or ID of the event type.

Optional quick detail flow:

- After logging (or via an edit icon), open a bottom sheet to:
  - Adjust time (now, -15m, -1h, or custom datetime picker).
  - Set intensity (1–5).
  - Add a short note.

**FAB (“+”)**:

- Opens a modal to:
  - Search all `EventType`s by name.
  - Tap to log one immediately.
  - “Create new event type” with:
    - Name
    - Optional emoji
    - Category dropdown
  - After creating a new event type, optionally offer a “Pin to home” toggle.

- You may record generic analytics (e.g., “created_event_type”), but again, **never send the label text**.

#### “What caused this?” panel

Immediately after logging a new event **B**, show an inline panel or a button like **“Add cause”**:

> “What do you think caused ‘Felt spicy food’?”

Implementation details:

- Look back over a configurable time span (e.g. last 72 hours of `EventInstance`s).
- Show recent events as chips sorted reverse chronologically, with relative times:

  - “Ate spicy food (5h ago)”
  - “Got drunk (14h ago)”
  - “High stress day (30h ago)”

- Allow user to select one or more candidate cause events **A**.
- For each selected **A**, create an `EventLink`:

  ```ts
  {
    id,
    fromEventId: A.id,
    toEventId: B.id,
    createdAt: nowISO
  }
  ```

- You may track an anonymous usage event like `trackEvent("cause_link_added", {})` with no additional user-specific properties.

Also allow this “Add cause” flow to be reopened later from the event detail (e.g. via History > tap event).

---

### 3. History Screen

- Chronological list of events grouped by date: Today, Yesterday, etc.
- Each row shows:
  - Local time (derived from `timestampUTC` + `localOffsetMinutes`).
  - Emoji + event type label.
  - Intensity indicator, if present.
  - Note icon if note exists.

Features:

- Filters:
  - By one or more event types (multi-select).
  - By date range: last 24h / 7d / 30d / custom.

- Tapping an event opens a detail view:
  - Edit timestamp, intensity, note.
  - Show **“Believed causes”** (incoming `EventLink`s).
  - Show **“Believed effects”** (outgoing `EventLink`s).
  - Ability to add/remove links by selecting from nearby events in the timeline (similar lookback UI).

You may track high-level screen views (e.g. `trackEvent("screen_view", { screen: "history" })`), but do not send information about specific event IDs or note contents.

---

### 4. Graph Screen (Node-centric / CueGraph view)

Main default mode: **Node detail** for a selected `EventType`.

**Header:**

- Large emoji + label.
- Usage stats: e.g. “Logged 14 times in the last 90 days”.

**Sections:**

#### A. After this (Outgoing edges)

- Compute and display a list of `TypeEdgeStats` where `fromEventTypeId` is the current node.
- For each edge, show:
  - Target event type (emoji + label).
  - A textual summary, for example:

    > “‘Felt spicy food’ happened 9 times.  
    > 7 of those were within 4–36 hours after ‘Ate spicy food’ (~78%).  
    > Median delay: 10 hours.”

  - Simple visual representation of strength (e.g., horizontal bar).

  - Badges indicating evidence sources:
    - “User links: 5” (from `userLinkCount`)
    - “Inferred pattern” (if `edgeSources` includes `"inferred"`).

#### B. Before this (Incoming edges)

- Same as above, but for `TypeEdgeStats` where `toEventTypeId` is the current node.

#### C. Ego Graph Visualization

- A simple graph visualization (SVG-based) with the current event type at the center.
- Surrounding nodes:
  - The strongest incoming and outgoing neighbors (e.g. up to 6–8 neighbors).
- Edges:
  - Directed arrows.
  - Thickness/color reflecting strength (`inferredStrength` and/or `userLinkCount`).
- Interactive behavior:
  - Tapping a neighbor node navigates to that node’s detail view.

You may track aggregate interactions (e.g., `trackEvent("graph_node_viewed", { has_edges: true })`), but again, do not send actual labels or IDs.

#### Global Graph (optional, advanced)

- A button like “View full graph” opens a global graph view:
  - Force-directed layout of all nodes and edges above a certain threshold.
  - Filters:
    - Only show edges with `inferredStrength` above a configured threshold.
    - Only show event types with at least N occurrences.

- Anonymous analytics can track that the global graph was opened (`graph_full_opened`), but not which nodes/edges are visible.

---

### 5. Insights Screen (Suggested correlations)

Goal: **Surface correlations the user hasn’t explicitly linked yet.**

Behavior (all client-side):

- For each pair of event types (A, B) with sufficient occurrences:
  - Consider fixed windows like:
    - [0–12h], [0–24h], [0–48h], [12–72h] after A.
  - For each window, compute:
    - How often B occurs within the window after A.
    - Baseline rate of B outside these windows.
  - Identify candidates where:
    - B’s rate inside the window is significantly higher than outside (e.g. ≥ 1.5×).
    - Sample sizes (counts of A, B, and matched events) exceed minimum thresholds.
    - There isn’t already a strong user-supported edge between A and B.

Rank and show these candidates as **Insight cards**:

Each card might say:

> “‘Felt spicy food’ often follows ‘Ate spicy food’ within 4–36 hours.  
> In your data (last 90 days):  
> - After ‘Ate spicy food’: 7 of 10 spicy logs were followed by ‘Felt spicy food’ in that window.  
> - Outside that window: 4 ‘Felt spicy food’ events out of 40 similar hours.”

Buttons:

- **“View details”** – opens either:
  - A focused pair view, or
  - Navigates to the Graph screen with this edge highlighted.
- **“Mark as pattern”** – promotes this to a stored `TypeEdgeStats` entry with `edgeSources` including `"inferred"`.

Language must be careful:

- Use phrases like “often follows”, “pattern in your log”.
- Avoid “causes”, “makes”, or other strict causal claims.

You may track anonymous events like `trackEvent("insight_viewed", {})` and `trackEvent("insight_marked_pattern", {})` but never include specific event labels or IDs.

---

### 6. Settings Screen

Include:

- **Pinned events**:
  - Manage `pinnedEventTypeIds` with checkboxes/toggles.
  - Reorder pinned items (drag-and-drop if reasonable, otherwise simple up/down controls).

- **Appearance**:
  - Theme selector: system / light / dark.

- **Graph defaults**:
  - Slider or numeric input for `graphEdgeThreshold` (0–1), controlling which edges are shown by default.

- **Analytics**:
  - If analytics are compiled in, show a toggle:

    > “Share anonymous usage analytics to help improve CueGraph”

    - Explain in 2–3 bullet points what is and isn’t sent.
    - Bind to `UserSettings.analyticsEnabled`.
    - When toggled, call a telemetry function to enable/disable analytics at runtime.

- **Data**:
  - “Clear all data from this device” button with a confirmation dialog.

- **Privacy**:
  - Short statement highlighting:
    - All event data is stored locally in IndexedDB.
    - No servers, accounts, or tracking of event contents.
    - Optional anonymous usage analytics (if enabled) for improving UX.

You may track a generic `settings_opened` event.

---

## Analytics Logic (Client-Side Only)

Implement analytics for the **event graph** as pure TypeScript functions in `src/lib/analytics.ts`. These are distinct from the **usage analytics** (PostHog telemetry) and operate on in-memory arrays of `EventInstance`, `EventLink`, and `EventType`.

### 1. Aggregate `EventLink`s into `TypeEdgeStats` (user evidence)

Given:

- `eventTypes: EventType[]`
- `eventInstances: EventInstance[]`
- `eventLinks: EventLink[]`

Steps:

1. Build a lookup map from `EventInstance.id` to `EventInstance`.
2. For each `EventLink`:
   - Resolve `fromEventId` and `toEventId` to instances.
   - Compute `deltaHours` = time difference in hours (`to - from`).
   - Resolve their `eventTypeId`s to get `(fromEventTypeId, toEventTypeId)`.
3. Group by `(fromEventTypeId, toEventTypeId)`:
   - Count `userLinkCount` for each pair.
   - Collect `deltaHours` values to compute:
     - `medianDelayHours`, `p25DelayHours`, `p75DelayHours`.
   - Set a default `[minHours, maxHours]` range based on these delays (e.g. p10–p90 or a padded range).

Initialize `TypeEdgeStats` for each pair with source `"user"`:

- `edgeSources = ["user"]`
- `userLinkCount` from aggregation.
- Basic time window as above.
- `matchedPairs` at least equal to `userLinkCount`.
- Rates can be filled or left for the inference step.

### 2. Inferred correlations for all pairs (without user links)

For each ordered pair of event types `(A, B)` where counts exceed thresholds:

1. Extract `eventsA` and `eventsB` (sorted by time).
2. Consider a small set of candidate windows, e.g.:
   - [0–12h], [0–24h], [0–48h], [12–72h].
3. For each candidate window:
   - For each B event, check if there is an A event in the window before it.
   - Count matches as `matchedPairs`.
   - Compute:
     - `countFrom` (A events in analysis range)
     - `countTo` (B events in analysis range)
   - Estimate time coverage:
     - `totalWindowHours` ≈ (number of A events) × (window length in hours), clipped to the data’s min/max timestamps.
     - `insideCount` = number of B events that fall within windows after A.
     - `outsideCount` = `countTo - insideCount`.
     - `rateInsideWindowPerHour = insideCount / totalWindowHours` (if non-zero).
     - `rateOutsideWindowPerHour = outsideCount / totalOutsideWindowHours` (with `totalOutsideWindowHours` computed as total hours in range minus `totalWindowHours`, clipped to ≥ 0).

4. Compute a simple `inferredStrength`:
   - Example: `inferredStrength = clamp(rateInsideWindowPerHour / (rateOutsideWindowPerHour + epsilon), 0, maxRatio)` and normalize to [0, 1].
   - Optionally incorporate `matchedPairs` into the strength calculation (e.g., stronger when there are more matches).

5. Keep only candidate windows where:
   - `matchedPairs` ≥ a minimum (e.g. 3–5).
   - `rateInsideWindowPerHour` significantly exceeds `rateOutsideWindowPerHour` (e.g. ≥ 1.5×).

6. For each `(A,B)` pair, choose the “best” window based on `inferredStrength` and keep a corresponding `TypeEdgeStats` entry with:
   - `edgeSources` containing `"inferred"` (and `"user"` if merged with existing user-based edges).
   - Stats populated from this analysis.

### 3. Merging user and inferred edges

- If both user-based and inferred edges exist for the same `(fromEventTypeId, toEventTypeId)`:
  - Merge them into a single `TypeEdgeStats`:
    - `edgeSources` = union of sources.
    - Combine `userLinkCount` and `matchedPairs` appropriately.
    - Reconcile windows (e.g. union or averaged bounds).
    - Optionally weight delays and rates by counts.

### 4. Node-centric stats

For a given `EventType` id:

- `outgoingEdges`: all `TypeEdgeStats` where `fromEventTypeId` is this id.
- `incomingEdges`: all `TypeEdgeStats` where `toEventTypeId` is this id.

Sort each set by strength (e.g. `inferredStrength`, then `userLinkCount`, then `matchedPairs`). These feed the Graph screen and ego visualization.

### 5. Testing

Use Vitest (or similar) for unit tests in `src/lib/analytics.test.ts`:

- Test aggregation of `EventLink`s into `TypeEdgeStats` on small synthetic timelines.
- Test inference logic with simple artificially constructed patterns where you know the expected outcome.
- Test baseline vs conditional rates in edge cases (no matches, sparse data, etc.).

---

## State Management & Persistence

Use React context + hooks to manage and expose app-level state:

- `EventType[]`
- `EventInstance[]`
- `EventLink[]`
- `UserSettings`
- Possibly cached `TypeEdgeStats[]`

### IndexedDB Schema

Use a wrapper (Dexie or custom) in `src/lib/db.ts` to define stores:

- `eventTypes`
- `eventInstances`
- `eventLinks`
- `userSettings` (singleton row)
- Optionally `edgeCache` for storing computed `TypeEdgeStats` snapshots (or simply recompute in memory).

Provide hooks such as:

- `useEventTypes()` – returns list + CRUD operations.
- `useEvents()` – returns list + logging/editing functions.
- `useEventLinks()` – returns list + linking operations.
- `useUserSettings()` – returns settings + update functions.

All writes should be persisted to IndexedDB and state updated accordingly.

---

## Telemetry Module (PostHog Integration)

In `src/lib/telemetry.ts` implement a thin wrapper around PostHog:

- The module reads **build-time** Vite env vars (e.g. `import.meta.env.VITE_POSTHOG_API_KEY`, `import.meta.env.VITE_POSTHOG_HOST`). These are injected by Vite at build time and are not runtime secrets.
- If the key/host are missing at build time, the module must behave as a **no-op client** at runtime: calls to `trackEvent` should simply do nothing, and PostHog should never be initialized.

Provide functions like:

```ts
import type { UserSettings } from "./types";

export function initTelemetry(settings: UserSettings): void;
export function trackEvent(name: string, properties?: Record<string, any>): void;
export function setAnalyticsEnabled(enabled: boolean): void;
```

Rules:

- `trackEvent` must:
  - Respect `UserSettings.analyticsEnabled`.
  - No-op when analytics are disabled or when no valid key/host was provided at build time.
  - Strip out any accidental user content (never accept free-form strings from event content as properties).

- `initTelemetry`:
  - Initializes PostHog only if:
    - Valid key and host were provided at build time, **and**
    - `analyticsEnabled` is true.
  - Disables session recording and PII capture by default in PostHog configuration.

- `setAnalyticsEnabled`:
  - Toggles runtime analytics behavior (and may call `posthog.reset()` when disabling).

This design allows you to:

- Build a version with analytics enabled by setting Vite env vars.  
- Build a version with analytics completely disabled (no PostHog init) by omitting those env vars, which is ideal for GitHub Pages or privacy-maximal builds.

---

## Project Structure

Suggested structure (you can refine it, but keep similar separation):

- `index.html`
- `vite.config.ts`
- `package.json`
- `tailwind.config.cjs`
- `postcss.config.cjs`
- `public/manifest.webmanifest`
- `public/icons/*`

- `src/main.tsx`
- `src/App.tsx`
- `src/router.tsx` (or inline routing in `App.tsx`)

- `src/pages/Onboarding.tsx`
- `src/pages/Log.tsx`
- `src/pages/History.tsx`
- `src/pages/Graph.tsx`
- `src/pages/Insights.tsx`
- `src/pages/Settings.tsx`

- `src/components/`:
  - `NavBar.tsx` (bottom nav)
  - `EventButton.tsx`
  - `EventCard.tsx`
  - `Toast.tsx`
  - `Chip.tsx`
  - `Modal.tsx`
  - `BottomSheet.tsx`
  - `GraphEgoView.tsx` (SVG-based ego graph)
  - Other reusable UI components

- `src/lib/types.ts`
- `src/lib/db.ts`
- `src/lib/store.ts`
- `src/lib/analytics.ts`
- `src/lib/telemetry.ts`
- `src/lib/useToasts.ts` (if needed)

- `src/data/eventTypes.json`
- `src/styles/index.css` (Tailwind base imports)

- `src/lib/analytics.test.ts` (Vitest tests)

---

## UI & Styling Principles

- **Mobile-first**:
  - Design for phone screens first.
  - Use bottom navigation for main tabs.
  - Ensure tap targets are finger-friendly.

- **Fast logging**:
  - From app launch to logging an event should be ≤ 2 taps in typical cases.
  - Minimize required input fields.

- **Visual hierarchy**:
  - Clear section headers in Graph and Insights views.
  - Use color/emojis to help scanning without overwhelming.

- **Dark mode**:
  - Respect `prefers-color-scheme` by default.
  - Allow user override (system / light / dark).

- **Feedback**:
  - Use toasts/snackbars when actions succeed (e.g., “Event logged”, “Cause added”).
  - Use simple, friendly error messages if something fails (e.g., IndexedDB issues).

- **Causality disclaimers**:
  - In Graph and Insights screens, always include a short note that these are correlations in the user’s log, not medical or scientific proof of causation.

---

## README

Create a `README.md` with at least:

- Project name: **CueGraph**
- Tagline, e.g.:
  > “CueGraph – map how your life’s events seem to trigger each other.”
- Features summary:
  - Local-only event logging.
  - User-tagged “this probably caused that” links.
  - Automatic pattern detection and graph visualization.
  - Optional anonymous usage analytics to inform product improvements.
- Privacy stance:
  - All event data remains on the device (IndexedDB).
  - No servers, accounts, or sync for event content.
  - Optional analytics (PostHog) track only aggregate, non-identifying usage patterns.
- Getting started:
  - `npm install`
  - `npm run dev`
  - `npm run build`
- Deployment notes:
  - How to deploy static build to GitHub Pages.
- Contributing:
  - How to add new built-in event types (editing `src/data/eventTypes.json`).
  - How to propose improvements (issues/PRs).

---

## (Optional Future) Research Opt-In Mode

The app SHOULD be architected so that, in a future version, a separate **research opt-in** mode can be added without changing the core event model:

- This mode would be **off by default** and require explicit, informed consent.
- It would live under a clearly labeled section like “Participate in research” in Settings.
- Any research data export MUST:
  - Be logically separate from PostHog usage analytics.
  - Be documented and transparent about what fields are included and excluded.
  - Never include direct identifiers (names, emails, IPs).
  - Apply additional aggregation or de-identification if necessary for sensitive content.
- This future mode is **not implemented in v1**, but the architecture (data models, storage, and separation between event analytics and usage telemetry) should not preclude it.

---

## Summary

Implement CueGraph as a static, PWA, mobile-first React/TypeScript app that:

- Lets users log life events quickly.
- Lets them explicitly say “I bet this caused that” by linking recent events.
- Infers additional correlations between event types from local timelines.
- Aggregates all of this into a directed, time-lagged graph of event types.
- Provides node-centric views, ego graphs, and an Insights panel for suggested patterns.
- Stores all event content locally in IndexedDB with a clear “no backend for your data” privacy story.
- Optionally integrates PostHog for **strictly anonymous** usage analytics that users can control, to help the author understand flows and improve the app.

All logic, storage, and event analytics must run in the browser.  
The app should be ready to host at `cuegraph.com` via GitHub Pages.
