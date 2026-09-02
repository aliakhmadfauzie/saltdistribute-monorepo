/**
 * SaltDistribute - Seed All Collections & Documents to Cloud Firestore
 * Project: saltdistribute-2026
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const SERVICE_ACCOUNT_FILE = path.join(__dirname, '..', 'saltdistribute-2026-firebase-adminsdk-fbsvc-889f29ee3e.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    const signInput = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(claimSet)).toString('base64url')}`;
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
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error(parsed.error || data));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function setFirestoreDoc(accessToken, docPath, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/${docPath}`;
  const postBody = JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)])) });

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
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(resData));
        else reject(new Error(resData));
      });
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });
}

// Sample Bookings
const BOOKINGS = [
  {
    docPath: 'bookings/BK-20260830-001',
    data: {
      bookingId: "BK-20260830-001",
      buyerId: "usr_buyer_001",
      buyerName: "Budi Santoso (PT Jaya Mandiri Pangan)",
      buyerPhone: "+628198765432",
      quantityGram: 1.0,
      packageLabel: "1.0 g",
      pricePerGram: 800000,
      baseSubtotal: 800000,
      discountAmount: 0,
      deliveryFee: 25000,
      deliveryOptionType: "DELIVERY",
      deliveryZoneName: "KIM 1 / 2 / 3 & Belawan",
      grandTotal: 825000,
      status: "COMPLETED",
      paymentMethod: "BANK_TRANSFER",
      pickupMethod: "DIRECT_DELIVERY",
      meetingPointId: "mp_belawan_pos1",
      meetingPointName: "Gerbang Pos 1 Pelabuhan Belawan",
      meetingPointAddress: "Jl. Pelabuhan Raya, Medan Belawan",
      notes: "Kirim sebelum jam 14:00 WIB",
      createdAt: "2026-08-30T10:00:00Z",
      confirmedAt: "2026-08-30T10:15:00Z",
      completedAt: "2026-08-30T13:30:00Z",
    }
  },
  {
    docPath: 'bookings/BK-20260831-002',
    data: {
      bookingId: "BK-20260831-002",
      buyerId: "usr_buyer_002",
      buyerName: "Siti Rahma (CV Dapur Lestari)",
      buyerPhone: "+628135557890",
      quantityGram: 2.0,
      packageLabel: "2.0 g",
      pricePerGram: 800000,
      baseSubtotal: 1600000,
      discountAmount: 0,
      deliveryFee: 0,
      deliveryOptionType: "COD",
      grandTotal: 1600000,
      status: "CONFIRMED_DELIVERING",
      paymentMethod: "COD",
      pickupMethod: "COD_MEETING_POINT",
      meetingPointId: "mp_kim2_plaza",
      meetingPointName: "Plaza Kawasan Industri Medan 2 (KIM 2)",
      meetingPointAddress: "Jl. Pulau Irian, Percut Sei Tuan",
      notes: "Ketemu di depan parkir utama",
      createdAt: "2026-08-31T09:00:00Z",
      confirmedAt: "2026-08-31T09:20:00Z",
    }
  },
  {
    docPath: 'bookings/BK-20260901-003',
    data: {
      bookingId: "BK-20260901-003",
      buyerId: "usr_buyer_001",
      buyerName: "Budi Santoso",
      buyerPhone: "+628198765432",
      quantityGram: 0.5,
      packageLabel: "0.5 g",
      pricePerGram: 800000,
      baseSubtotal: 400000,
      discountAmount: 0,
      deliveryFee: 25000,
      deliveryOptionType: "DELIVERY",
      deliveryZoneName: "Medan Kota & Sekitarnya",
      grandTotal: 425000,
      status: "PENDING_CONFIRMATION",
      paymentMethod: "BANK_TRANSFER",
      pickupMethod: "DIRECT_DELIVERY",
      createdAt: "2026-09-01T06:00:00Z",
    }
  }
];

// Sample Chats subcollection
const CHAT_MESSAGES = [
  {
    docPath: 'chats/BK-20260830-001/messages/msg_001',
    data: {
      id: "msg_001",
      senderId: "usr_buyer_001",
      senderName: "Budi Santoso",
      senderRole: "buyer",
      text: "Halo Admin, pesanan 1.0g garam industri sudah saya bayar via transfer BCA ya.",
      timestamp: "2026-08-30T10:05:00Z"
    }
  },
  {
    docPath: 'chats/BK-20260830-001/messages/msg_002',
    data: {
      id: "msg_002",
      senderId: "usr_admin_001",
      senderName: "Admin Hendra",
      senderRole: "admin",
      text: "Baik Pak Budi, pembayaran sudah kami verifikasi. Kurir segera berangkat menuju lokasi.",
      timestamp: "2026-08-30T10:15:00Z"
    }
  }
];

// Sample Device Token
const DEVICE_TOKENS = [
  {
    docPath: 'device_tokens/token_web_admin_001',
    data: {
      token: "fcm_token_admin_sample_device_string_99812",
      userId: "usr_admin_001",
      userRole: "admin",
      platform: "web",
      updatedAt: new Date().toISOString()
    }
  },
  {
    docPath: 'device_tokens/token_web_buyer_001',
    data: {
      token: "fcm_token_buyer_sample_device_string_12345",
      userId: "usr_buyer_001",
      userRole: "buyer",
      platform: "web",
      updatedAt: new Date().toISOString()
    }
  }
];

async function seedAll() {
  console.log('🚀 Seeding ALL collections to Cloud Firestore (saltdistribute-2026)...');
  const token = await getAccessToken();

  // 1. Seed Bookings
  console.log('\n📦 Seeding /bookings collection...');
  for (const b of BOOKINGS) {
    await setFirestoreDoc(token, b.docPath, b.data);
    console.log(`✅ Seeded: ${b.docPath}`);
  }

  // 2. Seed Chat Messages Subcollections
  console.log('\n💬 Seeding /chats subcollections...');
  for (const c of CHAT_MESSAGES) {
    await setFirestoreDoc(token, c.docPath, c.data);
    console.log(`✅ Seeded: ${c.docPath}`);
  }

  // 3. Seed Device Tokens
  console.log('\n🔔 Seeding /device_tokens collection...');
  for (const d of DEVICE_TOKENS) {
    await setFirestoreDoc(token, d.docPath, d.data);
    console.log(`✅ Seeded: ${d.docPath}`);
  }

  console.log('\n🎉 [COMPLETE] All collections (/inventory, /store_settings, /meeting_points, /users, /bookings, /chats, /device_tokens) now exist in Cloud Firestore!');
}

seedAll().catch(console.error);
