'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { getFCMToken } from '@/hooks/useFCM';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifData = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => { console.log('🔔 FCM Token:', getFCMToken()); setOpen((o) => !o); }}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {notifData.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {notifData.unreadCount > 99 ? '99+' : notifData.unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <NotificationDropdown
          {...notifData}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
