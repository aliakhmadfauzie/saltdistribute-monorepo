import { isTargetedForUser, AppNotificationPayload } from '../services/notificationService';

describe('Notification Security & Targeting Rules', () => {
  const buyerUser1 = { userId: 'usr_buyer_1', role: 'buyer' };
  const buyerUser2 = { userId: 'usr_buyer_2', role: 'buyer' };
  const adminUser1 = { userId: 'usr_admin_1', role: 'admin' };
  const adminUser2 = { userId: 'usr_admin_2', role: 'admin' };

  test('Direct userId targeted notification is strictly delivered only to recipient', () => {
    const payload: AppNotificationPayload = {
      title: 'Order Status Changed',
      body: 'Your order BK-123 is confirmed',
      recipientUserId: 'usr_buyer_1',
      recipientRole: 'buyer',
      bookingId: 'BK-123',
    };

    // Should match recipient
    expect(isTargetedForUser(payload, buyerUser1.userId, buyerUser1.role)).toBe(true);

    // MUST NOT match another buyer (prevents cross-customer leakage)
    expect(isTargetedForUser(payload, buyerUser2.userId, buyerUser2.role)).toBe(false);

    // MUST NOT match admin
    expect(isTargetedForUser(payload, adminUser1.userId, adminUser1.role)).toBe(false);
  });

  test('Role-targeted admin notification is delivered to any admin, but NEVER to buyers', () => {
    const adminPayload: AppNotificationPayload = {
      title: 'New Order Arrived',
      body: 'Order BK-999 needs confirmation',
      recipientRole: 'admin',
    };

    // Both admins can see seller pipeline notifications
    expect(isTargetedForUser(adminPayload, adminUser1.userId, adminUser1.role)).toBe(true);
    expect(isTargetedForUser(adminPayload, adminUser2.userId, adminUser2.role)).toBe(true);

    // Buyers are blocked from admin pipeline notifications
    expect(isTargetedForUser(adminPayload, buyerUser1.userId, buyerUser1.role)).toBe(false);
    expect(isTargetedForUser(adminPayload, buyerUser2.userId, buyerUser2.role)).toBe(false);
  });

  test('Role-targeted buyer notification is delivered to buyers, but not admins', () => {
    const buyerBroadcast: AppNotificationPayload = {
      title: 'Flash Salt Promo',
      body: 'Special discount on 100g tier',
      recipientRole: 'buyer',
    };

    expect(isTargetedForUser(buyerBroadcast, buyerUser1.userId, buyerUser1.role)).toBe(true);
    expect(isTargetedForUser(buyerBroadcast, buyerUser2.userId, buyerUser2.role)).toBe(true);
    expect(isTargetedForUser(buyerBroadcast, adminUser1.userId, adminUser1.role)).toBe(false);
  });

  test('Global system broadcast (recipientRole: all) is delivered to all users', () => {
    const globalPayload: AppNotificationPayload = {
      title: 'System Maintenance Notice',
      body: 'Maintenance completed successfully',
      recipientRole: 'all',
    };

    expect(isTargetedForUser(globalPayload, buyerUser1.userId, buyerUser1.role)).toBe(true);
    expect(isTargetedForUser(globalPayload, adminUser1.userId, adminUser1.role)).toBe(true);
  });
});
