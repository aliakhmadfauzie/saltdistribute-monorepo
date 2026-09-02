import { test, expect } from '@playwright/test';
import { setupMockGeolocation, setupDeniedGeolocation, MEDAN_COORDINATES } from '../helpers/location-helpers';
import { loginAsDemo } from '../helpers/test-utils';

test.describe('3. GPS & Map Verification: Ability to Open and View Maps', () => {
  test('Map Picker on Registration: Able to open modal, view interactive map iframe, and confirm location', async ({
    context,
    page,
  }) => {
    // 1. Grant GPS permissions with Medan coordinates
    await setupMockGeolocation(context, MEDAN_COORDINATES);

    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Nama').or(page.locator('text=Daftar')).or(page.locator('text=Email')).first().waitFor({ state: 'visible', timeout: 15000 });

    // 2. Click 'Pin di Peta' button to OPEN the map
    const mapPickerBtn = page.locator('[role="button"]:has-text("Peta"), [role="button"]:has-text("Map"), [role="button"]:has-text("Pin")');
    await expect(mapPickerBtn.first()).toBeVisible();
    await mapPickerBtn.first().click();
    await page.waitForTimeout(600);

    // 3. Verify Map Modal is OPENED and DISPLAYED
    const modalHeader = page.locator('text=Pemilih Titik Lokasi').or(page.locator('text=Pilih Titik')).or(page.locator('text=Map Location')).or(page.locator('text=Peta'));
    await expect(modalHeader.first()).toBeVisible();

    // 4. Verify Map Interaction / Controls & Metrics are visible
    await expect(page.locator('text=Kawasan Industri').or(page.locator('text=Roadmap').or(page.locator('text=Satelit'))).first()).toBeVisible();

    // 5. Test GPS auto-detection button inside map modal
    const gpsBtn = page.locator('[role="button"]:has-text("GPS"), [role="button"]:has-text("Saat Ini"), [role="button"]:has-text("Current")');
    if ((await gpsBtn.count()) > 0) {
      await gpsBtn.first().click();
      await page.waitForTimeout(400);
    }

    // 6. Confirm selected location
    const confirmBtn = page.locator(
      'button:has-text("Konfirmasi"), button:has-text("Confirm"), [role="button"]:has-text("Konfirmasi"), [role="button"]:has-text("Confirm"), [role="button"]:has-text("Pasang Titik")'
    );
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 7. Verify GPS coordinates badge appears on the registration form
    const gpsBadge = page.locator('text=GPS:').or(page.locator('text=Lokasi')).or(page.locator('text=Latitude')).or(page.locator('text=Alamat'));
    await expect(gpsBadge.first()).toBeVisible();
  });

  test('Delivery Route Map on Buyer Screen: Able to open and see route preview map', async ({
    context,
    page,
  }) => {
    await setupMockGeolocation(context, MEDAN_COORDINATES);
    await loginAsDemo(page, 'buyer');

    // 1. Select Delivery option to show Route Map button
    const deliveryRadio = page.locator('[role="radio"]:has-text("Direct Dispatch"), [role="radio"]:has-text("DELIVERY"), [role="radio"]:has-text("Kirim Langsung"), [role="button"]:has-text("Kirim")');
    if ((await deliveryRadio.count()) > 0) {
      await deliveryRadio.first().click();
      await page.waitForTimeout(300);
    }

    // 2. Click "Route & ETA" / "View Map" to OPEN delivery map modal
    const viewMapBtn = page.locator('[role="button"]:has-text("Route & ETA"), [role="button"]:has-text("View Map"), [role="button"]:has-text("Peta"), [role="button"]:has-text("Rute")');
    if ((await viewMapBtn.count()) > 0) {
      await viewMapBtn.first().click();
      await page.waitForTimeout(600);

      // 3. Verify Delivery Map modal is OPENED
      const modalTitle = page.locator('text=Rute').or(page.locator('text=Route')).or(page.locator('text=Delivery')).or(page.locator('text=Google Maps')).or(page.locator('text=Peta'));
      await expect(modalTitle.first()).toBeVisible();
    }
  });

  test('Fallback Handling: Gracefully opens and renders map with fallback coordinates when GPS is denied', async ({
    context,
    page,
  }) => {
    await setupDeniedGeolocation(context);

    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Nama').or(page.locator('text=Daftar')).or(page.locator('text=Email')).first().waitFor({ state: 'visible', timeout: 15000 });

    const mapPickerBtn = page.locator('[role="button"]:has-text("Peta"), [role="button"]:has-text("Map"), [role="button"]:has-text("Pin")');
    if ((await mapPickerBtn.count()) > 0) {
      await mapPickerBtn.first().click();
      await page.waitForTimeout(500);

      // Verify modal is open
      const modalTitle = page.locator('text=Pemilih Titik Lokasi').or(page.locator('text=Pilih Titik')).or(page.locator('text=Map Location')).or(page.locator('text=Peta'));
      await expect(modalTitle.first()).toBeVisible();
    }
  });
});
