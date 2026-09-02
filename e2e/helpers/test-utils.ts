import { Page, expect } from '@playwright/test';

/**
 * Multi-Admin and Multi-Customer Test Users
 */
export const TEST_USERS = {
  admin: {
    userId: 'usr_admin_1',
    email: 'admin@saltdistribute.id',
    username: 'admin_jaya',
    password: 'admin123',
    name: 'Hendra Wijaya',
    role: 'admin' as const,
    companyName: 'PT Garam Nusantara (Seller)',
    phoneNumber: '+6281122334455',
  },
  admin2: {
    userId: 'usr_admin_2',
    email: 'seller2@saltdistribute.id',
    username: 'seller_rian',
    password: 'admin123',
    name: 'Rian Logistics Admin',
    role: 'admin' as const,
    companyName: 'PT Garam Nusantara (Seller)',
    phoneNumber: '+6281199887766',
  },
  buyer: {
    userId: 'usr_buyer_1',
    email: 'buyer@saltdistribute.id',
    username: 'client_jaya',
    password: 'buyer123',
    name: 'Budi Santoso',
    role: 'buyer' as const,
    companyName: 'UD Maju Bersama',
    phoneNumber: '+6281234567890',
  },
  siti: {
    userId: 'usr_buyer_2',
    email: 'siti@dapurlestari.co.id',
    username: 'dapur_lestari',
    password: 'siti123',
    name: 'Siti Rahma',
    role: 'buyer' as const,
    companyName: 'PT Dapur Lestari Kuliner',
    phoneNumber: '+6281355443322',
  },
  ahmad: {
    userId: 'usr_buyer_3',
    email: 'ahmad@industri.co.id',
    username: 'ahmad_pangan',
    password: 'ahmad123',
    name: 'Ahmad Fauzi',
    role: 'buyer' as const,
    companyName: 'CV Pangan Berkah Mandiri',
    phoneNumber: '+6281988776655',
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
 * Fast direct authenticated session injection (bypasses network latency)
 */
export async function authenticateDirectly(
  page: Page,
  user: typeof TEST_USERS.admin | typeof TEST_USERS.buyer | typeof TEST_USERS.siti
): Promise<void> {
  await page.goto('/login');
  await page.evaluate((userData) => {
    localStorage.setItem('@saltdistribute_auth_user', JSON.stringify(userData));
  }, user);
  if (user.role === 'admin') {
    await page.goto('/(admin)');
  } else {
    await page.goto('/(buyer)');
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
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
  const emailInput = page.locator('input[type="email"], input[placeholder*="admin_jaya"], input[placeholder*="@"], input[placeholder*="you@"]');
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
          .or(page.locator('text=Portal Penjual'))
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
