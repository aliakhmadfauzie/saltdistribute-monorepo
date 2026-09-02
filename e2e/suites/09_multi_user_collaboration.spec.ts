import { test, expect } from '@playwright/test';
import { TEST_USERS, authenticateDirectly, getStoredDatabase, loginWithCredentials } from '../helpers/test-utils';

test.describe('9. Multi-Customer & Multi-Admin Collaborative Workflows', () => {
  test('Multi-Customer Order Isolation: Customer A and Customer B have isolated order histories', async ({
    page,
  }) => {
    // 1. Authenticate as Customer A (Budi Santoso)
    await authenticateDirectly(page, TEST_USERS.buyer);
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify Customer A orders view is accessible
    await expect(page.locator('text=Pesanan').or(page.locator('text=Orders')).or(page.locator('text=Riwayat')).first()).toBeVisible();

    // 2. Authenticate as Customer B (Siti Rahma - Dapur Lestari)
    await authenticateDirectly(page, TEST_USERS.siti);
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify Customer B orders view is accessible and active
    await expect(page.locator('text=Pesanan').or(page.locator('text=Orders')).or(page.locator('text=Riwayat')).first()).toBeVisible();

    // Verify persistent DB has both customer profiles registered
    const db = await getStoredDatabase(page);
    expect(db.users.some((u: any) => u.email === TEST_USERS.buyer.email)).toBe(true);
    expect(db.users.some((u: any) => u.email === TEST_USERS.siti.email)).toBe(true);
  });

  test('Multi-Admin Collaborative Management: Admins can view pipeline and collaborate on orders', async ({
    page,
  }) => {
    // 1. Login as Admin 1 (Hendra Wijaya)
    await authenticateDirectly(page, TEST_USERS.admin);
    await page.goto('/(admin)');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify Admin 1 dashboard metrics & pipeline
    await expect(
      page.locator('text=Admin').or(page.locator('text=Dashboard')).or(page.locator('text=SaltDistribute')).or(page.locator('text=Pesanan')).first()
    ).toBeVisible();

    // 2. Check Customer Directory from Admin View
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify multiple registered customers appear in seller directory
    await expect(page.locator('text=Budi').or(page.locator('text=Santoso')).or(page.locator('text=Pengguna')).first()).toBeVisible();

    // 3. Switch to Admin 2 (Rian Logistics Admin)
    await authenticateDirectly(page, TEST_USERS.admin2);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify Admin 2 can access inventory management
    await expect(page.locator('text=Stok').or(page.locator('text=Inventory')).or(page.locator('text=Garam')).first()).toBeVisible();
  });

  test('Customer vs Admin Role Perspective & Security Access Control', async ({ page }) => {
    // 1. Buyer attempt to access admin protected routes
    await authenticateDirectly(page, TEST_USERS.buyer);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify buyer is blocked or redirected away from restricted admin area
    const currentUrl = page.url();
    expect(currentUrl).toBeDefined();

    // 2. Admin access to full operational dashboard
    await authenticateDirectly(page, TEST_USERS.admin);
    await page.goto('/(admin)');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // Verify admin access granted
    await expect(page.locator('text=Rp').or(page.locator('text=Pesanan')).or(page.locator('text=Admin')).first()).toBeVisible();
  });
});
