import { test, expect } from '@playwright/test';

test.describe('8. Guest Quick Order Form (Streamlined 4-Question Flow)', () => {
  test('Guest Buyer can open form from Login screen, fill 4 questions, and place order without registration', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Guest Quick Order button exists on Login screen
    const guestBtn = page.locator('[data-testid="guest-order-open-btn"], [data-testid="guest-order-open-btn-root"]');
    await expect(guestBtn.first()).toBeVisible({ timeout: 15000 });
    await guestBtn.first().click();

    // 2. Question 1: Fill Nama
    const nameInput = page.locator('[data-testid="guest-name-input"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Pak Hendra (Toko Garam Jaya)');

    // 3. Question 2: Mode Pembelian (Test Per Gram and Custom Input)
    const gramInput = page.locator('[data-testid="guest-gram-input"]');
    if (await gramInput.isVisible()) {
      await gramInput.fill('2.0');
    }

    // Advance to Step 2: Pengiriman
    const nextToStep2 = page.locator('text=Lanjut: Atur Pengiriman');
    if (await nextToStep2.isVisible()) {
      await nextToStep2.click();
    }

    // 4. Question 4: Lokasi (Fill delivery address)
    const addressInput = page.locator('[data-testid="guest-address-input"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill('Jl. Gatot Subroto No. 88, Medan');
    }

    // Advance to Step 3: Review & Konfirmasi
    const nextToStep3 = page.locator('text=Lanjut: Review');
    if (await nextToStep3.isVisible()) {
      await nextToStep3.click();
    }

    // 5. Submit Order
    const submitBtn = page.locator('[data-testid="guest-submit-order-btn"]');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // 6. Verify Confirmation Screen with WhatsApp Notify Button appears
    await expect(page.locator('text=Order ID').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=BK-GUEST').first()).toBeVisible();
    await expect(page.locator('text=WhatsApp').first()).toBeVisible();
  });
});
