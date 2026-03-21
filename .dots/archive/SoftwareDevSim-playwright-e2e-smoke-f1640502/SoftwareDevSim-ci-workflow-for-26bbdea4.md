---
title: CI workflow for Playwright (e2e.yml)
status: closed
priority: 1
issue-type: task
created-at: "\"2026-03-20T22:01:39.870517-05:00\""
closed-at: "2026-03-20T22:41:53.725738-05:00"
close-reason: "Created .github/workflows/e2e.yml: runs Playwright chromium tests on PR/push to main with artifact upload"
---

Create .github/workflows/e2e.yml: runs on PR and push to main, ubuntu-latest, install Playwright browsers, build app, run tests headless, upload Playwright report artifact on failure. Use chromium only for speed.
