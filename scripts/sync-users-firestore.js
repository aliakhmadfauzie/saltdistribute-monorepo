/**
 * SaltDistribute - Sync Initial Users to Cloud Firestore
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

function setFirestoreDoc(accessToken, collectionName, documentId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents/${collectionName}/${documentId}`;
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

const USERS = [
  {
    userId: "usr_admin_001",
    username: "admin_jaya",
    password: "admin123",
    name: "Hendra Wijaya (Owner)",
    phoneNumber: "+628123456789",
    email: "admin@saltdistribute.id",
    role: "admin",
    status: "active",
    companyName: "PT SaltDistribute Indonesia",
    latitude: 3.7844,
    longitude: 98.6833,
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    userId: "usr_buyer_001",
    username: "client_jaya",
    password: "buyer123",
    name: "Budi Santoso",
    phoneNumber: "+628198765432",
    email: "buyer@saltdistribute.id",
    role: "buyer",
    status: "active",
    companyName: "PT Jaya Mandiri Pangan",
    address: "Jl. Industri Belawan No. 45, Medan",
    latitude: 3.7745,
    longitude: 98.681,
    deliveryZone: "KIM 1 / 2 / 3 & Belawan",
    createdAt: "2026-08-15T00:00:00Z"
  },
  {
    userId: "usr_buyer_002",
    username: "dapur_lestari",
    password: "siti123",
    name: "Siti Rahma",
    phoneNumber: "+628135557890",
    email: "siti@dapurlestari.co.id",
    role: "buyer",
    status: "active",
    companyName: "CV Dapur Lestari Utama",
    address: "Kawasan Industri Medan (KIM 2), Deli Serdang",
    latitude: 3.7042,
    longitude: 98.6912,
    deliveryZone: "KIM 1 / 2 / 3 & Belawan",
    createdAt: "2026-08-20T00:00:00Z"
  }
];

async function run() {
  console.log('🚀 Syncing initial users to Firestore...');
  const token = await getAccessToken();
  for (const user of USERS) {
    await setFirestoreDoc(token, 'users', user.userId, user);
    console.log(`✅ Synced user: ${user.username} (${user.role})`);
  }
  console.log('🎉 Users synced successfully!');
}

run().catch(console.error);
