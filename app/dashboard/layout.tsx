'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Package,
  Store,
  Wallet,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  CreditCard,
  MessageSquare,
  UserCog,
  UserCheck,
  MapPin,
  Bell,
  AlertTriangle,
  BarChart2,
  Clock,
  Timer,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthService } from '@/lib/auth';
import { useFCM, unregisterFCM } from '@/hooks/useFCM';
import NotificationBell from '@/components/NotificationBell';
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },

  { name: 'Orders', href: '/dashboard/orders', icon: Package },

  { name: 'Pickup Pending', href: '/dashboard/orders/pickup-pending', icon: UserCheck },
  { name: 'Pickup Assigned', href: '/dashboard/orders/pickup-assigned', icon: UserCheck },

  { name: 'Quality Check', href: '/dashboard/orders/quality-check/v2', icon: UserCheck },

  // { name: 'Quality Check', href: '/dashboard/orders/quality-check', icon: UserCheck },

  { name: 'Wash Pending', href: '/dashboard/orders/wash-pending', icon: UserCheck },
  { name: 'Ironing Pending', href: '/dashboard/orders/ironing-pending', icon: UserCheck },
  { name: 'Process Assigned (Inhouse)', href: '/dashboard/orders/process-assigned', icon: UserCheck },

  // ── Vendor order management ──
  { name: 'Vendor Orders', href: '/dashboard/orders/vendor-assigned', icon: Store },
  { name: 'Vendor Outward', href: '/dashboard/orders/vendor-outward', icon: Store },
  { name: 'Vendor Rejected', href: '/dashboard/orders/vendor-rejected', icon: AlertTriangle },
  { name: 'Overdue Orders', href: '/dashboard/orders/vendor-overdue', icon: Clock },
  { name: 'Vendor Inward', href: '/dashboard/orders/vendor-inward', icon: UserCheck },
  // { name: 'Ironing Pending', href: '/dashboard/orders/ironing-pending', icon: Timer },

  { name: 'Delivery Pending', href: '/dashboard/orders/delivery-pending', icon: UserCheck },
  { name: 'Cancel Order', href: '/dashboard/orders/cancel', icon: UserCheck },
  { name: 'Delivery Assigned', href: '/dashboard/orders/delivery-assigned', icon: UserCheck },
  { name: 'Delivered', href: '/dashboard/orders/delivery', icon: UserCheck },


  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'OTP Requests', href: '/dashboard/otp-requests', icon: MessageSquare },
  { name: 'Copilots', href: '/dashboard/copilots', icon: UserCog },
  { name: 'Vendors', href: '/dashboard/vendor', icon: Users },
  { name: 'Vendor Performance', href: '/dashboard/vendor/performance', icon: BarChart2 },
  { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
  { name: 'Package', href: '/dashboard/package', icon: Store },
  { name: 'Services', href: '/dashboard/services', icon: Wallet },
  { name: 'Service SLA', href: '/dashboard/settings/service-duration', icon: Timer },
  { name: 'Offers', href: '/dashboard/offers', icon: Wallet },
  { name: 'Get Export', href: '/dashboard/export', icon: FileDown },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifPromptDismissed, setNotifPromptDismissed] = useState(false);

  useFCM({ onForegroundMessage: (payload) => setToast(payload), enabled: !!user && notifPermission === 'granted' });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return;
    setNotifPermission(Notification.permission);
  }, [user]);

  useEffect(() => {
    setIsMounted(true);

    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        if (!AuthService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Try to get fresh profile data
        try {
          const profileResponse = await AuthService.getProfile();
          if (profileResponse.status) {
            setUser(profileResponse.data.profile);
          } else {
            const storedUser = AuthService.getUser();
            if (storedUser) {
              setUser(storedUser);
            } else {
              router.push('/auth/login');
              return;
            }
          }
        } catch {
          const storedUser = AuthService.getUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            router.push('/auth/login');
            return;
          }
        }
      } catch {
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleTestNotification = async () => {
    if (Notification.permission === 'granted') {
      new Notification('Test — OS Notification', {
        body: 'Chrome OS notification is working',
        icon: '/favicon.ico',
      });
    }
    setToast({
      notification: {
        title: 'Test — Foreground Toast',
        body: 'In-app toast notification is working',
      },
    });
  };

  const confirmLogout = () => {
    // unregisterFCM triggers onUnregistered → backend token removal handled there
    unregisterFCM().catch(() => { });
    AuthService.logout();
    setShowLogoutDialog(false);
    router.push('/auth/login');
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        {/* Mobile top header bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b flex items-center px-2 gap-2">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <span className="flex-1 text-sm font-bold">Spinovo Admin</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTestNotification}>
                <Bell className="mr-2 h-4 w-4" />
                Test Notification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="ml-2">Dark/Light Mode</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4">
            <SheetTitle>Spinovo Admin</SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${pathname === item.href
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                    }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <h1 className="text-xl font-bold">Spinovo Admin</h1>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                    }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${pathname === item.href
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                      }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-muted-foreground">{user?.mobile}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <NotificationBell /> */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button> */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* 
                     */}
                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      > */}
                      {theme === 'dark' ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      <span className='ml-2'>Dark/Light Mode</span>
                      {/* </Button> */}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="pt-20 pb-6 px-4 sm:px-6 md:pt-6 md:px-8">{children}</main>
      </div>

      {/* Notification permission prompt */}
      {user && !notifPromptDismissed && notifPermission !== 'granted' && (
        <NotificationPermissionPrompt
          permission={notifPermission}
          onGranted={() => setNotifPermission('granted')}
          onDismiss={() => setNotifPromptDismissed(true)}
        />
      )}

      {/* FCM foreground notification toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-lg border bg-background shadow-lg p-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.notification?.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{toast.notification?.body}</p>
            </div>
            <button onClick={() => setToast(null)} className="shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}