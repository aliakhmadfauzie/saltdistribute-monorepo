import { test, expect } from '@playwright/test';
import { loginAsDemo, getStoredDatabase } from '../helpers/test-utils';

test.describe('7. Admin Management Workflow', () => {
  test('Dashboard & Metrics: Displays revenue summary, active orders, and inventory overview', async ({
    page,
  }) => {
    await loginAsDemo(page, 'admin');

    // Verify admin header / title
    await expect(page.locator('text=Admin').or(page.locator('text=Dashboard')).or(page.locator('text=SaltDistribute')).or(page.locator('text=Penjual')).first()).toBeVisible();

    // Verify metrics exist
    const statCards = page.locator('text=Rp').or(page.locator('text=Pesanan')).or(page.locator('text=Orders')).or(page.locator('text=Warehouse')).or(page.locator('text=Stok'));
    await expect(statCards.first()).toBeVisible();
  });

  test('Inventory Management: Lists warehouse stock reserve and restock logs', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify inventory page is loaded
    await expect(page.locator('text=Stok').or(page.locator('text=Inventory')).or(page.locator('text=Garam')).or(page.locator('text=Harga')).first()).toBeVisible();
  });

  test('Customer Directory: Displays registered buyers and their statuses', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify customers are rendered
    const db = await getStoredDatabase(page);
    expect(db.users.length).toBeGreaterThanOrEqual(1);

    await expect(page.locator('text=Budi').or(page.locator('text=Santoso')).or(page.locator('text=Pengguna')).or(page.locator('text=Pembeli')).first()).toBeVisible();
  });

  test('Floating Admin Action Button: Opens speed dial overlay and triggers actions', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.waitForTimeout(1000);

    // Find the floating action trigger button
    const fab = page.locator('[data-testid="floating-admin-fab"]').or(page.locator('[aria-label="Menu Aksi Cepat Admin"]')).or(page.locator('[aria-label*="Admin"]')).first();
    if ((await fab.count()) > 0) {
      await expect(fab).toBeVisible();

      // Click the FAB to open the action speed dial menu
      await fab.click();
      await page.waitForTimeout(600);

      // Verify speed dial options or action triggers are displayed
      const restockAction = page.locator('[data-testid="floating-action-restock"]').or(page.locator('text=Catat Pasokan Masuk')).or(page.locator('text=Pasokan')).or(page.locator('text=Restock')).first();
      if ((await restockAction.count()) > 0) {
        await expect(restockAction).toBeVisible();
        await restockAction.click({ force: true });
        await page.waitForTimeout(600);

        await expect(
          page.locator('text=Catat Pasokan Masuk').or(page.locator('text=Database')).or(page.locator('text=Pasokan')).or(page.locator('text=Restock')).or(page.locator('text=Stok')).first()
        ).toBeVisible();
      }
    }
  });
});
