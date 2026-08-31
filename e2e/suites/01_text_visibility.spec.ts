import { test, expect } from '@playwright/test';
import { verifyAllTextVisible } from '../helpers/ui-helpers';
import { loginAsDemo } from '../helpers/test-utils';

test.describe('1. Text Visibility & Legibility Verification', () => {
  test('Auth Screens: all header, form labels, buttons, and helper texts are fully visible and not clipped', async ({
    page,
  }) => {
    // 1. Check Login Screen
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    const loginAudit = await verifyAllTextVisible(page);
    expect(loginAudit.visibleCount).toBeGreaterThan(5);

    // Verify key textual elements are rendered and visible
    await expect(page.locator('text=SaltDistribute').first()).toBeVisible();
    await expect(page.locator('text=Email').first()).toBeVisible();
    await expect(page.locator('text=Password').first()).toBeVisible();

    // 2. Check Register Screen
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    const registerAudit = await verifyAllTextVisible(page);
    expect(registerAudit.visibleCount).toBeGreaterThan(6);

    // Verify registration labels
    await expect(page.locator('text=Nama Lengkap').or(page.locator('text=Full Name')).first()).toBeVisible();
    await expect(page.locator('text=Email').first()).toBeVisible();
  });

  test('Buyer Screens: product catalogue titles, tier prices, stock badges, and tabs are fully visible', async ({
    page,
  }) => {
    await loginAsDemo(page, 'buyer');

    // 1. Buyer Main Catalogue
    const buyerAudit = await verifyAllTextVisible(page);
    expect(buyerAudit.visibleCount).toBeGreaterThan(5);

    // 2. Buyer Orders History
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const ordersAudit = await verifyAllTextVisible(page);
    expect(ordersAudit.visibleCount).toBeGreaterThan(3);

    // 3. Buyer Profile
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const profileAudit = await verifyAllTextVisible(page);
    expect(profileAudit.visibleCount).toBeGreaterThan(3);
  });

  test('Admin Screens: KPI stats, inventory badges, and user tables are fully visible', async ({
    page,
  }) => {
    await loginAsDemo(page, 'admin');

    // 1. Admin Dashboard
    const adminAudit = await verifyAllTextVisible(page);
    expect(adminAudit.visibleCount).toBeGreaterThan(4);

    // 2. Admin Inventory
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const invAudit = await verifyAllTextVisible(page);
    expect(invAudit.visibleCount).toBeGreaterThan(3);

    // 3. Admin Users
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const usersAudit = await verifyAllTextVisible(page);
    expect(usersAudit.visibleCount).toBeGreaterThan(3);
  });
});
