/**
 * SaltDistribute - Update & Seed Inventory to Cloud Firestore Native Database
 * Project ID: saltdistribute-2026
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load Service Account JSON
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '..', 'saltdistribute-2026-firebase-adminsdk-fbsvc-889f29ee3e.json');

if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
  console.error('[Error] Service Account key not found at:', SERVICE_ACCOUNT_FILE);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

/**
 * Generate Google OAuth2 Access Token from Service Account using JWT
 */
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    const claimSet = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64UrlClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const signInput = `${base64UrlHeader}.${base64UrlClaimSet}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signInput);
    const signature = signer.sign(serviceAccount.private_key, 'base64url');

    const jwt = `${signInput}.${signature}`;

    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            reject(new Error(parsed.error_description || parsed.error || data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Convert JavaScript Object to Firestore REST API value format
 */
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDocument(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

/**
 * Upsert Firestore Document via REST API
 */
async function setFirestoreDoc(accessToken, collectionName, documentId, data) {
  const projectId = serviceAccount.project_id;
  const docPath = `projects/${projectId}/databases/(default)/documents/${collectionName}/${documentId}`;
  const url = `https://firestore.googleapis.com/v1/${docPath}`;

  const docPayload = toFirestoreDocument(data);
  const postBody = JSON.stringify(docPayload);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let resData = '';
      res.on('data', (chunk) => (resData += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Firestore Error (${res.statusCode}): ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Invalid response: ${resData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

// Data definitions
const INVENTORY_DATA = {
  inventoryId: "item_a_stock_main",
  productName: "Refined Pure High-Grade Special Salt (99.2% Purity)",
  productGrade: "NaCl 99.2% High Purity (ISO/Halal Certified)",
  productDescription: "Refined Pure High-Grade Special Salt dengan tingkat kemurnian NaCl 99.2% (ISO/Halal Certified). Tersedia dalam kemasan higienis vakum kedap udara.",
  isStockAvailable: true,
  availableQuantityGram: 500.0,
  basePricePerGram: 800000,
  lowStockThresholdGram: 100.0,
  maxPurchaseGram: 5.0,
  promoBannerText: "✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000 (Max purchase: 5.0g per order)",
  updatedAt: new Date().toISOString(),
  unitTiers: [
    { id: "tier_0_5g", name: "Mini Pouch", quantityGram: 0.5, label: "0.5 g", discountPercent: 0 },
    { id: "tier_1g", name: "Standard Gram", quantityGram: 1.0, label: "1.0 g", discountPercent: 0, isPopular: true },
    { id: "tier_2g", name: "Double Pack", quantityGram: 2.0, label: "2.0 g", discountPercent: 0 },
    { id: "tier_3g", name: "Triple Pack", quantityGram: 3.0, label: "3.0 g", discountPercent: 0 },
    { id: "tier_5g", name: "Max 5 Gram Vault", quantityGram: 5.0, label: "5.0 g", discountPercent: 0, isPopular: true },
  ],
  deliveryOptions: [
    { type: "COD", label: "Self Pickup (Warehouse Belawan - COD)", fee: 0 },
    {
      type: "DELIVERY",
      label: "Direct Dispatch Delivery",
      fee: 25000,
      deliveryZones: [
        { zoneName: "Medan Kota & Sekitarnya", fee: 25000 },
        { zoneName: "KIM 1 / 2 / 3 & Belawan", fee: 35000 },
        { zoneName: "Deli Serdang & Binjai", fee: 50000 },
        { zoneName: "Luar Kota Express", fee: 75000 },
      ],
    },
  ]
};

const STORE_SETTINGS_DATA = {
  storeName: "SaltDistribute Belawan Hub",
  sellerName: "Hendra (Official Dispatcher)",
  sellerPhone: "6281234567890",
  storeBio: "Official Wholesale & Industrial-Grade Refined Salt Distribution Hub Medan & North Sumatra.",
  operatingHours: "08:00 - 21:00 WIB (Setiap Hari)",
  bannerText: "✨ Official Rate: 0.5g = Rp 400.000 | 1.0g = Rp 800.000 (Max purchase: 5.0g per order)",
  warehouseAddress: "Jl. Pelabuhan Raya No. 12, Bagan Deli, Medan Belawan, Sumatera Utara",
  warehouseLatitude: 3.5952,
  warehouseLongitude: 98.6722,
  bankName: "Bank Central Asia (BCA)",
  bankAccountNumber: "800-1234-5678",
  bankAccountHolder: "PT Garam Nusantara",
  qrisUrl: "",
  paymentInstructions: "Silakan transfer nominal pas ke rekening BCA 800-1234-5678 a/n PT Garam Nusantara dan upload bukti struk.",
  requirePaymentProof: true,
  orderExpirationHours: 24,
  maxPurchaseGram: 5.0,
  lowStockThresholdGram: 100.0,
  productDescription: "Refined Pure High-Grade Special Salt dengan tingkat kemurnian NaCl 99.2% (ISO/Halal Certified). Tersedia dalam kemasan higienis vakum kedap udara.",
  productGrade: "NaCl 99.2% High Purity (ISO/Halal Certified)",
  updatedAt: new Date().toISOString()
};

const MEETING_POINTS_DATA = {
  points: [
    {
      id: "mp_device_seller",
      name: "Titik Langsung Lokasi Penjual (COD di Lokasi)",
      address: "Lokasi GPS Penjual / Toko",
      lat: 3.5952,
      lng: 98.6722,
      distanceFromHubKm: 0.0,
      operatingHours: "08:00 - 21:00 WIB",
      securityNote: "Lokasi Terverifikasi Penjual",
      isPopular: true,
    },
    {
      id: "mp_belawan_pos1",
      name: "Gerbang Pos 1 Pelabuhan Belawan",
      address: "Jl. Pelabuhan Raya, Medan Belawan",
      lat: 3.7791,
      lng: 98.6812,
      distanceFromHubKm: 2.2,
      operatingHours: "08:00 - 20:00 WIB",
      securityNote: "24/7 Port Security Checkpoint",
      isPopular: true,
    },
    {
      id: "mp_tol_belmera_km5",
      name: "Rest Area Tol Belmera KM 5 (Pintu Masuk)",
      address: "Tol Belawan - Medan - Tanjung Morawa KM 5",
      lat: 3.7420,
      lng: 98.6750,
      distanceFromHubKm: 4.8,
      operatingHours: "07:00 - 22:00 WIB",
      securityNote: "Secure Highway Service Area & CCTV",
      isPopular: true,
    },
    {
      id: "mp_kim2_plaza",
      name: "Plaza Kawasan Industri Medan 2 (KIM 2)",
      address: "Jl. Pulau Irian, Percut Sei Tuan",
      lat: 3.7042,
      lng: 98.6912,
      distanceFromHubKm: 8.5,
      operatingHours: "08:00 - 18:00 WIB",
      securityNote: "Industrial Zone Gate 2",
      isPopular: false,
    },
    {
      id: "mp_medan_kota_merdeka",
      name: "Titik Temu Lapangan Merdeka (Stasiun Besar)",
      address: "Jl. Balai Kota No. 1, Kesawan, Medan Kota",
      lat: 3.5925,
      lng: 98.6781,
      distanceFromHubKm: 1.5,
      operatingHours: "09:00 - 21:00 WIB",
      securityNote: "Central City Commercial Point",
      isPopular: true,
    },
  ],
  updatedAt: new Date().toISOString()
};

async function main() {
  console.log("🚀 [SaltDistribute] Updating Firestore Native Database...");
  console.log(`📦 Project: ${serviceAccount.project_id}`);

  try {
    console.log("🔑 Authenticating with Google Cloud Firestore...");
    const accessToken = await getAccessToken();
    console.log("✅ Authenticated successfully.\n");

    // 1. Update /inventory/salt_stock
    console.log("📦 Updating /inventory/salt_stock document...");
    const resInventory = await setFirestoreDoc(accessToken, "inventory", "salt_stock", INVENTORY_DATA);
    console.log("✅ Inventory updated:", resInventory.name);

    // 2. Update /store_settings/settings
    console.log("⚙️  Updating /store_settings/settings document...");
    const resSettings = await setFirestoreDoc(accessToken, "store_settings", "settings", STORE_SETTINGS_DATA);
    console.log("✅ Store settings updated:", resSettings.name);

    // 3. Update /meeting_points/points
    console.log("📍 Updating /meeting_points/points document...");
    const resPoints = await setFirestoreDoc(accessToken, "meeting_points", "points", MEETING_POINTS_DATA);
    console.log("✅ Meeting points updated:", resPoints.name);

    console.log("\n🎉 [SUCCESS] Database Inventory, Settings & Meeting Points updated successfully in Cloud Firestore Native!");
  } catch (err) {
    console.error("\n❌ [ERROR] Failed to update Firestore database:", err.message || err);
    process.exit(1);
  }
}

main();
