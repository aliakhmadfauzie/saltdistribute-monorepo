import { Page, expect } from '@playwright/test';

/**
 * Standard test credentials
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@saltdistribute.id',
    username: 'admin_jaya',
    password: 'admin123',
    name: 'Hendra Wijaya',
  },
  buyer: {
    email: 'buyer@saltdistribute.id',
    username: 'client_jaya',
    password: 'buyer123',
    name: 'Budi Santoso',
  },
  siti: {
    email: 'siti@dapurlestari.co.id',
    username: 'dapur_lestari',
    password: 'siti123',
    name: 'Siti Rahma',
  },
};

/**
 * Reset authentication session in browser
 */
export async function clearSession(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('@saltdistribute_auth_user');
  });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Perform login via form input
 */
export async function loginWithCredentials(
  page: Page,
  identifier: string,
  pass: string
): Promise<void> {
  await clearSession(page);

  // Fill in email or username
  const emailInput = page.locator('input[type="email"], input[placeholder*="@"], input[placeholder*="you@"]');
  await emailInput.first().waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.first().fill(identifier);

  // Fill in password
  const passInput = page.locator('input[type="password"]');
  await passInput.first().fill(pass);

  // Submit
  const submitBtn = page.locator(
    'button:has-text("Sign In"), button:has-text("Masuk"), button:has-text("Login"), [role="button"]:has-text("Sign In"), [role="button"]:has-text("Masuk"), [role="button"]:has-text("Login")'
  );
  await submitBtn.first().click();
}

/**
 * Perform login via demo shortcuts and ensure landing on dashboard
 */
export async function loginAsDemo(page: Page, role: 'buyer' | 'admin'): Promise<void> {
  await clearSession(page);

  const demoBtn =
    role === 'buyer'
      ? page
          .locator('[aria-label*="Buyer Demo"]')
          .or(page.locator('[aria-label*="buyer"]'))
          .or(page.locator('text=Buyer Demo'))
          .or(page.locator('text=Buyer Portal'))
          .or(page.locator('text=Portal Pembeli'))
          .first()
      : page
          .locator('[aria-label*="Admin Demo"]')
          .or(page.locator('[aria-label*="admin"]'))
          .or(page.locator('text=Admin Demo'))
          .or(page.locator('text=Admin Portal'))
          .or(page.locator('text=Portal Admin'))
          .first();

  await demoBtn.waitFor({ state: 'visible', timeout: 15000 });
  await demoBtn.click();
  await page.waitForTimeout(1500);
}

/**
 * Retrieve database / AsyncStorage snapshot from browser runtime
 */
export async function getStoredDatabase(page: Page): Promise<{
  users: any[];
  bookings: any[];
  inventory: any;
}> {
  return await page.evaluate(async () => {
    const usersRaw = localStorage.getItem('@saltdistribute_users_list');
    const bookingsRaw = localStorage.getItem('@saltdistribute_bookings_v3');
    const inventoryRaw = localStorage.getItem('@saltdistribute_inventory_v3');

    return {
      users: usersRaw ? JSON.parse(usersRaw) : [],
      bookings: bookingsRaw ? JSON.parse(bookingsRaw) : [],
      inventory: inventoryRaw ? JSON.parse(inventoryRaw) : null,
    };
  });
}
