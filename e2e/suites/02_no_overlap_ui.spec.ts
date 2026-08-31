import { test, expect } from '@playwright/test';
import { verifyNoOverlappingElements } from '../helpers/ui-helpers';
import { loginAsDemo } from '../helpers/test-utils';

test.describe('2. Screen Layout & Zero-Overlap UI Verification', () => {
  test('Auth Screens: Login & Register forms have no overlapping buttons or inputs', async ({ page }) => {
    // 1. Check Login Page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    const loginCollisions = await verifyNoOverlappingElements(page);
    expect(loginCollisions.hasCollision).toBe(false);

    // 2. Check Register Page
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    const registerCollisions = await verifyNoOverlappingElements(page);
    expect(registerCollisions.hasCollision).toBe(false);
  });

  test('Buyer Dashboard: Product cards, quantity buttons, and bottom tab navigation have no overlap', async ({
    page,
  }) => {
    await loginAsDemo(page, 'buyer');

    const buyerCollisions = await verifyNoOverlappingElements(page);
    expect(buyerCollisions.hasCollision).toBe(false);
  });

  test('Admin Dashboard: Summary metric cards, action buttons, and navigation bar have no overlap', async ({
    page,
  }) => {
    await loginAsDemo(page, 'admin');

    const adminCollisions = await verifyNoOverlappingElements(page);
    expect(adminCollisions.hasCollision).toBe(false);
  });
});
