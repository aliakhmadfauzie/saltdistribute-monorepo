import { Booking, BookingStatus, Inventory, RestockLog } from '../types';

/**
 * State machine transition validator
 */
export function canTransitionStatus(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  userRole: 'admin' | 'buyer'
): boolean {
  if (userRole === 'buyer') {
    // Buyer can upload payment when awaiting payment
    if (currentStatus === 'AWAITING_PAYMENT' && targetStatus === 'PAYMENT_VERIFICATION') return true;
    // Buyer can cancel when pending or awaiting payment
    if (
      (currentStatus === 'PENDING_CONFIRMATION' || currentStatus === 'AWAITING_PAYMENT') &&
      targetStatus === 'CANCELLED_UNPAID'
    )
      return true;
    return false;
  }

  if (userRole === 'admin') {
    switch (currentStatus) {
      case 'PENDING_CONFIRMATION':
        return targetStatus === 'AWAITING_PAYMENT' || targetStatus === 'REJECTED_BY_ADMIN';
      case 'AWAITING_PAYMENT':
        return targetStatus === 'PAYMENT_VERIFICATION' || targetStatus === 'CANCELLED_UNPAID' || targetStatus === 'REJECTED_BY_ADMIN';
      case 'PAYMENT_VERIFICATION':
        return targetStatus === 'CONFIRMED_DELIVERING' || targetStatus === 'REJECTED_BY_ADMIN';
      case 'CONFIRMED_DELIVERING':
        return targetStatus === 'COMPLETED';
      case 'COMPLETED':
      case 'CANCELLED_UNPAID':
      case 'REJECTED_BY_ADMIN':
        return false; // Terminal states
      default:
        return false;
    }
  }

  return false;
}

/**
 * Inventory adjustment logic on order placement and rollback
 */
export function applyInventoryDeduction(
  inventory: Inventory,
  orderGrams: number
): { updatedInventory: Inventory; success: boolean } {
  if (inventory.availableQuantityGram < orderGrams) {
    return { updatedInventory: inventory, success: false };
  }

  const updated: Inventory = {
    ...inventory,
    availableQuantityGram: inventory.availableQuantityGram - orderGrams,
    isStockAvailable: inventory.availableQuantityGram - orderGrams > 0,
    updatedAt: new Date().toISOString(),
  };

  return { updatedInventory: updated, success: true };
}

export function applyInventoryRollback(
  inventory: Inventory,
  orderGrams: number
): Inventory {
  return {
    ...inventory,
    availableQuantityGram: inventory.availableQuantityGram + orderGrams,
    isStockAvailable: true,
    updatedAt: new Date().toISOString(),
  };
}

export function applyRestockBatch(
  inventory: Inventory,
  quantityAddedGram: number,
  costPerGram: number,
  supplierName: string
): { updatedInventory: Inventory; log: RestockLog } {
  const newAvailable = inventory.availableQuantityGram + quantityAddedGram;
  const log: RestockLog = {
    id: `restock_${Date.now()}`,
    quantityAddedGram,
    costPerGram,
    totalCost: quantityAddedGram * costPerGram,
    supplierName,
    timestamp: new Date().toISOString(),
  };

  const updated: Inventory = {
    ...inventory,
    availableQuantityGram: newAvailable,
    isStockAvailable: newAvailable > 0,
    updatedAt: new Date().toISOString(),
  };

  return { updatedInventory: updated, log };
}

describe('Order Lifecycle State Machine & Inventory Invariants', () => {
  const initialInventory: Inventory = {
    inventoryId: 'salt_stock',
    productName: 'Garam Industri Super Kristal',
    isStockAvailable: true,
    availableQuantityGram: 50_000,
    basePricePerGram: 800_000,
    unitTiers: [],
    deliveryOptions: [],
    updatedAt: new Date().toISOString(),
  };

  test('Admin valid state transitions flow from PENDING to COMPLETED', () => {
    expect(canTransitionStatus('PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'admin')).toBe(true);
    expect(canTransitionStatus('PENDING_CONFIRMATION', 'REJECTED_BY_ADMIN', 'admin')).toBe(true);
    expect(canTransitionStatus('PAYMENT_VERIFICATION', 'CONFIRMED_DELIVERING', 'admin')).toBe(true);
    expect(canTransitionStatus('CONFIRMED_DELIVERING', 'COMPLETED', 'admin')).toBe(true);
  });

  test('Terminal states cannot transition to other active states', () => {
    expect(canTransitionStatus('COMPLETED', 'PENDING_CONFIRMATION', 'admin')).toBe(false);
    expect(canTransitionStatus('REJECTED_BY_ADMIN', 'CONFIRMED_DELIVERING', 'admin')).toBe(false);
    expect(canTransitionStatus('CANCELLED_UNPAID', 'COMPLETED', 'admin')).toBe(false);
  });

  test('Buyer cannot arbitrarily approve or complete orders', () => {
    expect(canTransitionStatus('PENDING_CONFIRMATION', 'CONFIRMED_DELIVERING', 'buyer')).toBe(false);
    expect(canTransitionStatus('CONFIRMED_DELIVERING', 'COMPLETED', 'buyer')).toBe(false);
  });

  test('applyInventoryDeduction decreases stock accurately and blocks when insufficient', () => {
    const { updatedInventory, success } = applyInventoryDeduction(initialInventory, 10_000);
    expect(success).toBe(true);
    expect(updatedInventory.availableQuantityGram).toBe(40_000);

    // Try deducting more than remaining stock
    const failedAttempt = applyInventoryDeduction(updatedInventory, 50_000);
    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.updatedInventory.availableQuantityGram).toBe(40_000);
  });

  test('applyInventoryRollback returns stock upon cancellation or rejection', () => {
    const reduced = { ...initialInventory, availableQuantityGram: 30_000 };
    const rolledBack = applyInventoryRollback(reduced, 10_000);
    expect(rolledBack.availableQuantityGram).toBe(40_000);
  });

  test('applyRestockBatch adds stock, generates log, and calculates batch cost', () => {
    const { updatedInventory, log } = applyRestockBatch(initialInventory, 25_000, 650_000, 'PT Garam Nusantara');
    expect(updatedInventory.availableQuantityGram).toBe(75_000);
    expect(log.totalCost).toBe(25_000 * 650_000);
    expect(log.supplierName).toBe('PT Garam Nusantara');
  });
});
