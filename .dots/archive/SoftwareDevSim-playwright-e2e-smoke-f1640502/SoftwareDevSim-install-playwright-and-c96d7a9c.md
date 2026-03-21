---
title: Install Playwright and create config
status: closed
priority: 1
issue-type: task
created-at: "\"\\\"2026-03-20T22:01:39.851721-05:00\\\"\""
closed-at: "2026-03-20T22:41:53.700437-05:00"
close-reason: "Installed @playwright/test, created playwright.config.ts (chromium, webServer), added test:e2e and test:e2e:headed scripts"
---

npm init playwright, configure playwright.config.ts with: baseURL localhost:3000, chromium only, webServer that runs npm run build && npm start, headed mode flag via CLI, screenshot on failure. Add test:e2e and test:e2e:headed scripts to package.json.
