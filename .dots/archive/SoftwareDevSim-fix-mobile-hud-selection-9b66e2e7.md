---
title: Fix mobile HUD text selection and update panel collapse tests
status: closed
priority: 1
issue-type: bug
created-at: "2026-03-22T00:00:00.000000-05:00"
closed-at: "2026-03-22T00:00:00.000000-05:00"
close-reason: "Added select-none to HUD for mobile touch, fixed prettier formatting in MenuBar, updated E2E tests for Close→Collapse rename from PR #10, updated GDD.md."
---

Mobile users accidentally selected HUD text while panning the camera. Added `select-none` to the HUD container. Also fixed MenuBar prettier formatting and updated E2E panel toggling tests to match the Close→Collapse button rename from PR #10.
