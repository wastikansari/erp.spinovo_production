'use client';

import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  permission: NotificationPermission;
  onGranted: () => void;
  onDismiss: () => void;
}

export default function NotificationPermissionPrompt({ permission, onGranted, onDismiss }: Props) {
  const handleAllow = async () => {
    const result = await Notification.requestPermission();
    if (result === 'granted') onGranted();
  };

  if (permission === 'denied') {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
        <div className="mx-4 rounded-lg border bg-background shadow-lg p-4">
          <div className="flex items-start gap-3">
            <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Notifications blocked</p>
              <p className="mt-1 text-xs text-muted-foreground">
                To receive order alerts, enable notifications for this site:
              </p>
              <ol className="mt-2 text-xs text-muted-foreground list-decimal list-inside space-y-1">
                <li>Click the <strong>lock / info icon</strong> in the Chrome address bar</li>
                <li>Set <strong>Notifications</strong> to <strong>Allow</strong></li>
                <li>Refresh the page</li>
              </ol>
            </div>
            <button onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
      <div className="mx-4 rounded-lg border bg-background shadow-lg p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Enable notifications</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Allow notifications to receive real-time order and delivery alerts.
            </p>
          </div>
          <button onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Not now
          </Button>
          <Button size="sm" onClick={handleAllow}>
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
