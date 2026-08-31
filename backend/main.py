from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime

from backend.models import (
    UserInDB, UserCreate,
    InventoryModel, UnitTier,
    BookingModel, BookingCreate,
    RestockLogModel, ChatMessageModel
)

app = FastAPI(
    title="SaltDistribute API",
    description="Backend API for SaltDistribute B2B Order & Inventory Management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory initial data store for standalone execution
INVENTORY_STATE = {
    "inventoryId": "item_a_stock_main",
    "productName": "Refined Pure Industrial & Food Grade Salt (NaCl 99.2%)",
    "isStockAvailable": True,
    "availableQuantityGram": 25000000,
    "basePricePerGram": 2.0,
    "unitTiers": [
        {"id": "tier_100g", "name": "Sample Pouch", "quantityGram": 100, "label": "100 g", "discountPercent": 0},
        {"id": "tier_500g", "name": "Kitchen Pack", "quantityGram": 500, "label": "500 g", "discountPercent": 3},
        {"id": "tier_1kg", "name": "Standard Bag", "quantityGram": 1000, "label": "1.0 kg", "discountPercent": 5, "isPopular": True},
        {"id": "tier_500kg", "name": "Bulk Half-Ton", "quantityGram": 500000, "label": "0.5 Ton", "discountPercent": 12},
        {"id": "tier_1ton", "name": "Industrial Full Ton", "quantityGram": 1000000, "label": "1.0 Ton", "discountPercent": 18, "isPopular": True},
        {"id": "tier_1_2ton", "name": "Max Freight Container", "quantityGram": 1200000, "label": "1.2 Ton", "discountPercent": 22},
    ],
    "deliveryOptions": [
        {"type": "COD", "label": "Self Pickup (Warehouse Belawan - COD)", "fee": 0},
        {
            "type": "DELIVERY",
            "label": "Direct Dispatch Delivery",
            "fee": 75000,
            "deliveryZones": [
                {"zoneName": "Medan Kota & Sekitarnya", "fee": 75000},
                {"zoneName": "KIM 1 / 2 / 3 & Belawan", "fee": 150000},
                {"zoneName": "Deli Serdang & Binjai", "fee": 200000},
                {"zoneName": "Luar Kota / Sumatera Freight", "fee": 450000},
            ],
        },
    ],
    "promoBannerText": "🚚 Special Promo: Free Pallet Wrapping on all orders above 1.0 Ton!",
    "updatedAt": datetime.utcnow()
}

BOOKINGS_STATE: List[Dict[str, Any]] = []
RESTOCK_STATE: List[Dict[str, Any]] = []
CHATS_STATE: Dict[str, List[Dict[str, Any]]] = {}

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "SaltDistribute B2B Order Management API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow()
    }

@app.get("/api/inventory")
def get_inventory():
    return INVENTORY_STATE

@app.patch("/api/inventory/stock-toggle")
def toggle_stock(isAvailable: bool):
    INVENTORY_STATE["isStockAvailable"] = isAvailable
    INVENTORY_STATE["updatedAt"] = datetime.utcnow()
    return INVENTORY_STATE

@app.patch("/api/inventory/base-price")
def update_base_price(newPrice: float):
    if newPrice <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")
    INVENTORY_STATE["basePricePerGram"] = newPrice
    INVENTORY_STATE["updatedAt"] = datetime.utcnow()
    return INVENTORY_STATE

@app.get("/api/bookings")
def list_bookings(buyerId: Optional[str] = None):
    if buyerId:
        return [b for b in BOOKINGS_STATE if b["buyerId"] == buyerId]
    return BOOKINGS_STATE

@app.post("/api/bookings", status_code=201)
def create_booking(booking_in: BookingCreate):
    qty = booking_in.quantityGram
    if INVENTORY_STATE["availableQuantityGram"] < qty or not INVENTORY_STATE["isStockAvailable"]:
        raise HTTPException(status_code=400, detail="Insufficient warehouse inventory available.")

    subtotal = qty * INVENTORY_STATE["basePricePerGram"]
    # calculate discount
    tier = next((t for t in INVENTORY_STATE["unitTiers"] if t["quantityGram"] == qty), None)
    discountPercent = tier["discountPercent"] if tier else 0
    discountAmount = subtotal * (discountPercent / 100)
    grandTotal = subtotal - discountAmount + booking_in.deliveryFee

    booking_id = f"BK-{datetime.utcnow().strftime('%Y%m%d')}-{len(BOOKINGS_STATE) + 1:03d}"
    now = datetime.utcnow()

    new_booking = {
        **booking_in.dict(),
        "bookingId": booking_id,
        "pricePerGram": INVENTORY_STATE["basePricePerGram"],
        "baseSubtotal": subtotal,
        "discountAmount": discountAmount,
        "grandTotal": grandTotal,
        "status": "PENDING_CONFIRMATION",
        "createdAt": now,
        "updatedAt": now,
    }

    BOOKINGS_STATE.insert(0, new_booking)
    INVENTORY_STATE["availableQuantityGram"] -= qty
    if INVENTORY_STATE["availableQuantityGram"] <= 0:
        INVENTORY_STATE["isStockAvailable"] = False

    return new_booking

@app.patch("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, status: str, rejectionReason: Optional[str] = None):
    booking = next((b for b in BOOKINGS_STATE if b["bookingId"] == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking["status"] = status
    if rejectionReason:
        booking["rejectionReason"] = rejectionReason
    booking["updatedAt"] = datetime.utcnow()
    return booking

@app.post("/api/restock", status_code=201)
def log_restock(supplierName: str, quantityGram: int, costPerGram: float):
    totalCost = quantityGram * costPerGram
    log_entry = {
        "id": f"rst_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "supplierName": supplierName,
        "quantityAddedGram": quantityGram,
        "costPerGram": costPerGram,
        "totalCost": totalCost,
        "timestamp": datetime.utcnow()
    }
    RESTOCK_STATE.insert(0, log_entry)
    INVENTORY_STATE["availableQuantityGram"] += quantityGram
    INVENTORY_STATE["isStockAvailable"] = True
    return log_entry

@app.get("/api/restock")
def list_restock_logs():
    return RESTOCK_STATE
