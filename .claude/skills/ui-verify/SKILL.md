---
name: ui-verify
description: Checklist for verifying UI changes in the browser (dev server, 375px/desktop, PWA, two-device sync). Use after changing anything under src/screens, src/components or styles.
---

# Verifying UI

1. Start the dev server via preview (`.claude/launch.json`, config `dev`, port 5180 — 5173 is often taken) and open it in the built-in browser.
2. Check at **375 px** (`resize_window` preset `mobile`) and desktop (≥ 1280 px), then restore preset `desktop`.
3. Walk the scenarios from "How to verify" in the current stage (`docs/roadmap/NN-*.md`); enter SPEC §11 reference examples by hand and compare the numbers on screen.
4. Check: no horizontal scroll at 375 px; fields open the numeric keyboard (`inputmode`); comma and dot both work; data survives a reload.
5. Browser console: no errors or React warnings.
6. PWA (Service Worker, offline, update toast) — build only: `pnpm build`, then preview config `preview` (port 4180). Afterwards unregister the Service Worker on `localhost:4180`.
7. Walk screens in both states: **signed out** (clean origin) and signed in — different code branches.
8. Sync and groups — two "devices" in one browser: `localhost` and `second.localhost` (separate origin = own storage and sign-in). Offline: stop the dev server.
