# MotorNote HTTPS / PWA deployment

The `main` branch remains untouched. This branch adds the PWA shell and offline runtime cache.

## GitHub Pages
1. Merge this branch into `main` when ready.
2. In **Settings → Pages**, publish from `main` and the repository root.
3. Open the generated HTTPS URL while online. Allow the service worker to install, then reload once.
4. In Safari on iPhone, use **Share → Add to Home Screen**.

## Offline behavior
- The app shell, manifest, and icon are precached.
- Tailwind Browser, Alpine, JSZip, Google Fonts, and the optional SurrealDB module entrypoints are warmed and cached by the service worker.
- Further same-origin and cross-origin runtime requests are cached on first successful use.
- A dependency that failed to download before going offline will not be available until the app is opened online again.
- SurrealDB remains optional; local IndexedDB is the app's offline persistence layer.
- Browser storage can be cleared or evicted by iOS. Export backups and retain the original manual ZIP separately.
- Service workers require HTTPS or localhost; `file://` is not supported.

## Release updates
Increment the `VERSION` constant in `sw.js` for each release so clients receive a fresh cache.
