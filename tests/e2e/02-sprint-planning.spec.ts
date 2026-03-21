import { test, expect } from '@playwright/test'

test.describe('Sprint planning flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so no saved game state is loaded
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Wait for intro screen and click Start Game
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // Wait for Sprint panel to auto-open
    await expect(page.getByText('Sprint Planning')).toBeVisible({ timeout: 10_000 })
  })

  test('shows sprint planning panel with stories and controls', async ({ page }) => {
    // Verify heading
    const heading = page.locator('h3', { hasText: 'Sprint Planning' })
    await expect(heading).toBeVisible()

    // Verify sprint label text
    await expect(page.getByText('Select stories for Sprint 1')).toBeVisible()

    // Verify at least one story checkbox is present
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 5_000 })
    const count = await checkboxes.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Each story row should show points text
    const pointsLabels = page.getByText(/\d+pts/)
    await expect(pointsLabels.first()).toBeVisible()

    // Verify both action buttons exist
    await expect(page.getByRole('button', { name: 'Start with Planning' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start (Skip Planning)' })).toBeVisible()
  })

  test('selecting stories and starting sprint with planning', async ({ page }) => {
    // Check the first story checkbox
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 5_000 })
    await checkboxes.first().check()

    // Verify "Start with Planning" button is not disabled
    const startWithPlanningBtn = page.getByRole('button', { name: 'Start with Planning' })
    await expect(startWithPlanningBtn).toBeVisible()
    await expect(startWithPlanningBtn).not.toBeDisabled()

    // Click "Start with Planning"
    await startWithPlanningBtn.click()

    // Sprint Planning heading should no longer be visible (panel closed)
    await expect(page.locator('h3', { hasText: 'Sprint Planning' })).not.toBeVisible({
      timeout: 5_000,
    })

    // Kanban overlay appears with "Sprint Board" heading
    await expect(page.getByText('Sprint Board')).toBeVisible({ timeout: 5_000 })

    // Kanban has 4 columns
    for (const column of ['Todo', 'WIP', 'Review', 'Done']) {
      await expect(page.getByText(column)).toBeVisible()
    }

    // HUD phase badge shows "active"
    const phaseBadge = page.locator('span.rounded', {
      hasText: /^(planning|active|review|shipped)$/,
    })
    await expect(phaseBadge).toHaveText('active', { timeout: 5_000 })
  })
})
