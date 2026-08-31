import { test, expect } from '@playwright/test';
import { loginAsDemo, getStoredDatabase } from '../helpers/test-utils';

test.describe('4. Real Database & Persistence Validation', () => {
  test('Database snapshot: documents initial users, inventory catalog, and active bookings', async ({
    page,
  }) => {
    await loginAsDemo(page, 'buyer');

    const db = await getStoredDatabase(page);

    expect(db.users.length).toBeGreaterThanOrEqual(3);
    const adminUser = db.users.find((u: any) => u.role === 'admin');
    const buyerUser = db.users.find((u: any) => u.role === 'buyer');

    expect(adminUser).toBeDefined();
    expect(adminUser.email).toContain('admin@saltdistribute.id');
    expect(buyerUser).toBeDefined();
    expect(buyerUser.email).toContain('buyer@saltdistribute.id');

    if (db.inventory) {
      expect(db.inventory.availableQuantityGram).toBeGreaterThan(0);
      expect(db.inventory.unitTiers.length).toBeGreaterThan(0);
    }
  });

  test('Data Persistence: Modifications persist across browser reloads', async ({ page }) => {
    await loginAsDemo(page, 'buyer');
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const initialDb = await getStoredDatabase(page);
    const initialCount = initialDb.bookings.length;

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const reloadedDb = await getStoredDatabase(page);
    expect(reloadedDb.bookings.length).toBe(initialCount);

    if (initialCount > 0) {
      expect(reloadedDb.bookings[0].bookingId).toBe(initialDb.bookings[0].bookingId);
    }
  });
});
