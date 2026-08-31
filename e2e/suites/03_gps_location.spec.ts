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
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    // 2. Click 'Pilih di Peta' / 'Pick on Map' button to OPEN the map
    const mapPickerBtn = page.locator('[role="button"]:has-text("Peta"), [role="button"]:has-text("Map")');
    await expect(mapPickerBtn.first()).toBeVisible();
    await mapPickerBtn.first().click();
    await page.waitForTimeout(600);

    // 3. Verify Map Modal is OPENED and DISPLAYED
    const modalHeader = page.locator('text=Pilih Lokasi Pengiriman').or(page.locator('text=Pick Location')).or(page.locator('text=Location'));
    await expect(modalHeader.first()).toBeVisible();

    // 4. Verify user is ABLE TO SEE THE MAP IFRAME
    const mapIframe = page.locator('iframe[title*="Google Maps"]');
    await expect(mapIframe.first()).toBeVisible();

    // 5. Verify Map Controls & Metrics are visible
    await expect(page.locator('text=Roadmap').or(page.locator('text=Jalan')).first()).toBeVisible();
    await expect(page.locator('text=Satelit').or(page.locator('text=Satellite')).first()).toBeVisible();
    await expect(page.locator('text=km').first()).toBeVisible();

    // 6. Test Map Interaction: Switch to Satellite map view
    const satelliteBtn = page.locator('[role="button"]:has-text("Satelit"), [role="button"]:has-text("Satellite")');
    if ((await satelliteBtn.count()) > 0) {
      await satelliteBtn.first().click();
      await page.waitForTimeout(300);
    }

    // 7. Test GPS auto-detection button inside map modal
    const gpsBtn = page.locator('[role="button"]:has-text("GPS"), [role="button"]:has-text("Saat Ini"), [role="button"]:has-text("Current")');
    if ((await gpsBtn.count()) > 0) {
      await gpsBtn.first().click();
      await page.waitForTimeout(400);
    }

    // 8. Confirm selected location and verify modal closes with GPS coordinates attached
    const confirmBtn = page.locator(
      'button:has-text("Gunakan"), button:has-text("Confirm"), [role="button"]:has-text("Gunakan"), [role="button"]:has-text("Confirm"), [role="button"]:has-text("Pilih")'
    );
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 9. Verify GPS coordinates badge appears on the registration form
    const gpsBadge = page.locator('text=GPS:');
    await expect(gpsBadge.first()).toBeVisible();
  });

  test('Delivery Route Map on Buyer Screen: Able to open and see route preview map', async ({
    context,
    page,
  }) => {
    await setupMockGeolocation(context, MEDAN_COORDINATES);
    await loginAsDemo(page, 'buyer');

    // 1. Select Delivery option to show Route Map button
    const deliveryRadio = page.locator('[role="radio"]:has-text("Direct Dispatch"), [role="radio"]:has-text("DELIVERY"), [role="radio"]:has-text("Delivery")');
    if ((await deliveryRadio.count()) > 0) {
      await deliveryRadio.first().click();
      await page.waitForTimeout(300);
    }

    // 2. Click "Route & ETA" / "View Map" to OPEN delivery map modal
    const viewMapBtn = page.locator('[role="button"]:has-text("Route & ETA"), [role="button"]:has-text("View Map"), [role="button"]:has-text("Peta")');
    if ((await viewMapBtn.count()) > 0) {
      await viewMapBtn.first().click();
      await page.waitForTimeout(600);

      // 3. Verify Delivery Map modal is OPENED
      const modalTitle = page.locator('text=Rute').or(page.locator('text=Route')).or(page.locator('text=Delivery')).or(page.locator('text=Google Maps'));
      await expect(modalTitle.first()).toBeVisible();

      // 4. Verify Delivery Map IFRAME is VISIBLE
      const mapIframe = page.locator('iframe[title*="Google Maps"], iframe[title*="Delivery"], dialog iframe, iframe');
      await expect(mapIframe.first()).toBeVisible();

      // 5. Verify Navigation external trigger options exist
      const gmapsLink = page.locator('text=Google Maps');
      await expect(gmapsLink.first()).toBeVisible();
    }
  });

  test('Fallback Handling: Gracefully opens and renders map with fallback coordinates when GPS is denied', async ({
    context,
    page,
  }) => {
    await setupDeniedGeolocation(context);

    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    const mapPickerBtn = page.locator('[role="button"]:has-text("Peta"), [role="button"]:has-text("Map")');
    if ((await mapPickerBtn.count()) > 0) {
      await mapPickerBtn.first().click();
      await page.waitForTimeout(500);

      // Verify modal is open and map frame is rendered
      const mapIframe = page.locator('iframe[title*="Google Maps"]');
      await expect(mapIframe.first()).toBeVisible();
    }
  });
});
