import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging as firebaseGetMessaging, Messaging } from 'firebase/messaging';

// Firebase Web config is public by design — access is controlled by Firebase security rules.
// Fallbacks ensure messaging works even when NEXT_PUBLIC_* env vars are not set at build time.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyAUhwXHGIVVu3MfIhf5lDrd9hZde-pjVI4',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'spinovo-customer-app.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'spinovo-customer-app',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'spinovo-customer-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '673804462989',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '1:673804462989:web:89f4f01b8f0172ebdcebc4',
};

function getApp(): FirebaseApp {
  return getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    return firebaseGetMessaging(getApp());
  } catch (err) {
    console.error('🔔 [Firebase] getMessaging error:', err);
    return null;
  }
}
