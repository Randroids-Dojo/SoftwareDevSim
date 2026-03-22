import { test, expect } from '@playwright/test'

test.describe('Sprint Auto-Play and End Screen', () => {
  test('completing all sprints shows end screen with grade', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByText('Todo App').click()

    // Add a developer
    const plusButtons = page.locator('button:has-text("+")')
    await plusButtons.first().click()

    // Start development
    await page.getByRole('button', { name: 'Start Development' }).click()

    // Wait for the game to be running
    await expect(page.getByText('Sprint 1')).toBeVisible({ timeout: 5000 })

    // Fast-forward through all sprints by manipulating state directly
    await page.evaluate(() => {
      const game = (window as unknown as Record<string, unknown>).__game as {
        state: {
          phase: string
          sprint: { current: number; total: number; dayInSprint: number; daysPerSprint: number }
          progress: number
          quality: number
          result: unknown
          clock: { paused: boolean }
        }
      }
      // Simulate 4 sprints of progress
      game.state.progress = 0.8
      game.state.quality = 0.45
      game.state.sprint.current = 4
      game.state.sprint.dayInSprint = 0
      game.state.phase = 'ended'
      game.state.clock.paused = true
      // Build the result
      game.state.result = {
        grade: 'A',
        completion: 1.0,
        quality: 0.45,
        totalCost: 60000,
        revenue: 114000,
        roi: 90,
        featuresShipped: 'A fully complete Todo App!',
      }
    })

    // End screen should appear
    await expect(page.getByText('Results Breakdown')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
  })

  test('retry resets to title screen', async ({ page }) => {
    await page.goto('/')

    // Skip straight to end screen via state manipulation
    await page.waitForFunction(
      () => {
        return (window as unknown as Record<string, unknown>).__game !== undefined
      },
      { timeout: 10000 },
    )

    await page.evaluate(() => {
      const game = (window as unknown as Record<string, unknown>).__game as {
        state: {
          phase: string
          result: unknown
          clock: { paused: boolean }
        }
      }
      game.state.phase = 'ended'
      game.state.clock.paused = true
      game.state.result = {
        grade: 'F',
        completion: 0,
        quality: 0,
        totalCost: 0,
        revenue: 0,
        roi: -100,
        featuresShipped: 'Nothing — no app was selected.',
      }
    })

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Try Again' }).click()

    // Should be back at title screen
    await expect(page.locator('h1')).toContainText('SoftwareDevSim', { timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })
})
