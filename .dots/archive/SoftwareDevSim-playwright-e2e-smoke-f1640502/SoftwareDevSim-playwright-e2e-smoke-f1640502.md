---
title: Playwright E2E smoke tests
status: closed
priority: 1
issue-type: task
created-at: "\"2026-03-20T22:01:19.901447-05:00\""
closed-at: "2026-03-20T22:41:53.730608-05:00"
close-reason: All 10 child tasks complete. 18 Playwright tests covering full game flow, all passing in ~30s.
---

Add Playwright-based smoke tests that actually play the game and test all features: intro→start→sprint planning→team assignment→game progression→shipping→next sprint. Replace the trivial health-check-only smoke test with real browser-based E2E coverage. Includes CI workflow (e2e.yml) and headed mode for local visual debugging.
