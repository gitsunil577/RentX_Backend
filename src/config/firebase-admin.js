import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// You can use either service account JSON file or individual environment variables

let firebaseApp;

try {
  // Option 1: Using service account key file (recommended for production)
  // Place your service account JSON file in the project root
  // Download it from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key

  // Option 2: Using environment variables (simpler for development)
  if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.warn('⚠️ Firebase Admin not initialized - missing environment variables');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
}

export const verifyGoogleToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
};

export default firebaseApp;
