from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime

UserRole = Literal["buyer", "admin"]
UserStatus = Literal["active", "suspended"]
BookingStatus = Literal[
    "PENDING_CONFIRMATION",
    "AWAITING_PAYMENT",
    "PAYMENT_VERIFICATION",
    "CONFIRMED_DELIVERING",
    "COMPLETED",
    "CANCELLED_UNPAID",
    "REJECTED_BY_ADMIN"
]

class UserBase(BaseModel):
    username: str
    name: str
    phoneNumber: str
    email: str
    role: UserRole = "buyer"
    status: UserStatus = "active"
    companyName: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    userId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class UnitTier(BaseModel):
    id: str
    name: str
    quantityGram: int
    label: str
    discountPercent: float
    isPopular: Optional[bool] = False

class DeliveryZone(BaseModel):
    zoneName: str
    fee: int

class DeliveryOption(BaseModel):
    type: Literal["COD", "DELIVERY"]
    label: str
    fee: int
    deliveryZones: Optional[List[DeliveryZone]] = None

class InventoryModel(BaseModel):
    inventoryId: str = "item_a_stock_main"
    productName: str
    isStockAvailable: bool = True
    availableQuantityGram: int
    basePricePerGram: float
    unitTiers: List[UnitTier]
    deliveryOptions: List[DeliveryOption]
    promoBannerText: Optional[str] = None
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    buyerId: str
    buyerName: str
    buyerPhone: str
    quantityGram: int
    packageLabel: str
    deliveryType: Literal["COD", "DELIVERY"]
    deliveryZone: Optional[str] = None
    deliveryFee: int = 0
    deliveryAddress: Optional[str] = None
    notes: Optional[str] = None

class BookingModel(BookingCreate):
    bookingId: str
    pricePerGram: float
    baseSubtotal: float
    discountAmount: float
    grandTotal: float
    status: BookingStatus = "PENDING_CONFIRMATION"
    rejectionReason: Optional[str] = None
    paymentProofUrl: Optional[str] = None
    paymentUploadedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class RestockLogModel(BaseModel):
    id: str
    quantityAddedGram: int
    costPerGram: float
    totalCost: float
    supplierName: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageModel(BaseModel):
    id: str
    bookingId: str
    senderId: str
    senderName: str
    senderRole: UserRole
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    isRead: bool = False
