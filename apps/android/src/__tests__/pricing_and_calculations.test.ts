import { UnitTier } from '../types';

/**
 * Domain Calculation Functions to verify
 */
export function calculateVolumePricing(
  quantityGram: number,
  basePricePerGram: number,
  tiers: UnitTier[],
  deliveryType: 'COD' | 'DELIVERY',
  deliveryFee: number = 0
) {
  // Find matching tier discount
  const matchingTier = tiers
    .filter((t) => quantityGram >= t.quantityGram)
    .sort((a, b) => b.quantityGram - a.quantityGram)[0];

  const discountPercent = matchingTier ? matchingTier.discountPercent : 0;
  const baseSubtotal = quantityGram * basePricePerGram;
  const discountAmount = Math.round((baseSubtotal * discountPercent) / 100);
  const discountedSubtotal = baseSubtotal - discountAmount;
  const fee = deliveryType === 'DELIVERY' ? deliveryFee : 0;
  const grandTotal = discountedSubtotal + fee;

  return {
    quantityGram,
    baseSubtotal,
    discountPercent,
    discountAmount,
    discountedSubtotal,
    deliveryFee: fee,
    grandTotal,
  };
}

export function formatGrams(grams: number): string {
  if (grams >= 1_000_000) {
    return `${(grams / 1_000_000).toFixed(1)} Ton`;
  }
  if (grams >= 1_000) {
    return `${(grams / 1_000).toFixed(1)} kg`;
  }
  return `${grams} g`;
}

export function calculateGramsFromNominalBudget(
  nominalIdr: number,
  basePricePerGram: number
): number {
  if (basePricePerGram <= 0 || nominalIdr <= 0) return 0;
  const rawGrams = nominalIdr / basePricePerGram;
  return Math.round(rawGrams * 10) / 10;
}

describe('Pricing & Volume Calculations (Wholesale B2B)', () => {
  const BASE_PRICE = 800_000; // IDR 800,000 / gram
  const mockTiers: UnitTier[] = [
    { id: 't1', name: 'Micro Sample', quantityGram: 0.5, label: '0.5 g', discountPercent: 0 },
    { id: 't2', name: 'Standard Gram', quantityGram: 1.0, label: '1.0 g', discountPercent: 0 },
    { id: 't3', name: 'Medium Batch', quantityGram: 5.0, label: '5.0 g', discountPercent: 5 },
    { id: 't4', name: 'Commercial 10g', quantityGram: 10.0, label: '10.0 g', discountPercent: 8 },
    { id: 't5', name: 'Bulk Wholesale 100g', quantityGram: 100.0, label: '100 g', discountPercent: 12 },
  ];

  test('0.5g sample calculation with COD (Zero delivery fee)', () => {
    const result = calculateVolumePricing(0.5, BASE_PRICE, mockTiers, 'COD', 25_000);
    expect(result.baseSubtotal).toBe(400_000);
    expect(result.discountPercent).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.deliveryFee).toBe(0);
    expect(result.grandTotal).toBe(400_000);
  });

  test('10.0g bulk order with 8% discount and Delivery fee', () => {
    const deliveryFee = 35_000;
    const result = calculateVolumePricing(10.0, BASE_PRICE, mockTiers, 'DELIVERY', deliveryFee);

    expect(result.baseSubtotal).toBe(8_000_000);
    expect(result.discountPercent).toBe(8);
    expect(result.discountAmount).toBe(640_000);
    expect(result.discountedSubtotal).toBe(7_360_000);
    expect(result.deliveryFee).toBe(35_000);
    expect(result.grandTotal).toBe(7_395_000);
  });

  test('100g wholesale batch with 12% discount', () => {
    const result = calculateVolumePricing(100.0, BASE_PRICE, mockTiers, 'COD');
    expect(result.baseSubtotal).toBe(80_000_000);
    expect(result.discountPercent).toBe(12);
    expect(result.discountAmount).toBe(9_600_000);
    expect(result.grandTotal).toBe(70_400_000);
  });

  test('formatGrams formatting across grams, kilograms, and metric tons', () => {
    expect(formatGrams(0.5)).toBe('0.5 g');
    expect(formatGrams(500)).toBe('500 g');
    expect(formatGrams(1_000)).toBe('1.0 kg');
    expect(formatGrams(25_500)).toBe('25.5 kg');
    expect(formatGrams(1_000_000)).toBe('1.0 Ton');
    expect(formatGrams(5_500_000)).toBe('5.5 Ton');
  });

  test('calculateGramsFromNominalBudget converts budget to exact grams accurately', () => {
    expect(calculateGramsFromNominalBudget(1_600_000, 800_000)).toBe(2.0);
    expect(calculateGramsFromNominalBudget(400_000, 800_000)).toBe(0.5);
    expect(calculateGramsFromNominalBudget(2_000_000, 800_000)).toBe(2.5);
  });
});
