import { test, expect } from '@playwright/test'

test.describe('Speed controls and time progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Start the game
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // Wait for Sprint panel to appear
    await expect(page.getByText('Sprint Planning')).toBeVisible({
      timeout: 10_000,
    })

    // Check first story checkbox to enable starting the sprint
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.check()

    // Start the sprint with planning
    const startSprintButton = page.getByRole('button', {
      name: 'Start with Planning',
    })
    await expect(startSprintButton).toBeVisible()
    await startSprintButton.click()
  })

  test('pause button toggles between PAUSE and PAUSED', async ({ page }) => {
    // Game starts unpaused, so button should show "PAUSE"
    const pauseButton = page.getByRole('button', { name: 'PAUSE' })
    await expect(pauseButton).toBeVisible({ timeout: 5_000 })

    // Click to pause — text changes to "PAUSED"
    await pauseButton.click()
    await expect(page.getByRole('button', { name: 'PAUSED' })).toBeVisible()

    // Click again to unpause — text changes back to "PAUSE"
    await page.getByRole('button', { name: 'PAUSED' }).click()
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()
  })

  test('speed buttons activate on click and deactivate others', async ({ page }) => {
    // Click "5x" speed button
    const speed5x = page.getByRole('button', { name: '5x' })
    await expect(speed5x).toBeVisible({ timeout: 5_000 })
    await speed5x.click()

    // Verify 5x has active styling (bg-blue-600)
    await expect(speed5x).toHaveClass(/bg-blue-600/)

    // Click "2x" speed button
    const speed2x = page.getByRole('button', { name: '2x' })
    await speed2x.click()

    // Verify 2x now has active styling and 5x does not
    await expect(speed2x).toHaveClass(/bg-blue-600/)
    await expect(speed5x).not.toHaveClass(/bg-blue-600/)
  })

  test('time advances in the HUD at 5x speed', async ({ page }) => {
    // Verify HUD shows Sprint 1 and Day info
    await expect(page.getByText('Sprint 1')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/Day \d+\/10/)).toBeVisible()

    // Capture the initial time text from the HUD (HH:MM format)
    const timeLocator = page.locator('text=/\\d{2}:\\d{2}/')
    await expect(timeLocator.first()).toBeVisible()
    const initialTime = await timeLocator.first().textContent()

    // Set speed to 5x so time advances quickly
    const speed5x = page.getByRole('button', { name: '5x' })
    await speed5x.click()
    await expect(speed5x).toHaveClass(/bg-blue-600/)

    // Wait a few seconds for game time to advance
    await page.waitForTimeout(3_000)

    // Verify time has changed
    const updatedTime = await timeLocator.first().textContent()
    expect(updatedTime).not.toBe(initialTime)
  })
})
