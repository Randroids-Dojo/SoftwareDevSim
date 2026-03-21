---
title: "Test: Active sprint simulation & team management"
status: open
priority: 2
issue-type: task
depends-on: SoftwareDevSim-sprint-planning-flow-d2928db9
created-at: "2026-03-21T00:00:00.000000-05:00"
---

During active sprint: set speed to 5x, open Team panel, assign stories to developers via dropdowns. Wait for stories to progress — poll Kanban/Backlog panel for stories moving from Todo → In Progress → Review → Done. Verify HUD updates (sprint day advances, quality %, tech debt %). Open Backlog panel and confirm progress percentages are non-zero. This tests the core simulation loop runs correctly in the browser.
