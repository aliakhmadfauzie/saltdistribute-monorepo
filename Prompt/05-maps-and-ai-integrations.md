# 🗺️ Maps Platform & Gemini AI Prompts

This guide contains prompts to call **`google_maps_platform`** and **`gemini-api`** (`gemini-api-dev`, `gemini-interactions-api`, `gemini-live-api-dev`, `gemini-omni-flash-api`).

---

## 1. Google Maps Platform (`google-maps-platform`)

### Common Prompts
```text
Please use the 'google-maps-platform' skill to implement address autocomplete and geocoding for buyer delivery locations.
```

### Specific Feature Prompts
* **Delivery Route Optimization & Distance Calculation:**
  ```text
  Using 'google-maps-platform', build a service that calculates estimated delivery distance and ETA between the central salt warehouse and buyer destination coordinates using the Routes API.
  ```
* **Interactive Map Pinning for Tenant Delivery:**
  ```text
  Create an interactive delivery location picker using 'google-maps-platform' with reverse geocoding to automatically populate street, district, and postal code.
  ```

---

## 2. Gemini API & Multimodal AI (`gemini-api-dev` / `gemini-interactions-api`)

### Common Prompts
```text
Please use the 'gemini-api-dev' skill to integrate Gemini 2.5/3.0 models for automated receipt parsing and order text extraction.
```

### Specific Feature Prompts
* **Payment Receipt OCR & Proof Verification:**
  ```text
  Using 'gemini-interactions-api' with structured JSON output, create a service that analyzes uploaded bank transfer receipts, extracts nominal amount, sender name, timestamp, and matches it with the target order ID.
  ```
* **AI Smart Assistant for Tenant Inquiries:**
  ```text
  Build an in-app AI customer assistant using 'gemini-api-dev' that answers questions about salt inventory grades (Halus, Kasar, Industri), current pricing tiers, and delivery status.
  ```

---

## 3. Gemini Live API & Audio/Multimodal (`gemini-live-api-dev`)

### Common Prompts
```text
Use the 'gemini-live-api-dev' skill to design a real-time voice-driven inventory logger for warehouse operators.
```

### Specific Feature Prompts
* **Voice-to-Order Entry:**
  ```text
  Using 'gemini-live-api-dev', implement real-time speech input parsing allowing warehouse staff to speak orders (e.g. "Catat pesanan 50 sak garam halus untuk Toko Berkah") and convert directly into a draft order.
  ```
