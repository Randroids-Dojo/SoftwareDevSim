import { test, expect } from '@playwright/test'

test.describe('Ship release and next sprint', () => {
  test('ship a release after sprint completes, then start next sprint', async ({ page }) => {
    test.setTimeout(60_000)

    // 1. Clear localStorage, start fresh game
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // 2. Select 3 stories
    await expect(page.getByText('Sprint Planning')).toBeVisible({ timeout: 10_000 })
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 5_000 })
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check()
    }

    // 3. Start sprint
    await page.getByRole('button', { name: 'Start with Planning' }).click()
    const phaseBadge = page.locator('span.rounded', {
      hasText: /^(planning|active|review|shipped)$/,
    })
    await expect(phaseBadge).toHaveText('active', { timeout: 5_000 })

    // 4. Assign stories to developers
    await page.getByRole('button', { name: 'Team' }).click()
    await expect(page.locator('h3', { hasText: 'Team' })).toBeVisible({ timeout: 5_000 })
    for (let i = 0; i < 3; i++) {
      const select = page.locator('select').first()
      const isVisible = await select.isVisible({ timeout: 3_000 }).catch(() => false)
      if (isVisible) {
        await select.selectOption({ index: 1 })
        await page.waitForTimeout(500)
      }
    }
    await page.getByRole('button', { name: 'Team' }).click()

    // 5. Fast-forward: directly advance game state to review phase with done stories
    // Using the exposed __game instance to manipulate state
    await page.evaluate(() => {
      const game = (window as unknown as Record<string, unknown>).__game as {
        state: {
          sprint: { phase: string; dayInSprint: number }
          backlog: { id: string; status: string; progress: number; quality: number }[]
          clock: { day: number; hour: number; minute: number }
        }
      }
      if (!game) return

      // Mark all sprint stories as done
      for (const story of game.state.backlog) {
        if (story.status === 'in_progress' || story.status === 'todo') {
          story.status = 'done'
          story.progress = 1
          story.quality = 0.85
        }
      }

      // Advance sprint to review phase
      game.state.sprint.phase = 'review'
      game.state.sprint.dayInSprint = 10
      game.state.clock.day = 11
      game.state.clock.hour = 10
      game.state.clock.minute = 0
    })

    // 6. Wait for React to pick up the state change
    await page.waitForTimeout(1_000)
    await expect(phaseBadge).toHaveText('review', { timeout: 10_000 })

    // 7. Open Ship panel
    await page.getByRole('button', { name: 'Ship' }).click()
    await expect(page.locator('h3', { hasText: 'Ship Release' })).toBeVisible({ timeout: 5_000 })

    // 8. Verify "Ready to ship" shows done stories
    await expect(page.getByText(/Ready to ship:/)).toBeVisible()

    // 9. Click Ship Release button
    const shipReleaseBtn = page.locator('button', { hasText: 'Ship Release' }).last()
    await expect(shipReleaseBtn).toBeVisible()
    await expect(shipReleaseBtn).toBeEnabled({ timeout: 5_000 })
    await shipReleaseBtn.click()

    // 10. Verify shipped result
    await expect(page.getByText(/Shipped! Velocity: \d+ points/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('User Feedback')).toBeVisible()

    // 11. Start next sprint
    await page.getByRole('button', { name: 'Start Next Sprint' }).click()
    await expect(page.getByText('Sprint 2')).toBeVisible({ timeout: 5_000 })
    await expect(phaseBadge).toHaveText('planning', { timeout: 5_000 })
  })
})
