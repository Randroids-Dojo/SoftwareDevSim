import { test, expect } from '@playwright/test'

test.describe('Intro screen and game start', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so no saved game state is loaded
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('shows intro screen elements', async ({ page }) => {
    // Wait for loading to finish and intro to appear
    const heading = page.locator('h1', { hasText: 'SoftwareDevSim' })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Intro paragraph
    await expect(page.getByText("You're the tech lead")).toBeVisible()

    // "The tension" box
    await expect(page.getByText('The tension')).toBeVisible()

    // Start Game button
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible()

    // Tip at the bottom
    await expect(page.getByText('Tip: Open the Sprint panel')).toBeVisible()
  })

  test('clicking Start Game transitions to playing state', async ({ page }) => {
    // Wait for intro screen
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })

    // Click Start Game
    await startButton.click()

    // Canvas element appears (Three.js scene)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })

    // HUD appears at top with sprint info
    await expect(page.getByText('Sprint 1', { exact: true })).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/Day \d+\/10/)).toBeVisible()

    // MenuBar buttons at bottom
    for (const label of ['Sprint', 'Team', 'Backlog', 'Practices', 'Ship']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }

    // Sprint panel auto-opens for new games
    await expect(page.getByText('Sprint Planning')).toBeVisible({ timeout: 5_000 })
  })

  test('HUD prevents text selection for mobile touch', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // Wait for HUD to appear
    await expect(page.getByText('Sprint 1', { exact: true })).toBeVisible({ timeout: 5_000 })

    // The HUD container should have select-none to prevent accidental text selection on mobile
    const hud = page.locator('.select-none').filter({ hasText: 'Sprint 1' })
    await expect(hud).toBeVisible()
  })
})
