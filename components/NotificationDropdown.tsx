'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Notification, UseNotificationsReturn } from '@/hooks/useNotifications';

const borderColors: Record<Notification['type'], string> = {
  customer_registered: 'border-l-blue-500',
  order_created: 'border-l-green-500',
  payment_completed: 'border-l-purple-500',
  order_cancelled: 'border-l-red-500',
};

function getNavPath(n: Notification): string {
  if (n.referenceType === 'consumer') {
    return `/dashboard/customers?id=${n.referenceId}`;
  }
  return `/dashboard/orders?id=${n.referenceId}`;
}

interface NotificationDropdownProps extends UseNotificationsReturn {
  onClose: () => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const handleRowClick = async (n: Notification) => {
    if (!n.isRead) await markAsRead(n._id);
    onClose();
    router.push(getNavPath(n));
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`group relative flex items-start gap-2 border-l-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${borderColors[n.type]} ${!n.isRead ? 'bg-muted/30' : ''}`}
              onClick={() => handleRowClick(n)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button
                className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n._id);
                }}
                aria-label="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t px-4 py-2 text-center">
        <Link
          href="/dashboard/notifications"
          className="text-xs text-primary hover:underline"
          onClick={onClose}
        >
          See all notifications
        </Link>
      </div>
    </div>
  );
}
