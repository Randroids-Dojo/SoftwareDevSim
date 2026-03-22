import { test, expect } from '@playwright/test'

test.describe('Title Screen', () => {
  test('shows title and start button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('SoftwareDevSim')
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })

  test('clicking Start Game shows app selection', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page.locator('h2')).toContainText('Choose Your App')
  })
})

test.describe('App Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
  })

  test('shows three app choices', async ({ page }) => {
    await expect(page.getByText('Todo App')).toBeVisible()
    await expect(page.getByText('Fitness Tracker')).toBeVisible()
    await expect(page.getByText('E-Commerce Platform')).toBeVisible()
  })

  test('selecting an app moves to hiring screen', async ({ page }) => {
    await page.getByText('Todo App').click()
    await expect(page.locator('h2')).toContainText('Hire Your Team')
    await expect(page.getByText('Todo App')).toBeVisible()
  })
})
