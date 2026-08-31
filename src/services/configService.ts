/**
 * SaltDistribute - Centralized Business Configuration Service
 * Provides single source of truth for business rules, bank payment accounts,
 * delivery fee tiers, and fallback distances.
 */

export interface BankAccountConfig {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeUrl?: string;
  iconName?: string;
}

export interface BusinessConfig {
  companyName: string;
  tagline: string;
  supportPhone: string;
  supportWhatsapp: string;
  defaultDeliveryFee: number;
  baseDeliveryDistanceKm: number;
  baseDeliveryFeeKm: number;
  additionalRatePerKm: number;
  defaultFallbackDistanceKm: number;
  bankAccounts: BankAccountConfig[];
  sampleReceipts: {
    name: string;
    url: string;
    type: "image" | "pdf";
  }[];
}

export const APP_BUSINESS_CONFIG: BusinessConfig = {
  companyName: "SaltDistribute ID",
  tagline: "Distribusi Garam Industri & Konsumsi Terpercaya",
  supportPhone: "+62 812-3456-7890",
  supportWhatsapp: "6281234567890",
  defaultDeliveryFee: 25000,
  baseDeliveryDistanceKm: 3.0,
  baseDeliveryFeeKm: 10000,
  additionalRatePerKm: 1500,
  defaultFallbackDistanceKm: 5.0,
  bankAccounts: [
    {
      bankName: "Bank Central Asia (BCA)",
      bankCode: "BCA",
      accountNumber: "022-892-1109",
      accountHolder: "PT SALTDISTRIBUTE INDONESIA",
      iconName: "bank",
    },
    {
      bankName: "Bank Mandiri",
      bankCode: "MANDIRI",
      accountNumber: "111-00-9876543-2",
      accountHolder: "PT SALTDISTRIBUTE INDONESIA",
      iconName: "bank-outline",
    },
    {
      bankName: "Bank Rakyat Indonesia (BRI)",
      bankCode: "BRI",
      accountNumber: "0341-01-000456-30-1",
      accountHolder: "PT SALTDISTRIBUTE INDONESIA",
      iconName: "credit-card-outline",
    },
  ],
  sampleReceipts: [
    {
      name: "BCA Mobile Transfer Receipt (Screenshot)",
      url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=80",
      type: "image",
    },
    {
      name: "Mandiri Livin' Transfer Struk",
      url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=700&auto=format&fit=crop&q=80",
      type: "image",
    },
    {
      name: "BNI Direct Official Invoice PDF",
      url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=700&auto=format&fit=crop&q=80",
      type: "pdf",
    },
  ],
};

/** Get primary bank account details */
export function getPrimaryBankAccount(): BankAccountConfig {
  return APP_BUSINESS_CONFIG.bankAccounts[0];
}

/** Get list of all accepted payment bank accounts */
export function getAvailableBankAccounts(): BankAccountConfig[] {
  return APP_BUSINESS_CONFIG.bankAccounts;
}

/** Get sample receipt previews for testing/mock flows */
export function getSampleReceipts() {
  return APP_BUSINESS_CONFIG.sampleReceipts;
}
