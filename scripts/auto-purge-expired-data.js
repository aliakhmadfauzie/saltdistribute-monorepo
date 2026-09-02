/**
 * SaltDistribute - Automated Data Retention & Auto-Purge Service
 * 
 * Policy:
 * 1. Notifications older than 24 hours (24h) -> Auto Deleted
 * 2. Chat messages older than 30 days (30d) -> Auto Deleted
 * 
 * Usage:
 *   node scripts/auto-purge-expired-data.js
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

function fetchJson(url, token, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode === 204 || data.length === 0) {
            resolve({});
          } else {
            const parsed = JSON.parse(data);
            resolve(parsed);
          }
        } catch (e) {
          resolve({});
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function deleteFirestoreDoc(token, docPath) {
  const url = `https://firestore.googleapis.com/v1/${docPath}`;
  return fetchJson(url, token, { method: 'DELETE' });
}

async function purgeExpiredNotifications(token) {
  console.log('🔔 [1/2] Checking Expired Notifications (> 24 Hours)...');
  const projectId = serviceAccount.project_id;
  const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/notifications?pageSize=100`;

  const res = await fetchJson(listUrl, token);
  const docs = res.documents || [];
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24h ago

  let deletedCount = 0;
  for (const doc of docs) {
    const timestamp = doc.fields?.timestamp?.integerValue 
      ? Number(doc.fields.timestamp.integerValue)
      : (doc.fields?.timestamp?.doubleValue ? Number(doc.fields.timestamp.doubleValue) : 0);

    const createdAtStr = doc.fields?.createdAt?.stringValue;
    const createdAtTime = createdAtStr ? new Date(createdAtStr).getTime() : 0;
    const effectiveTime = timestamp || createdAtTime;

    if (effectiveTime > 0 && effectiveTime < cutoffTime) {
      console.log(`   🗑️ Deleting expired notification: ${doc.name.split('/').pop()} (Age: ${Math.round((Date.now() - effectiveTime) / 3600000)}h)`);
      await deleteFirestoreDoc(token, doc.name);
      deletedCount++;
    }
  }

  console.log(`✅ Notifications Auto-Purge Complete: ${deletedCount} deleted (Remaining: ${docs.length - deletedCount})\n`);
}

async function purgeExpiredChats(token) {
  console.log('💬 [2/2] Checking Expired Chat Messages (> 30 Days)...');
  const projectId = serviceAccount.project_id;
  const bookingsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/bookings?pageSize=100`;

  const res = await fetchJson(bookingsUrl, token);
  const bookings = res.documents || [];
  const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

  let deletedCount = 0;
  for (const booking of bookings) {
    const bookingId = booking.name.split('/').pop();
    const chatMessagesUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chats/${bookingId}/messages?pageSize=100`;
    
    const messagesRes = await fetchJson(chatMessagesUrl, token);
    const messages = messagesRes.documents || [];

    for (const msg of messages) {
      const timestampStr = msg.fields?.timestamp?.stringValue;
      const timestamp = timestampStr ? new Date(timestampStr).getTime() : 0;

      if (timestamp > 0 && timestamp < cutoffTime) {
        console.log(`   🗑️ Deleting expired chat in booking ${bookingId}: ${msg.name.split('/').pop()} (Age: ${Math.round((Date.now() - timestamp) / 86400000)} days)`);
        await deleteFirestoreDoc(token, msg.name);
        deletedCount++;
      }
    }
  }

  console.log(`✅ Chat Messages Auto-Purge Complete: ${deletedCount} deleted.\n`);
}

async function runAutoPurge() {
  console.log('================================================================');
  console.log('🚀 SaltDistribute - Automated Data Retention Routine');
  console.log(`📦 Project: ${serviceAccount.project_id}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  try {
    const token = await getAccessToken();
    await purgeExpiredNotifications(token);
    await purgeExpiredChats(token);
    console.log('🎉 [SUCCESS] Auto-purge routine finished successfully!');
  } catch (error) {
    console.error('❌ [ERROR] Auto-purge routine failed:', error.message || error);
    process.exit(1);
  }
}

runAutoPurge();
