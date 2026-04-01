import { test, expect } from '@playwright/test'

test.describe('Sprint Crisis Modal', () => {
  test('crisis modal appears and player can choose an option', async ({ page }) => {
    await page.goto('/')

    // Wait for game to initialize
    await page.waitForFunction(
      () => (window as unknown as Record<string, unknown>).__game !== undefined,
      { timeout: 10000 },
    )

    // Skip to running phase with a team
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByText('Todo App').click()

    // Hire 2 developers
    const plusButtons = page.locator('button:has-text("+")')
    await plusButtons.first().click()
    await plusButtons.first().click()

    await page.getByRole('button', { name: 'Start Development' }).click()
    await expect(page.getByText('Sprint 1')).toBeVisible({ timeout: 5000 })

    // Inject a pending crisis via state manipulation
    await page.evaluate(() => {
      const game = (window as unknown as Record<string, unknown>).__game as {
        state: {
          pendingCrisis: unknown
          clock: { paused: boolean }
          progress: number
        }
      }
      game.state.pendingCrisis = {
        id: 'tech_debt',
        title: 'Technical Debt Pileup',
        narrative: 'Your codebase is getting messy. Tests are failing, bugs are creeping in.',
        choices: [
          {
            id: 'refactor',
            label: 'Refactor',
            description: 'Slow down and clean up (+10% quality, −5% progress)',
          },
          {
            id: 'push',
            label: 'Push Through',
            description: 'Ship now, fix later (−8% quality)',
          },
        ],
        triggeredAtSprint: 1,
      }
      game.state.clock.paused = true
    })

    // Crisis modal should appear
    await expect(page.getByText('Technical Debt Pileup')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Your codebase is getting messy')).toBeVisible()

    // Both choice buttons should be visible
    await expect(page.getByText('Refactor')).toBeVisible()
    await expect(page.getByText('Push Through')).toBeVisible()

    // Click first choice
    await page.getByText('Refactor').click()

    // Crisis modal should disappear
    await expect(page.getByText('Technical Debt Pileup')).not.toBeVisible({ timeout: 5000 })
  })

  test('crisis outcome toast appears after resolving a crisis', async ({ page }) => {
    await page.goto('/')

    await page.waitForFunction(
      () => (window as unknown as Record<string, unknown>).__game !== undefined,
      { timeout: 10000 },
    )

    // Skip to running phase
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByText('Todo App').click()
    const plusButtons = page.locator('button:has-text("+")')
    await plusButtons.first().click()
    await plusButtons.first().click()
    await page.getByRole('button', { name: 'Start Development' }).click()
    await expect(page.getByText('Sprint 1')).toBeVisible({ timeout: 5000 })

    // Inject a crisis outcome directly
    await page.evaluate(() => {
      const game = (window as unknown as Record<string, unknown>).__game as {
        state: { crisisOutcome: string | null }
      }
      game.state.crisisOutcome = 'The team refactored — cleaner code, slightly less progress.'
    })

    // Outcome toast should appear
    await expect(page.getByText('The team refactored')).toBeVisible({ timeout: 5000 })
  })
})
