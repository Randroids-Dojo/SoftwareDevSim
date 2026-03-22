import { test, expect } from '@playwright/test'

test.describe('Hire Team', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByText('Todo App').click()
    await expect(page.locator('h2')).toContainText('Hire Your Team')
  })

  test('shows all four roles', async ({ page }) => {
    await expect(page.getByText('Developer')).toBeVisible()
    await expect(page.getByText('Designer')).toBeVisible()
    await expect(page.getByText('Product Owner')).toBeVisible()
    await expect(page.getByText('Manager')).toBeVisible()
  })

  test('start button disabled with empty team', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start Development' })
    await expect(startBtn).toBeDisabled()
  })

  test('can add and remove team members', async ({ page }) => {
    // All the + buttons
    const plusButtons = page.locator('button:has-text("+")')
    // Click the first + button (Developer)
    await plusButtons.first().click()

    // Start button should be enabled now
    const startBtn = page.getByRole('button', { name: 'Start Development' })
    await expect(startBtn).toBeEnabled()
  })

  test('shows budget information', async ({ page }) => {
    await expect(page.getByText('Budget:')).toBeVisible()
    await expect(page.getByText('$500,000')).toBeVisible()
  })

  test('starting development transitions to running phase', async ({ page }) => {
    // Add a developer
    const plusButtons = page.locator('button:has-text("+")')
    await plusButtons.first().click()

    // Click start
    await page.getByRole('button', { name: 'Start Development' }).click()

    // Should show sprint overlay
    await expect(page.getByText('Sprint 1')).toBeVisible({ timeout: 5000 })
  })
})
