---
title: "Test: Full gameplay loop (plan → ship → plan again)"
status: open
priority: 2
issue-type: task
depends-on: SoftwareDevSim-ship-release-feedback-ef739550
created-at: "2026-03-21T00:00:00.000000-05:00"
---

Compose all prior tests into a single end-to-end "play the game" spec that runs the full loop: start game → plan sprint → toggle practices → assign devs → wait for progress at 5x speed → ship release → read feedback → start sprint 2. Assert codebase quality and tech debt change between sprints based on practices enabled. This is the primary regression test that validates the game is playable and mechanics are working as designed.
