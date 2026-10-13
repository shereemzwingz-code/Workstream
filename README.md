# Workstream

Mzw's personal command center for Dimension Energy community solar partnerships.
Live page: https://claude.ai/code/artifact/bc9e35af-5864-44bd-9d9b-a3b86a363a28

- `src/` — the page, split by screen (`screens/`), agent (`agents/`), data (`data/`), styles (`styles/`), and page shell (`shell/`).
- `src/manifest.json` — the order parts are joined in.
- `python3 tools/build.py` — builds `dist/index.html`, the one page that publishes to the same artifact URL.
- `python3 tools/check_identical.py` — Phase 1 test: build equals build 113 byte-for-byte.
