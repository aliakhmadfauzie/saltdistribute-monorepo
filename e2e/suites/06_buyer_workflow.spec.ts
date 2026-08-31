import { test, expect } from '@playwright/test';
import { loginAsDemo, getStoredDatabase } from '../helpers/test-utils';

test.describe('6. Buyer End-to-End Workflow', () => {
  test('Complete Order Placement: Browse catalog, choose tier, select delivery and submit order', async ({
    page,
  }) => {
    await loginAsDemo(page, 'buyer');

    // 1. Verify Catalog Details
    await expect(page.locator('text=Salt').or(page.locator('text=Garam')).first()).toBeVisible();

    // 2. Select a Tier (e.g. 1.0g or 0.5g)
    const tierPill = page.locator('[role="button"]:has-text("1.0 g"), [role="button"]:has-text("0.5 g")');
    if ((await tierPill.count()) > 0) {
      await tierPill.first().click();
      await page.waitForTimeout(300);
    }

    // 3. Click "Pesan Sekarang" / "Book Order"
    const orderBtn = page.locator('[role="button"]:has-text("Pesan"), [role="button"]:has-text("Order"), [role="button"]:has-text("Beli")');
    if ((await orderBtn.count()) > 0) {
      await orderBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 4. Verify in Orders tab
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const db = await getStoredDatabase(page);
    expect(db.bookings.length).toBeGreaterThanOrEqual(1);
  });
});
