# CueGraph

> Map how your life's events seem to trigger each other

CueGraph is an open-source, privacy-first Progressive Web App that helps you build a personal graph of life events and their repercussions.

## Features

- **Local-only event logging** – All your data stays on your device in IndexedDB
- **User-tagged causal links** – Explicitly mark "this probably caused that" connections
- **Automatic pattern detection** – Discover correlations in your event timeline
- **Interactive graph visualization** – Explore how events relate through an ego-centric graph view
- **Insights panel** – Get notified of patterns CueGraph discovers in your data
- **Privacy-first** – No servers, no accounts, no tracking of your event contents
- **Optional anonymous usage analytics** – Help improve CueGraph by sharing aggregate, non-identifying usage patterns (PostHog)

## Privacy Stance

CueGraph is designed with privacy as a core principle:

### Your Event Data

- **All event data remains on the device** – Stored locally in your browser's IndexedDB
- **No servers, accounts, or sync** – Your event logs, notes, and timestamps never leave your device
- **Works offline** – After initial load, the app works completely offline

### Optional Analytics

If you choose to enable analytics (and if CueGraph was built with PostHog credentials):

- **Only aggregate, non-identifying usage patterns** are tracked (e.g., "user opened Insights screen", "user logged an event")
- **Never tracked**: event labels, notes, timestamps, or any personally identifying information
- **Fully transparent and user-controllable** – You can opt in or out at any time in Settings

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the development server at `http://localhost:5173`.

### Building

```bash
npm run build
```

This creates a production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Testing

```bash
npm test
```

## Deployment

CueGraph is designed to be deployed as a static site.

### GitHub Pages

1. Update `vite.config.ts` to set the correct `base` path for your repository
2. Build the project: `npm run build`
3. Deploy the `dist/` directory to GitHub Pages

Alternatively, you can use GitHub Actions to automate deployment. See `.github/workflows/deploy.yml` (if present).

### Other Static Hosts

The `dist/` directory can be deployed to any static hosting service (Netlify, Vercel, Cloudflare Pages, etc.).

## Optional: PostHog Analytics

To enable optional anonymous usage analytics:

1. Create a PostHog account (or self-host PostHog)
2. Set the following environment variables when building:
   - `VITE_POSTHOG_API_KEY` – Your PostHog project API key
   - `VITE_POSTHOG_HOST` – Your PostHog instance URL

Example:

```bash
VITE_POSTHOG_API_KEY=your-key VITE_POSTHOG_HOST=https://app.posthog.com npm run build
```

If these variables are not set, the app builds without any analytics code, and all telemetry calls become no-ops.

## Contributing

Contributions are welcome! Here's how you can help:

### Adding New Built-in Event Types

Edit `src/data/eventTypes.json` and add your event type with the following structure:

```json
{
  "id": "unique-slug",
  "label": "Event Name",
  "emoji": "🎉",
  "category": "action",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "isBuiltIn": true
}
```

Categories: `action`, `symptom`, `mood`, `situation`, `other`.

### Proposing Improvements

- Open an issue to discuss new features or report bugs
- Submit a pull request with your changes

## Tech Stack

- **React** – UI framework
- **TypeScript** – Type safety
- **Vite** – Build tool
- **Tailwind CSS** – Styling
- **Dexie** – IndexedDB wrapper
- **React Router** – Routing (HashRouter for GitHub Pages compatibility)
- **PostHog** – Optional analytics
- **Vite PWA Plugin** – Progressive Web App support

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

CueGraph was built to help people understand the ripple effects of their daily choices and experiences, empowering them with personal insights while respecting their privacy.
