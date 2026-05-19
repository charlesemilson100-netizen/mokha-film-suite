# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

MOKHA FILM Suite is a self-contained Electron desktop application (Professional AI Film Prompt Builder). It has **no backend server, no database, and no external services required**. The core application lives in a single monolithic HTML file (`public/mokha-suite-pro.html`, ~2.2MB) containing all UI, styles, and JavaScript inline. Electron wraps this file.

### Development Commands

- **Dev mode**: `npm run electron-dev` — starts React dev server on `:3000` + launches Electron window
- **Electron only (production file)**: `ELECTRON_IS_DEV=0 npx electron . --no-sandbox` — loads HTML directly from `public/mokha-suite-pro.html`
- **React dev server only**: `npm run react-start`
- **Tests**: `CI=true npx react-scripts test --watchAll=false --passWithNoTests` — no unit tests exist in `src/` currently
- **Build**: `npm run react-build` skips React build (loads HTML directly); `npm run build-linux` for packaging

### Headless Environment Caveats

- Electron requires a display server. Start Xvfb before running Electron: `Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &` then `export DISPLAY=:99`.
- D-Bus and GPU errors in Electron output are expected and non-fatal in headless environments.
- The `--no-sandbox` flag is needed when running Electron as root or in containers.
- Chrome/Electron windows may not render visually on Xvfb but are functional (confirmed via headless Chrome screenshots and window title verification).

### Standalone Tests

- Tests in `tests/` directory are self-contained: `.test.js` files require `fast-check` (not in package.json); `.test.html` files are browser-based and can be opened directly in Chrome.
- To run JS property tests: `npm install fast-check --no-save && node tests/<test-file>.test.js`

### Architecture Notes

- In dev mode, `public/index.html` fetches `mokha-suite-pro.html` and replaces the entire document HTML. This causes DevTools disconnection warnings (expected behavior).
- The `mokha-suite-pro.html` has a "Secure Context Bootstrap" script that redirects from `file://` to a blob URL for Web Speech API support. This is why dev mode (http) is the preferred workflow.
- No ESLint config exists; linting is handled implicitly by `react-scripts` during compilation.
