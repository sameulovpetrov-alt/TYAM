# TYAM Web Launcher

A React, Vite, and Tailwind application with a Russian-language launcher for TYAM.

## Development

- `npm install`
- `npm run dev`
- `npx tsc --noEmit`
- `npm run build`

## Browser Tests

Install the test browser with `npx playwright install --with-deps chromium`, then run `npx playwright test`.
The test configuration starts a local Vite server if one is not already running.

The tests cover launching, returning to the launcher without losing the current session, persisted startup preferences, release checks, fullscreen behavior, mobile layout, profile editing, and diagnostic export.

## Implementation

- `src/components/Launcher.tsx`: launcher navigation, home, release notes, preferences, dialogs, and release checks.
- `src/components/launcher.css`: responsive launcher styling and reduced-motion support.
- `src/launcher.ts`: launcher preferences, version, and release content.
- `src/App.tsx`: launcher, startup splash, and TYAM workspace lifecycle.
- `public/tyam-release.json`: version manifest served by the same deployment.

## Avatar Editor

`src/components/AvatarEditor.tsx` provides a shared editor for personal avatars and server icons. It is available in the launcher profile, profile settings, profile cards, server creation, and server settings.

The editor supports dragging, arrow-key positioning, 100-400% zoom, 90-degree rotation, reset, replacement, and live previews. Applying a crop exports an actual 512x512 PNG. The original image and normalized crop are retained separately in the current session, so reopening the editor does not crop an already cropped result. Canceling leaves the previous image unchanged; server settings additionally require saving the outer form.

Image processing is local to the browser. JPEG, PNG, WebP, and GIF files up to 8 MB are accepted. Cropping a GIF exports a static PNG. `tests/avatar-editor.spec.ts` covers the crop geometry, profile and server flows, validation, canceling, re-editing, and mobile layout.

## Scope

This is a web launcher, not a native executable or an OS-level updater. Fullscreen requires browser permission. The version check fetches the deployment's release manifest; it does not contact an external update service.

Startup preferences persist in local storage. Returning to the launcher preserves the mounted TYAM session, while reloading the page resets the existing in-memory chat and server data. Microphone and video capture stop when returning from a voice room. Diagnostic export contains launcher configuration and browser capability information, not private messages.