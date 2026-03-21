---
title: "Playwright setup & config"
status: open
priority: 1
issue-type: task
created-at: "2026-03-21T00:00:00.000000-05:00"
---

Install Playwright, create playwright.config.ts. Configure headless (CI) and headed (dev) modes. Set up webServer config to build+start Next.js on port 3000. Add npm scripts: test:e2e (headless), test:e2e:ui (headed with Playwright UI). Update smoke.yml CI workflow to run Playwright.
