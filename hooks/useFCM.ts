'use client';

import { useEffect, useRef } from 'react';
import { register, onRegistered, onUnregistered, onMessage, unregister, MessagePayload } from 'firebase/messaging';
import { getMessaging } from '@/lib/firebase';
import { AuthService } from '@/lib/auth';

const FCM_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.spinovo.in/api/v1/admin';
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  || 'BHktXl20xhuxVNNL5eI0RwrjSQSTcIVLWY3q65VyivZRHdEuvwUCaiuvpciI3-2TXuosNN1pI6xl_nHu4OJ-jto';

let _fcmToken: string | null = null;
export const getFCMToken = () => _fcmToken;

// Called from logout to cleanly deregister this device from FCM
export async function unregisterFCM(): Promise<void> {
  const messaging = getMessaging();
  if (!messaging) return;
  try {
    await unregister(messaging);
  } catch {
    // best-effort — backend token removal still happens in onUnregistered
  }
}

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as any).__fcmDiag = async () => {
    console.group('🔔 FCM Diagnostics');
    console.log('Notification API:', 'Notification' in window ? 'supported' : 'NOT supported');
    console.log('Permission:', Notification.permission);
    console.log('ServiceWorker API:', 'serviceWorker' in navigator ? 'supported' : 'NOT supported');
    console.log('Cached FCM token (FID):', _fcmToken ? `${_fcmToken.slice(0, 30)}...` : 'none');
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
  const swRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const callbackRef = useRef(onForegroundMessage);
  callbackRef.current = onForegroundMessage;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const cleanupFns: Array<() => void> = [];

    const init = async () => {
      try {
        if (Notification.permission !== 'granted') {
          return;
        }

        const messaging = getMessaging();
        if (!messaging) return;

        let swRegistration: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none',
          });
          await reg.update();
          swRegistration = await navigator.serviceWorker.ready;
          swRef.current = swRegistration;
        }

        // onRegistered fires when Firebase assigns/refreshes the FID-based token
        const unsubRegistered = onRegistered(messaging, async (fid) => {
          _fcmToken = fid;
          if (process.env.NODE_ENV !== 'production') {
            (window as any).__fcmToken = fid;
          }

          const authToken = AuthService.getToken();
          if (authToken) {
            await fetch(`${FCM_API_BASE}/fcm/register-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ token: fid, deviceType: 'web' }),
            }).catch(() => null);
          }
        });
        cleanupFns.push(unsubRegistered);

        // onUnregistered fires when unregister() is called (e.g. on logout)
        const unsubUnregistered = onUnregistered(messaging, (fid) => {
          _fcmToken = null;
          const authToken = AuthService.getToken();
          if (authToken) {
            fetch(`${FCM_API_BASE}/fcm/remove-token`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ token: fid }),
            }).catch(() => {});
          }
        });
        cleanupFns.push(unsubUnregistered);

        // Foreground message handler
        const unsubMessage = onMessage(messaging, (payload) => {
          const title = payload.notification?.title || payload.data?.title || 'New Notification';
          const body = payload.notification?.body || payload.data?.body || '';
          if (swRef.current) {
            swRef.current.showNotification(title, { body });
          } else if (Notification.permission === 'granted') {
            new Notification(title, { body });
          }
          callbackRef.current(payload);
        });
        cleanupFns.push(unsubMessage);

        // Initiate registration — triggers onRegistered callback with the FID token
        await register(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });

      } catch {
        // FCM init failure is non-fatal — notifications won't work but the app continues
      }
    };

    init();

    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [enabled]);
}
