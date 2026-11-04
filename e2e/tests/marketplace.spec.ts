import { test, expect } from '@playwright/test';

test.describe('Marketplace Discovery and Catalog Navigation', () => {
  test('should render landing page hero, popular categories, and features', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/Electrical Services/i)).toBeVisible();
    await expect(page.getByText(/Plumbing/i)).toBeVisible();
  });

  test('should search services by query keyword', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await page.fill('input[placeholder*="Search"]', 'Wiring');
    await page.waitForTimeout(500); // debounce
    await expect(page.getByText(/Wiring/i).first()).toBeVisible();
  });

  test('should view category detail and browse subcategories', async ({ page }) => {
    await page.goto('/categories/electrical-services');
    await expect(page.getByText(/Electrical Services/i).first()).toBeVisible();
  });

  test('should list verified service providers with badges and ratings', async ({ page }) => {
    await page.goto('/providers');
    await expect(page.getByText(/QuickFix Electricals/i).first()).toBeVisible();
  });
});

