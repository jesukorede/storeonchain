import admin = require('firebase-admin')

let initialized = false

function init() {
  if (initialized) return

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  let creds: any | null = null
  try {
    const raw = base64 ? Buffer.from(base64, 'base64').toString('utf8') : json
    if (raw) {
      creds = JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err)
  }

  if (creds && typeof creds.private_key === 'string') {
    // Normalize PEM newlines for consistent parsing across Node versions
    creds.private_key = creds.private_key
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim()

    admin.initializeApp({
      credential: admin.credential.cert(creds as admin.ServiceAccount),
    })
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or ADC
    admin.initializeApp()
  }

  initialized = true
}

init()

export const adminAuth = admin.auth()
