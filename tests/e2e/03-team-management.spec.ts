import { test, expect } from '@playwright/test'

test.describe('Team management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so no saved game state is loaded
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Click "Start Game"
    const startButton = page.getByRole('button', { name: 'Start Game' })
    await expect(startButton).toBeVisible({ timeout: 15_000 })
    await startButton.click()

    // Wait for Sprint panel to auto-open
    await expect(page.getByText('Sprint Planning')).toBeVisible({ timeout: 10_000 })

    // Check first story checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    await firstCheckbox.check()

    // Click "Start with Planning" to start the sprint
    const startPlanningButton = page.getByRole('button', { name: 'Start with Planning' })
    await expect(startPlanningButton).toBeVisible()
    await startPlanningButton.click()

    // Close sprint panel if still open
    const sprintCloseBtn = page.locator('button[aria-label="Collapse"]').first()
    if (await sprintCloseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sprintCloseBtn.click()
    }
  })

  test('opens Team panel and shows heading', async ({ page }) => {
    // Click the Team button in MenuBar
    const teamButton = page.getByRole('button', { name: 'Team' })
    await expect(teamButton).toBeVisible({ timeout: 5_000 })
    await teamButton.click()

    // Verify the "Team" heading is visible
    const heading = page.locator('h3', { hasText: 'Team' })
    await expect(heading).toBeVisible({ timeout: 5_000 })
  })

  test('shows 3 developer cards with traits', async ({ page }) => {
    const teamButton = page.getByRole('button', { name: 'Team' })
    await teamButton.click()

    // Wait for the Team panel heading
    await expect(page.locator('h3', { hasText: 'Team' })).toBeVisible({ timeout: 5_000 })

    // Each developer card shows a trait (architect, craftsman, or hustler)
    const traits = page.getByText(/^(architect|craftsman|hustler)$/i)
    await expect(traits).toHaveCount(3, { timeout: 5_000 })
  })

  test('assign and unassign a story to a developer', async ({ page }) => {
    const teamButton = page.getByRole('button', { name: 'Team' })
    await teamButton.click()

    await expect(page.locator('h3', { hasText: 'Team' })).toBeVisible({ timeout: 5_000 })

    // Find the first assignment dropdown (select with "-- Assign story --" placeholder)
    const assignSelect = page.locator('select').first()
    await expect(assignSelect).toBeVisible({ timeout: 5_000 })

    // Select the first non-placeholder option (index 1, since index 0 is the placeholder)
    await assignSelect.selectOption({ index: 1 })

    // After assignment, an "Unassign" button should appear
    const unassignButton = page.getByRole('button', { name: 'Unassign' })
    await expect(unassignButton).toBeVisible({ timeout: 5_000 })

    // Click Unassign
    await unassignButton.click()

    // The select dropdown should reappear for that developer
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 })
  })
})
