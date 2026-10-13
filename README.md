# Workstream

Mzw's personal command center for Dimension Energy community solar partnerships.
Live page: https://claude.ai/code/artifact/bc9e35af-5864-44bd-9d9b-a3b86a363a28

- `src/` — the page, split by screen (`screens/`), agent (`agents/`), data (`data/`), styles (`styles/`), and page shell (`shell/`).
- `src/manifest.json` — the order parts are joined in.
- `python3 tools/build.py` — builds `dist/index.html`, the one page that publishes to the same artifact URL.
- `python3 tools/prepublish.py <live-version>` — run before every publish: blocks a stale publish, runs `tests/`, builds, checks the script parses.
- `src/data/synced-settings.js` — every `ws.*` setting syncs to `data/users/<uid>/settings`; device-only: theme, collapsed sections, image cache, web-search session.
