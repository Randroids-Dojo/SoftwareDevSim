import { test, expect } from '@playwright/test'

test.describe('Panel toggling and collapse buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Start the game
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // Wait for Sprint panel to auto-open (new game behavior)
    await expect(page.locator('h3', { hasText: 'Sprint Planning' })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Sprint panel is auto-opened on new game', async ({ page }) => {
    await expect(page.locator('h3', { hasText: 'Sprint Planning' })).toBeVisible()
  })

  test('clicking a different tab closes current panel and opens new one', async ({ page }) => {
    // Sprint panel is open; click Team tab
    await page.getByRole('button', { name: 'Team' }).click()

    // Sprint panel should close
    await expect(page.locator('h3', { hasText: 'Sprint Planning' })).not.toBeVisible()

    // Team panel should open
    await expect(page.locator('h3', { hasText: 'Team' })).toBeVisible()
  })

  test('clicking the same tab again closes it', async ({ page }) => {
    // Switch to Team panel first
    await page.getByRole('button', { name: 'Team' }).click()
    await expect(page.locator('h3', { hasText: 'Team' })).toBeVisible()

    // Click Team again to close it
    await page.getByRole('button', { name: 'Team' }).click()
    await expect(page.locator('h3', { hasText: 'Team' })).not.toBeVisible()
  })

  test('Backlog panel opens and collapses via collapse button', async ({ page }) => {
    // Open Backlog panel
    await page.getByRole('button', { name: 'Backlog' }).click()
    await expect(page.locator('h3', { hasText: 'Backlog' })).toBeVisible()

    // Collapse via the ▾ button
    await page.getByRole('button', { name: 'Collapse' }).click()
    await expect(page.locator('h3', { hasText: 'Backlog' })).not.toBeVisible()
  })

  test('Practices panel opens and collapses via collapse button', async ({ page }) => {
    // Open Practices panel
    await page.getByRole('button', { name: 'Practices' }).click()
    await expect(page.locator('h3', { hasText: 'Engineering Practices' })).toBeVisible()

    // Collapse via the ▾ button
    await page.getByRole('button', { name: 'Collapse' }).click()
    await expect(page.locator('h3', { hasText: 'Engineering Practices' })).not.toBeVisible()
  })

  test('Ship button is disabled during planning phase', async ({ page }) => {
    const shipButton = page.getByRole('button', { name: 'Ship' })
    await expect(shipButton).toBeVisible()

    // Ship button should be disabled during planning phase
    await expect(shipButton).toHaveClass(/opacity-40/)
    await expect(shipButton).toHaveClass(/cursor-not-allowed/)
  })
})
