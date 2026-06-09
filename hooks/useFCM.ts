'use client';

import { useEffect, useRef } from 'react';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getMessaging } from '@/lib/firebase';
import { AuthService } from '@/lib/auth';

const FCM_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1/admin';

let _fcmToken: string | null = null;
export const getFCMToken = () => _fcmToken;

// Run window.__fcmDiag() in browser console for a full status report
if (typeof window !== 'undefined') {
  (window as any).__fcmDiag = async () => {
    console.group('🔔 FCM Diagnostics');
    console.log('Notification API:', 'Notification' in window ? 'supported' : 'NOT supported');
    console.log('Permission:', Notification.permission);
    console.log('ServiceWorker API:', 'serviceWorker' in navigator ? 'supported' : 'NOT supported');
    console.log('Cached FCM token:', _fcmToken ? `${_fcmToken.slice(0, 30)}...` : 'none');
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      console.log('Registered SWs:', regs.map(r => `${r.scope} [${r.active?.state ?? 'no active'}]`));
    }
    console.groupEnd();
  };
}

interface UseFCMProps {
  onForegroundMessage: (payload: MessagePayload) => void;
  enabled?: boolean;
}

export function useFCM({ onForegroundMessage, enabled = true }: UseFCMProps): void {
  const tokenRef = useRef<string | null>(null);
  const swRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const callbackRef = useRef(onForegroundMessage);
  callbackRef.current = onForegroundMessage;

  useEffect(() => {
    if (!enabled) return;
    console.warn('🔔🔔🔔 FCM useEffect STARTED');
    if (typeof window === 'undefined') { console.warn('🔔 [FCM] SSR - skipping'); return; }
    if (!('Notification' in window)) { console.warn('🔔 [FCM] No Notification API'); return; }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const permission = Notification.permission;
        console.log('🔔 [FCM] Permission state:', permission);
        if (permission !== 'granted') {
          console.warn('🔔 [FCM] Permission not granted — aborting FCM init');
          return;
        }

        const messaging = getMessaging();
        console.log('🔔 [FCM] Messaging instance:', messaging ? 'OK' : 'NULL');
        if (!messaging) return;

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        console.log('🔔 [FCM] VAPID key:', vapidKey ? `present (${vapidKey.slice(0, 10)}...)` : 'MISSING ⚠️');

        let swRegistration: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          // Always register fresh with updateViaCache:none so stale SW is replaced
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none',
          });
          await reg.update();

          swRegistration = await navigator.serviceWorker.ready;
          swRef.current = swRegistration;
          const swState = swRegistration.active?.state ?? 'unknown';
          console.log('🔔 [FCM] SW state:', swState, '| scope:', swRegistration.scope);
        }

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration,
        });

        console.log('🔔 [FCM] Token:', token ? `${token.slice(0, 20)}...` : 'EMPTY ⚠️');

        if (token) {
          tokenRef.current = token;
          _fcmToken = token;
          (window as any).__fcmToken = token;

          const authToken = AuthService.getToken();
          console.log('🔔 [FCM] Auth token for registration:', authToken ? 'present' : 'MISSING ⚠️');
          if (authToken) {
            const res = await fetch(`${FCM_API_BASE}/fcm/register-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ token, deviceType: 'web' }),
            });
            console.log('🔔 [FCM] Token registered with backend — status:', res.status);
          }

          unsubscribe = onMessage(messaging, (payload) => {
            console.log('🔔 [FCM] Foreground message received:', JSON.stringify(payload, null, 2));

            // Use service worker showNotification — works reliably on macOS + Chrome
            const title = payload.notification?.title || payload.data?.title || 'New Notification';
            const body = payload.notification?.body || payload.data?.body || '';
            if (swRef.current) {
              swRef.current.showNotification(title, { body });
            } else if (Notification.permission === 'granted') {
              new Notification(title, { body });
            }

            callbackRef.current(payload);
          });
          console.log('🔔 [FCM] Foreground listener registered ✅');
        }
      } catch (err) {
        console.error('🔔 [FCM] Init error:', err);
      }
    };

    init();

    return () => {
      unsubscribe?.();
      const savedToken = tokenRef.current;
      if (savedToken) {
        const authToken = AuthService.getToken();
        if (authToken) {
          fetch(`${FCM_API_BASE}/fcm/remove-token`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ token: savedToken }),
          }).catch(() => {});
        }
      }
    };
  }, [enabled]);
}
