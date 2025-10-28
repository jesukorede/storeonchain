import admin from 'firebase-admin'

let initialized = false

function init() {
  if (initialized) return
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (json) {
    const creds = JSON.parse(json)
    admin.initializeApp({
      credential: admin.credential.cert(creds as admin.ServiceAccount),
    })
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
    admin.initializeApp()
  }
  initialized = true
}

init()

export const adminAuth = admin.auth()
