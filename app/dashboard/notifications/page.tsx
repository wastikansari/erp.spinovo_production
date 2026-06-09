'use client';

import { useRouter } from 'next/navigation';
import { Bell, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const borderColors: Record<Notification['type'], string> = {
  customer_registered: 'border-l-blue-500',
  order_created: 'border-l-green-500',
  payment_completed: 'border-l-purple-500',
  order_cancelled: 'border-l-red-500',
};

function getNavPath(n: Notification): string {
  if (n.referenceType === 'consumer') return `/dashboard/customers?id=${n.referenceId}`;
  return `/dashboard/orders?id=${n.referenceId}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  } = useNotifications();

  const handleRowClick = async (n: Notification) => {
    if (!n.isRead) await markAsRead(n._id);
    router.push(getNavPath(n));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-semibold text-muted-foreground">No notifications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When something happens, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`group flex items-start gap-4 rounded-lg border border-l-4 bg-card px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${borderColors[n.type]} ${!n.isRead ? 'bg-muted/20' : ''}`}
              onClick={() => handleRowClick(n)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button
                className="mt-0.5 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n._id);
                }}
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-primary" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
