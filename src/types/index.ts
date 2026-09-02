export type UserRole = "buyer" | "admin";
export type UserStatus = "active" | "suspended";

export interface User {
  userId: string;
  username: string;
  password?: string;
  name: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryZone?: string;
  createdAt: string;
}

export interface UnitTier {
  id: string;
  name: string;
  quantityGram: number;
  label: string; // e.g. "100g", "500g", "1 kg", "1 Ton"
  discountPercent: number; // e.g. 0, 5, 10
  isPopular?: boolean;
}

export interface DeliveryZone {
  zoneName: string;
  fee: number;
}

export interface DeliveryOption {
  type: "COD" | "DELIVERY";
  label: string;
  fee: number;
  deliveryZones?: DeliveryZone[];
}

export interface StoreSettings {
  storeName: string;
  sellerName: string;
  sellerPhone: string;
  storeBio?: string;
  operatingHours: string;
  bannerText: string;
  warehouseAddress: string;
  warehouseLatitude: number;
  warehouseLongitude: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  qrisUrl?: string;
  paymentInstructions?: string;
  requirePaymentProof: boolean;
  orderExpirationHours: number;
  maxPurchaseGram: number;
  lowStockThresholdGram: number;
  productDescription?: string;
  productGrade?: string;
}

export interface Inventory {
  inventoryId: string;
  productName: string;
  productGrade?: string;
  productDescription?: string;
  isStockAvailable: boolean;
  availableQuantityGram: number;
  basePricePerGram: number; // e.g. 800000 (IDR 800,000 / gram)
  unitTiers: UnitTier[];
  deliveryOptions: DeliveryOption[];
  updatedAt: string;
  promoBannerText?: string;
  lowStockThresholdGram?: number;
  maxPurchaseGram?: number;
}

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "AWAITING_PAYMENT"
  | "PAYMENT_VERIFICATION"
  | "CONFIRMED_DELIVERING"
  | "COMPLETED"
  | "CANCELLED_UNPAID"
  | "REJECTED_BY_ADMIN";

export interface LiveBuyerLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number | null;
  speedKmh?: number | null;
  headingDegrees?: number | null;
  updatedAt: string;
  isSharing: boolean;
  isMockLocation?: boolean;
}

export type ProximityState =
  | "AT_MEETING_POINT"
  | "APPROACHING"
  | "IN_TRANSIT"
  | "STATIONARY"
  | "OFFLINE";

export type PurchaseMode = "PER_GRAM" | "PER_AMOUNT";

export interface Booking {
  bookingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  quantityGram: number;
  packageLabel: string;
  pricePerGram: number;
  baseSubtotal: number;
  discountAmount: number;
  deliveryType: "COD" | "DELIVERY";
  deliveryZone?: string;
  deliveryFee: number;
  grandTotal: number;
  deliveryAddress?: string;
  notes?: string;
  meetingPointId?: string;
  meetingPointName?: string;
  estimatedDistanceKm?: number;
  estimatedMinutes?: number;
  liveLocation?: LiveBuyerLocation;
  isLocationSharingEnabled?: boolean;
  status: BookingStatus;
  rejectionReason?: string;
  paymentProofUrl?: string;
  paymentProofName?: string;
  paymentUploadedAt?: string;
  attachedDocumentUrl?: string;
  attachedDocumentName?: string;
  createdAt: string;
  updatedAt: string;
  // Guest & Ephemeral Lifecycle Properties
  isGuest?: boolean;
  isTemporary?: boolean;
  isQuickOrder?: boolean;
  orderType?: "QUICK_ORDER" | "STANDARD_MEMBER_ORDER";
  purchaseMode?: PurchaseMode;
  targetAmountIdr?: number;
  guestAccessKey?: string;
  // Agent Detail Edit Fields (aligned with form mockup)
  subject?: string;
  residenceUnit?: string;
  issueCategory?: string;
  isUrgent?: boolean;
  accessNotes?: string;
  photos?: string[];
  dataPurgeStatus?: "ACTIVE" | "PURGED";
  purgedAt?: string;
}

export interface StreamlinedGuestOrderInput {
  buyerName: string;
  purchaseMode: PurchaseMode;
  quantityGram: number;
  targetAmountIdr: number;
  deliveryType: "COD" | "DELIVERY";
  location: string;
  deliveryFee?: number;
  latitude?: number;
  longitude?: number;
  meetingPointId?: string;
  meetingPointName?: string;
  attachedDocumentUrl?: string;
  attachedDocumentName?: string;
}

export interface MeetingPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceFromHubKm: number;
  operatingHours: string;
  securityNote?: string;
  isPopular?: boolean;
}

export interface RestockLog {
  id: string;
  quantityAddedGram: number;
  costPerGram: number;
  totalCost: number;
  supplierName: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: "image" | "document" | "pdf";
}
