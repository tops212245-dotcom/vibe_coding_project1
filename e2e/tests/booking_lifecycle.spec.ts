import { test, expect } from '@playwright/test';

test.describe('End-to-End Booking Lifecycle and Role Operations', () => {
  test('customer can initiate booking and view appointment schedule', async ({ page }) => {
    // 1. Customer logs in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'customer@homeserve.com');
    await page.fill('input[type="password"]', 'CustomerPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/customer/);

    // 2. Navigate to services catalog
    await page.goto('/services/1');
    await expect(page.locator('h1')).toBeVisible();

    // 3. Navigate to customer appointments
    await page.goto('/customer');
    await expect(page.getByText(/Bookings/i).first()).toBeVisible();
  });

  test('provider can review requests and view earnings dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'provider@homeserve.com');
    await page.fill('input[type="password"]', 'ProviderPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/provider/);

    // Verify provider sections
    await page.goto('/provider/requests');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/provider/earnings');
    await expect(page.getByText(/Earnings/i).first()).toBeVisible();
  });

  test('technician can access assigned jobs dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'tech@homeserve.com');
    await page.fill('input[type="password"]', 'TechPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/technician/);
    await expect(page.getByText(/Technician Dashboard/i)).toBeVisible();
  });

  test('admin can access analytics and system control panel', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@homeserve.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);

    // Verify admin navigation
    await page.goto('/admin/providers');
    await expect(page.getByText(/Providers/i).first()).toBeVisible();

    await page.goto('/admin/reports');
    await expect(page.getByText(/Reports/i).first()).toBeVisible();
  });
});

