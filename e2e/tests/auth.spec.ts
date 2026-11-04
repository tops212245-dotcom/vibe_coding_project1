import { test, expect } from '@playwright/test';

test.describe('Authentication and RBAC Flow', () => {
  test('should display login page with role switcher or credentials form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/HomeServe/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should perform customer login and redirect to customer dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer@homeserve.com');
    await page.fill('input[type="password"]', 'CustomerPass123!');
    await page.click('button[type="submit"]');

    // Upon successful login, customer should be redirected to /customer dashboard
    await expect(page).toHaveURL(/\/customer/);
  });

  test('should perform provider login and access provider workspace', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'provider@homeserve.com');
    await page.fill('input[type="password"]', 'ProviderPass123!');
    await page.click('button[type="submit"]');

    // Provider redirected to /provider dashboard
    await expect(page).toHaveURL(/\/provider/);
  });

  test('should perform admin login and access platform control center', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@homeserve.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    // Admin redirected to /admin dashboard
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should reject unauthorized access to protected admin route', async ({ page }) => {
    // Attempting direct navigation to /admin without token
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

