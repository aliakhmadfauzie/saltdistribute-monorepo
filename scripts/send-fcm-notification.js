/**
 * SaltDistribute - Firebase Cloud Messaging (FCM) Push Notification Dispatcher
 * 
 * Usage:
 *   node scripts/send-fcm-notification.js --title "Pesanan Baru" --body "Pesanan #SD-102 siap diproses"
 *   node scripts/send-fcm-notification.js --token "<DEVICE_TOKEN>" --title "Update Status" --body "Pesanan dalam perjalanan"
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
 * Generate Google OAuth2 Access Token from Service Account using JWT (No external npm packages needed)
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
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
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
 * Send FCM v1 Push Notification
 */
async function sendFCMMessage(accessToken, { token, topic, title, body, data }) {
  const projectId = serviceAccount.project_id;
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const messagePayload = {
    message: {
      notification: {
        title: title || "Pemberitahuan SaltDistribute",
        body: body || "Ada pembaruan status baru."
      },
      data: data || {
        click_action: "/",
        timestamp: String(Date.now())
      },
      webpush: {
        fcm_options: {
          link: (data && data.url) || "/"
        },
        notification: {
          icon: "/favicon.ico",
          badge: "/favicon.ico"
        }
      }
    }
  };

  if (token) {
    messagePayload.message.token = token;
  } else if (topic) {
    messagePayload.message.topic = topic;
  } else {
    // Default to topic broadcast for all users
    messagePayload.message.topic = "all_users";
  }

  const postBody = JSON.stringify(messagePayload);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; UTF-8',
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
            reject(new Error(`FCM API Error (${res.statusCode}): ${JSON.stringify(parsed)}`));
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

// Parse Command Line Arguments
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const title = getArg('--title') || 'SaltDistribute Cloud Messaging';
  const body = getArg('--body') || 'Notifikasi pesanan real-time aktif.';
  const token = getArg('--token');
  const topic = getArg('--topic') || (!token ? 'all_users' : undefined);

  console.log('🚀 [SaltDistribute FCM] Initializing Cloud Messaging...');
  console.log(`📦 Project ID: ${serviceAccount.project_id}`);
  console.log(`🎯 Target: ${token ? `Token (${token.substring(0, 15)}...)` : `Topic: ${topic}`}`);
  console.log(`📝 Title: "${title}"`);
  console.log(`💬 Body: "${body}"\n`);

  try {
    console.log('🔑 Generating Google OAuth2 Access Token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access Token generated successfully.');

    console.log('📤 Sending FCM v1 message...');
    const result = await sendFCMMessage(accessToken, {
      token,
      topic,
      title,
      body,
      data: {
        url: '/',
        type: 'ORDER_STATUS',
        timestamp: String(Date.now())
      }
    });

    console.log('\n🎉 [Success] FCM Message Sent Successfully!');
    console.log('Response Details:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ [Error] Failed to send FCM message:', error.message || error);
    process.exit(1);
  }
}

main();
