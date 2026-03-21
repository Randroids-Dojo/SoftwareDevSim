---
title: "Visual regression: screenshot capture & comparison"
status: open
priority: 3
issue-type: task
depends-on: SoftwareDevSim-full-loop-gameplay-3792e601
created-at: "2026-03-21T00:00:00.000000-05:00"
---

Add Playwright screenshot capture at key moments: intro screen, sprint planning with stories selected, active sprint with Kanban visible, ship panel with feedback. Use toHaveScreenshot() for visual regression baselines. Store snapshots in tests/e2e/snapshots/. This gives visual feedback on UI changes as game mechanics expand and helps catch rendering regressions in the Three.js canvas and overlay panels.
