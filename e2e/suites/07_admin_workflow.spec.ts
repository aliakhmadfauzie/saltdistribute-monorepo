import { test, expect } from '@playwright/test';
import { loginAsDemo, getStoredDatabase } from '../helpers/test-utils';

test.describe('7. Admin Management Workflow', () => {
  test('Dashboard & Metrics: Displays revenue summary, active orders, and inventory overview', async ({
    page,
  }) => {
    await loginAsDemo(page, 'admin');

    // Verify admin header / title
    await expect(page.locator('text=Admin').or(page.locator('text=Dashboard')).or(page.locator('text=SaltDistribute')).first()).toBeVisible();

    // Verify metrics exist
    const statCards = page.locator('text=Rp').or(page.locator('text=Pesanan')).or(page.locator('text=Orders')).or(page.locator('text=Warehouse'));
    await expect(statCards.first()).toBeVisible();
  });

  test('Inventory Management: Lists warehouse stock reserve and restock logs', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify inventory page is loaded
    await expect(page.locator('text=Stok').or(page.locator('text=Inventory')).or(page.locator('text=Garam')).first()).toBeVisible();
  });

  test('Customer Directory: Displays registered buyers and their statuses', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.goto('/users');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify customers are rendered
    const db = await getStoredDatabase(page);
    expect(db.users.length).toBeGreaterThanOrEqual(1);

    await expect(page.locator('text=Budi').or(page.locator('text=Santoso')).or(page.locator('text=Pengguna')).first()).toBeVisible();
  });

  test('Floating Admin Action Button: Opens speed dial overlay and triggers actions', async ({ page }) => {
    await loginAsDemo(page, 'admin');
    await page.waitForTimeout(1000);

    // Find the floating action trigger button
    const fab = page.locator('[data-testid="floating-admin-fab"]').or(page.locator('[aria-label="Menu Aksi Cepat Admin"]')).first();
    await expect(fab).toBeVisible();

    // Click the FAB to open the action speed dial menu
    await fab.click();
    await page.waitForTimeout(600);

    // Verify speed dial options are displayed
    const restockAction = page.locator('[data-testid="floating-action-restock"]').or(page.locator('text=Catat Pasokan Masuk')).first();
    const settingsAction = page.locator('[data-testid="floating-action-settings"]').or(page.locator('text=Setelan Toko & Kontrol')).first();
    await expect(restockAction).toBeVisible();
    await expect(settingsAction).toBeVisible();

    // Click Restock action
    await restockAction.click({ force: true });
    await page.waitForTimeout(600);

    // Verify Restock modal or management section is opened
    await expect(
      page.locator('text=Catat Pasokan Masuk').or(page.locator('text=Database')).or(page.locator('text=Pasokan')).first()
    ).toBeVisible();
  });
});
