import { test, expect } from '@playwright/test'

test.describe('Practices panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.getByText('Sprint').first().waitFor({ state: 'visible' })
    // Close sprint panel by clicking the Sprint button in the MenuBar
    await page.getByRole('button', { name: 'Sprint' }).click()
  })

  test('displays all practices and persists checkbox state', async ({ page }) => {
    // Open Practices panel
    await page.getByRole('button', { name: 'Practices' }).click()

    // 1. Verify heading
    await expect(
      page.getByRole('heading', { name: 'Engineering Practices', level: 3 }),
    ).toBeVisible()

    // Verify intro text
    await expect(page.getByText('AI coding multiplies your process')).toBeVisible()

    // 2. Verify all 6 practice labels are visible
    const practiceLabels = [
      'Sprint Planning',
      'TDD / Tests',
      'Code Review',
      'CI/CD Pipeline',
      'Pair Programming',
      'Refactoring Budget',
    ]
    for (const label of practiceLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }

    // Verify all checkboxes start unchecked
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(6)
    for (let i = 0; i < 6; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked()
    }

    // 3. Toggle the "CI/CD Pipeline" checkbox (4th practice, index 3)
    // Use click() not check() because React controls the checkbox state
    const cicdCheckbox = checkboxes.nth(3)
    await cicdCheckbox.click()

    // 4. Verify it becomes checked (React re-renders after game state update)
    await expect(cicdCheckbox).toBeChecked({ timeout: 5_000 })

    // 5. Close the panel by clicking "Practices" button again
    await page.getByRole('button', { name: 'Practices' }).click()

    // 6. Reopen it
    await page.getByRole('button', { name: 'Practices' }).click()

    // 7. Verify "CI/CD Pipeline" is still checked (state persisted)
    await expect(page.locator('input[type="checkbox"]').nth(3)).toBeChecked()
  })
})
