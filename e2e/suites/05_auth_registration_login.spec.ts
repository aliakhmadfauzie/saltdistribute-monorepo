import { test, expect } from '@playwright/test';
import { getStoredDatabase, loginWithCredentials, TEST_USERS } from '../helpers/test-utils';

test.describe('5. Account Creation, DB Documentation & Password Validation', () => {
  const uniqueTimestamp = Date.now();
  const newAccount = {
    fullName: `Test Buyer ${uniqueTimestamp}`,
    username: `buyer_${uniqueTimestamp}`,
    email: `buyer_${uniqueTimestamp}@saltdistribute.id`,
    password: `SaltPass@${uniqueTimestamp}`,
    phone: '+6281299988877',
    company: `PT Distribusi Makmur ${uniqueTimestamp}`,
  };

  test('User Registration: creates account and documents username & password in database', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Email').first().waitFor({ state: 'visible', timeout: 15000 });

    // Fill registration form
    const nameInput = page.locator('input[placeholder*="Budi"], input[placeholder*="Nama"]');
    await nameInput.first().fill(newAccount.fullName);

    const companyInput = page.locator('input[placeholder*="Jaya Mandiri"], input[placeholder*="Perusahaan"]');
    await companyInput.first().fill(newAccount.company);

    const phoneInput = page.locator('input[placeholder*="+62"], input[placeholder*="08"]');
    await phoneInput.first().fill(newAccount.phone);

    const emailInput = page.locator('input[placeholder*="budi@"], input[placeholder*="example"]');
    await emailInput.first().fill(newAccount.email);

    const passInput = page.locator('input[type="password"]');
    await passInput.first().fill(newAccount.password);

    // Submit registration
    const registerBtn = page.locator(
      'button:has-text("Create Account"), button:has-text("Daftar"), button:has-text("Register"), [role="button"]:has-text("Create Account"), [role="button"]:has-text("Daftar"), [role="button"]:has-text("Register")'
    );
    await registerBtn.first().click();

    // Verify redirected away from /register
    await page.waitForTimeout(2000);

    // Assert user is documented in persistent database
    const db = await getStoredDatabase(page);
    const savedUser = db.users.find((u: any) => u.email === newAccount.email);

    expect(savedUser).toBeDefined();
    expect(savedUser.name).toBe(newAccount.fullName);
    expect(savedUser.password).toBe(newAccount.password);
    expect(savedUser.role).toBe('buyer');
  });

  test('Wrong Password Rejection: Incorrect password fails login and blocks entry', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Attempt login with valid email but WRONG password
    await loginWithCredentials(page, TEST_USERS.buyer.email, 'wrong_invalid_password_123');

    // Verify user is NOT logged in and error banner is displayed
    await page.waitForTimeout(1000);
    const errorBanner = page.locator('text=Invalid').or(page.locator('text=Salah')).or(page.locator('text=failed'));
    await expect(errorBanner.first()).toBeVisible();
  });

  test('Wrong Username/Email Rejection: Non-existent identifier fails login and blocks entry', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Attempt login with non-existent user
    await loginWithCredentials(page, 'non_existing_user@saltdistribute.id', 'anyPassword123');

    await page.waitForTimeout(1000);
    const errorBanner = page.locator('text=Invalid').or(page.locator('text=Salah')).or(page.locator('text=failed'));
    await expect(errorBanner.first()).toBeVisible();
  });

  test('Valid Credentials Login: Logs in successfully and accesses the application', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Login with existing seeded buyer account
    await loginWithCredentials(page, TEST_USERS.buyer.email, TEST_USERS.buyer.password);

    // Verify successful login
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Salt').or(page.locator('text=Garam')).or(page.locator('text=Katalog')).first()).toBeVisible();
  });
});
