# Deploy "Keneth" — Plan

Take the uploaded Keneth-main project, get it running in this environment, and publish it to a live, shareable URL.
The goal is a working deployment, not new features.

## Who it's for
The owner of the Keneth project who wants the existing app live on the web at a public link, without changing what the app does.

## What happens to the app
- The uploaded project is unpacked and brought into this environment as the running codebase.
- The app is wired to this platform's conventions so it can run and be served reliably (frontend served on the web, backend reachable under the app's `/api`, database connected).
- Whatever the app already does stays the same. No redesign, no new screens, no new features unless a change is strictly required to make it run here.
- Once it runs and passes a basic health check in preview, it is published to a live URL.

## Core work
- **Unpack & assess**: open the zip, map the project structure, and identify the stack (frontend framework, backend framework, database) and any build steps.
- **Make it run here**: align the app with the platform's run model — correct ports, the backend reachable under `/api`, environment-based configuration instead of hardcoded URLs/keys, and the database connected through the provided connection.
- **Supply secrets**: any API keys, credentials, or third-party service settings the app needs are set as environment secrets. These must be provided by the owner; the app cannot run without them.
- **Verify in preview**: confirm the app loads, the main flows work, and the frontend talks to the backend successfully before going live.
- **Publish**: run the deployment and return the live URL.

## Expected flow
1. Project is unpacked and reviewed.
2. App is adapted to run in this environment (config, ports, routing, database).
3. Required secrets are collected and applied.
4. App is started and checked in preview.
5. App is deployed; a live URL is returned.

## Look & feel
Unchanged. The app keeps its current design, layout, and behavior. This is a lift-and-ship effort, not a visual change.

## Phases

### Phase 1 (done now) — Get it running and deploy
- Unpack the uploaded project and identify the stack.
- Adapt it to run in this environment (config, ports, `/api` routing, database connection) with the minimum changes needed.
- Collect and apply any required secrets.
- Verify the app works in preview.
- Deploy to a live URL.

### Phase 2 (later) — Hardening
- Fix any non-blocking issues found after launch, improve error handling, and tidy configuration.

### Phase 3 (later) — Enhancements
- Any new features, design changes, or integrations requested after the app is live.

## Assumptions
- "Deploy this" means: migrate the uploaded Keneth project into this environment, get it running, and publish it — not build something new.
- If the project's stack differs from this platform's default (React frontend, FastAPI/Python backend, MongoDB database), it will be **adapted** to run here, including migrating a different database (e.g. PostgreSQL/MySQL) to MongoDB if needed. Behavior is preserved; the running stack may change.
- The app's existing functionality is kept as-is; only changes strictly required to run and deploy are made.
- The app is assumed to be substantially complete. If parts are broken or unfinished and block it from running, those are fixed only to the extent needed to launch; larger gaps are flagged, not silently rebuilt.
- Any required API keys, credentials, or third-party service settings will be provided by the owner when asked. Without them, affected features (and possibly the whole app) cannot go live.
- The app deploys to this platform's hosting and returns a live URL on its domain. Custom domains and third-party hosts are out of scope for this phase.
- The zip is large (~100MB); bundled build artifacts, media, or `node_modules`-type folders inside it are ignored in favor of a clean install here.
