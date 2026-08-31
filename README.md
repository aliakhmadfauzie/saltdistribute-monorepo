# SaltDistribute — Mobile-First B2B Order Management Platform

[![Expo SDK](https://img.shields.io/badge/Expo-54-000000.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)

**SaltDistribute** is an industrial-grade, mobile-first B2B order & inventory management platform for bulk salt distribution. It connects business owners with wholesale buyers through real-time stock visibility, dynamic volume discounts, order tracking with payment receipt verification, restock cost auditing (COGS & Profit), in-app chat, and 1-click WhatsApp deep linking.

---

## Features

- **Role-Based Workflows**: Pre-configured for **Admin** (`admin@saltdistribute.id` / `admin123`) and **Buyer** (`buyer@saltdistribute.id` / `buyer123`).
- **Dynamic Tiered Pricing**: Automated discount calculations on 100g, 500g, 1 kg, 0.5 Ton, 1.0 Ton, and 1.2 Ton packages.
- **Fulfillment Selector**: Direct Delivery with zone fees vs Self Pickup (COD).
- **Multi-Stage Stepper**: `Placed` $\rightarrow$ `Admin Confirmed` $\rightarrow$ `Proof Paid` $\rightarrow$ `Delivering` $\rightarrow$ `Completed`.
- **Payment Receipt Upload**: Simulated bank receipt capture with preview and admin approval controls.
- **Executive Analytics**: Gross Profit and COGS calculations based on inbound supplier restock batches.
- **Bilingual Localization**: Instant English (🇬🇧) and Bahasa Indonesia (🇮🇩) toggling.
- **1-Click WhatsApp Support**: Deep linking with pre-filled booking ID message templates.

---

## Quick Start

### 1. Frontend (Expo / React Native Web)

```bash
# Install dependencies
npm install

# Start local web development server (Port 8081)
npm run web

# Build static production bundle
npx expo export --platform web
```

### 2. Backend (FastAPI)

```bash
# Install backend requirements
pip install -r requirements.txt

# Start FastAPI server (Port 8000)
python -m uvicorn backend.main:app --reload --port 8000
```

---

## Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@saltdistribute.id` | `admin123` | KPI Analytics, Kanban Pipeline, Inventory & Price Manager, User Directory |
| **Buyer** | `buyer@saltdistribute.id` | `buyer123` | Catalog & Tier Calculator, Order Status Stepper, Proof Upload, Order Chat |

---

## Project Structure

```
├── app/                          # Expo Router file-based screens
│   ├── (auth)/                   # Login & Registration
│   ├── (buyer)/                  # Catalog, Orders, Profile
│   └── (admin)/                  # Dashboard, Pipeline, Inventory, Users
├── src/
│   ├── api/                      # Context exports & IDR/Gram formatting utilities
│   ├── components/               # StockBanner, TierSelector, BookingCard, Modals, Chat
│   ├── context/                  # AuthContext & AppContext (reactive persistent state)
│   ├── i18n/                     # English & Bahasa Indonesia dictionaries
│   ├── theme/                    # Material 3 Emerald & Ceramic Slate tokens
│   └── types/                    # Domain TypeScript models
├── backend/                      # FastAPI backend application
│   ├── main.py                   # API routes & in-memory state
│   ├── models.py                 # Pydantic schemas
│   └── database.py               # Database connector
└── assets/                       # PWA icons and splash screens
```
