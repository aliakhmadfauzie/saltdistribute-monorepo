# ✨ Beautiful & Functional UI Craft Prompts

This guide is dedicated to building **visually stunning, premium, fluid, and fully working UI components and screens** in **SaltDistribute**. It combines `ui-ux-anti-slop`, `frontend-design-system`, `component-crafting`, `mobile-touch-haptics-gestures`, and `interactive-visualization`.

---

## 💎 1. Premium Emerald Glassmorphism & Elevation Aesthetics

### Master Aesthetic Prompt
```text
Please use 'ui-ux-anti-slop' and 'frontend-design-system' to redesign the screen with a premium Material 3 Emerald design system. 
Incorporate:
- Deep Forest dark backgrounds (#0A1A14) paired with Emerald Green (#006C4C) and Mint accents (#48D597)
- Multi-layered glassmorphism (semi-transparent blur with 1px translucent border highlight `rgba(255,255,255,0.08)`)
- Subtle drop shadows with colored tint glow (e.g. `rgba(0, 108, 76, 0.15)`)
- Modern typography hierarchy with distinct letter-spacing and font weights
- Zero default flat cards or generic solid grey boxes
```

### Specific Prompts
* **Glassmorphic Quick-Stats Card:**
  ```text
  Use 'component-crafting' and 'ui-ux-anti-slop' to build a set of 4 glassmorphic KPI cards (Total Sales, Active Salt Orders, Warehouse Stock Tons, Pending Invoices) featuring glowing background gradients, animated counter numbers, and subtle trend badges (+12.4% with green pill).
  ```
* **Floating Header with Dynamic Scroll Blur:**
  ```text
  Create an edge-to-edge floating header using 'expo-router-mastery' and 'ui-ux-anti-slop' that transitions from transparent to a frosted glass blur backdrop with a crisp border separator as the user scrolls down the catalog.
  ```

---

## 🚀 2. Interactive & Working Complex Components

### Expandable Floating Action Speed-Dial (`FloatingAdminActions`)
```text
Enhance FloatingAdminActions.tsx using 'component-crafting' and 'mobile-touch-haptics-gestures':
- Add a smooth spring animation when opening/closing the speed dial
- Provide 3 quick-action sub-buttons: "Tambah Stok Garam", "Kirim Broadcast Notifikasi", and "Export Laporan PDF"
- Include backdrop dimming with blur
- Trigger light haptic feedback on each item press
- Ensure full keyboard & accessibility navigation
```

### Bottom Sheet Filter & Multi-Criteria Sorting
```text
Build an interactive filter drawer using 'component-crafting' with:
- Pill-based single & multi-select chips (Status: Menunggu, Diproses, Dikirim; Kategori: Garam Halus, Garam Kasar, Industri)
- Dual-thumb price range slider with real-time Rupiah label updates
- "Reset" and "Terapkan Filter" action buttons pinned to the bottom with safe area insets
- Smooth swipe-to-dismiss gesture using react-native-gesture-handler
```

---

## 📦 3. Interactive Product Catalog & Live Stock Visualizer

### Stock Status Visualizer Card (`StockBanner.tsx` / Product Card)
```text
Use 'ui-ux-anti-slop' and 'interactive-visualization' to revamp our Salt Product Card:
- Include high-res product preview with a subtle gradient overlay
- Live Stock Bar with dynamic color coding (Green >50%, Amber 20-50%, Ruby Red <20% with pulse glow "Sisa Sedikit!")
- Stepper counter (+ / - buttons) with tactile bouncy feedback when incrementing quantity
- Price tier indicator (Harga Eceran vs Harga Grosir >100 sak)
- Smooth "Tambah ke Keranjang" button that transforms into a checkmark upon adding
```

### Interactive Cart with Swipe-to-Delete
```text
Build a full-featured cart interface in app/(buyer)/cart.tsx using 'component-crafting' and 'mobile-touch-haptics-gestures':
- Swipe left on any item to reveal a red trash action with haptic confirmation
- Real-time order summary calculation (Subtotal, Pajak/PPN, Ongkir berdasarkan radius, Total Bayar)
- Sticky bottom checkout bar with safe-area insets and glowing "Lanjut ke Pembayaran" button
```

---

## 🚚 4. Animated Order Tracking & Status Stepper

### Real-Time Live Order Pipeline Stepper
```text
Use 'interactive-visualization' and 'firestore-realtime-engine' to build a real-time order tracking timeline in app/(buyer)/orders/[id].tsx:
- 4-Stage Stepper: (1) Menunggu Konfirmasi -> (2) Pembayaran Terverifikasi -> (3) Truk Pengiriman OTW -> (4) Pesanan Selesai
- Active stage pulses with an emerald glowing beacon animation
- Timestamp and driver/admin note cards connected by a vertical gradient progression line
- "Hubungi Admin / Driver" instant floating action button
```

---

## 📝 5. Zero-Slop Forms, Inputs & Tactile Validation

### Polished Login & Register Screen (`app/(auth)/login.tsx`)
```text
Redesign app/(auth)/login.tsx using 'ui-ux-anti-slop' and 'frontend-design-system':
- Elegant branding header with SaltDistribute logo and welcome typography
- Floating label input fields with focus highlight glow and animated icons (Email, Password with show/hide toggle)
- Real-time inline field validation (error text with slide-down animation)
- "Masuk sebagai Tenant / Pembeli" vs "Masuk sebagai Admin / Seller" role switcher tabs
- Tactile loading state on submit button with spinner and disabled pulse
```

### Guest Order Quick-Checkout Modal (`GuestOrderModal.tsx`)
```text
Use 'component-crafting' to overhaul GuestOrderModal.tsx:
- Compact, friction-free 3-step checkout flow (Kontak -> Alamat Pengiriman -> Pembayaran)
- Auto-fill address suggestions using 'google-maps-platform'
- Bank transfer proof upload box with drag-and-drop zone, file preview thumbnail, and progress bar
```

---

## ⚡ 6. Skeleton Loaders, Micro-Animations & Empty States

### Shimmer Skeleton Placeholders
```text
Create beautiful shimmer skeleton loaders using 'ui-ux-anti-slop' to replace all generic activity indicators:
- Wave shimmer effect over card shapes, text bars, and avatar circles while fetching Firestore data
- Zero layout shift (CLS = 0) when transitioning from skeleton to rendered data
```

### Delightful Empty States & Error Banners
```text
Design engaging, context-aware empty states using 'ui-ux-anti-slop':
- "Belum Ada Pesanan" empty state with custom vector illustration, helpful onboarding description, and "Mulai Belanja Sekarang" CTA button
- "Koneksi Offline" banner with animated retry button and offline cache indicator
```

---

## 🖥️ 7. Responsive Master-Detail Layouts (Mobile & Desktop Web)

### Split Screen Adaptive Layout
```text
Use 'expo-router-mastery' and 'component-crafting' to create a responsive layout for order management:
- On Mobile: Compact stacked list with detail view opening in a full-screen transition
- On Tablet / Desktop Web: Adaptive 2-pane Master-Detail view (Left: Searchable Order List; Right: Pinned Order Detail, Live Chat thread, and Invoice Breakdown)
```
