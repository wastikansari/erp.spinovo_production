'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Send,
  Star,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  Truck,
  PackageCheck,
  Boxes,
  Shield,
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
import { pageKeyForPath, hasAccess, canAccessPath, type PermissionedUser } from '@/lib/permissions';

type NavLeaf = { name: string; href: string; icon: typeof LayoutDashboard };
type NavGroup = { name: string; icon: typeof LayoutDashboard; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

function isNavGroup(item: NavEntry): item is NavGroup {
  return 'children' in item;
}

const navigation: NavEntry[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: Package },

  {
    name: 'Orders Management',
    icon: Package,
    children: [
      { name: 'Pickup Pending', href: '/dashboard/orders/pickup-pending', icon: UserCheck },
      { name: 'Pickup Assigned', href: '/dashboard/orders/pickup-assigned', icon: UserCheck },
      { name: 'Quality Check', href: '/dashboard/orders/quality-check/v2', icon: UserCheck },
      { name: 'Wash Pending', href: '/dashboard/orders/wash-pending', icon: UserCheck },
      { name: 'Ironing Pending', href: '/dashboard/orders/ironing-pending', icon: UserCheck },
      { name: 'Process Assigned (Inhouse)', href: '/dashboard/orders/process-assigned', icon: UserCheck },
      { name: 'Vendor Orders', href: '/dashboard/orders/vendor-assigned', icon: Store },
      { name: 'Vendor Outward', href: '/dashboard/orders/vendor-outward', icon: Store },
      { name: 'Vendor Rejected', href: '/dashboard/orders/vendor-rejected', icon: AlertTriangle },
      { name: 'Overdue Orders', href: '/dashboard/orders/vendor-overdue', icon: Clock },
      { name: 'Vendor Inward', href: '/dashboard/orders/vendor-inward', icon: UserCheck },
      { name: 'Delivery Pending', href: '/dashboard/orders/delivery-pending', icon: UserCheck },
      { name: 'Cancel Order', href: '/dashboard/orders/cancel', icon: UserCheck },
      { name: 'Delivery Assigned', href: '/dashboard/orders/delivery-assigned', icon: UserCheck },
      { name: 'Delivered', href: '/dashboard/orders/delivery', icon: UserCheck },
      { name: 'Attempted Orders', href: '/dashboard/orders/attempted', icon: AlertTriangle },
    ],
  },

  {
    name: 'B2B Management',
    icon: Building2,
    children: [
      { name: 'B2B Company List', href: '/dashboard/b2b-companies', icon: Building2 },
      { name: 'B2B Orders', href: '/dashboard/b2b-orders', icon: Package },
      { name: 'B2B Services', href: '/dashboard/b2b-services', icon: Wallet },
    ],
  },

  {
    name: 'B2B Order Management',
    icon: Truck,
    children: [
      { name: 'Pickup Pending', href: '/dashboard/b2b-orders/pickup-pending', icon: UserCheck },
      { name: 'Pickup Assigned', href: '/dashboard/b2b-orders/pickup-assigned', icon: UserCheck },
      { name: 'Quality Check', href: '/dashboard/b2b-orders/quality-check', icon: ShieldCheck },
      { name: 'Process Pending', href: '/dashboard/b2b-orders/process-pending', icon: Store },
      { name: 'Process Assigned', href: '/dashboard/b2b-orders/process-assigned', icon: Store },
      { name: 'Delivery Pending', href: '/dashboard/b2b-orders/delivery-pending', icon: Truck },
      { name: 'Delivery Assigned', href: '/dashboard/b2b-orders/delivery-assigned', icon: Truck },
      { name: 'Delivered', href: '/dashboard/b2b-orders/delivered', icon: PackageCheck },
    ],
  },

  { name: 'Inventory', href: '/dashboard/inventory', icon: Boxes },

  { name: 'Customer Feedback', href: '/dashboard/feedback', icon: Star },

  { name: 'Order Timeline', href: '/dashboard/order-timeline', icon: Clock },
  { name: 'Copilots', href: '/dashboard/copilots', icon: UserCog },
  { name: 'Vendors', href: '/dashboard/vendor', icon: Users },
  { name: 'Vendor Performance', href: '/dashboard/vendor/performance', icon: BarChart2 },

  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
      { name: 'Payment Reconciliation', href: '/dashboard/payments-v2', icon: AlertTriangle },
      { name: 'OTP Requests', href: '/dashboard/otp-requests', icon: MessageSquare },
      { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
      { name: 'Package', href: '/dashboard/package', icon: Store },
      { name: 'Services', href: '/dashboard/services', icon: Wallet },
      { name: 'Service SLA', href: '/dashboard/settings/service-duration', icon: Timer },
      { name: 'Offers', href: '/dashboard/offers', icon: Wallet },
      { name: 'Attempt Reasons', href: '/dashboard/settings/attempt-reasons', icon: ClipboardList },
      { name: 'Notification Campaigns', href: '/dashboard/notification-campaigns', icon: Send },
      { name: 'Get Export', href: '/dashboard/export', icon: FileDown },
      // Hardcoded super_admin-only on the backend (requirePermission("staff"))
      // — filterNavigation() below hides this for everyone else too, since
      // hasAccess() always returns false for the "staff" pageKey unless
      // role === 'super_admin'.
      { name: 'Staff', href: '/dashboard/staff', icon: Shield },
    ],
  },
];

// Hides nav items the logged-in user has no view access to. A group
// disappears entirely once all of its children are filtered out.
function filterNavigation(nav: NavEntry[], user: PermissionedUser | null): NavEntry[] {
  return nav.reduce<NavEntry[]>((acc, item) => {
    if (isNavGroup(item)) {
      const children = item.children.filter((child) => {
        const key = pageKeyForPath(child.href);
        return !key || hasAccess(user, key);
      });
      if (children.length > 0) acc.push({ ...item, children });
    } else {
      const key = pageKeyForPath(item.href);
      if (!key || hasAccess(user, key)) acc.push(item);
    }
    return acc;
  }, []);
}

function firstAccessibleHref(nav: NavEntry[]): string | null {
  for (const item of nav) {
    if (isNavGroup(item)) {
      if (item.children[0]) return item.children[0].href;
    } else {
      return item.href;
    }
  }
  return null;
}

function SidebarNavList({ items, onNavigate }: { items: NavEntry[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (isNavGroup(item) && item.children.some((child) => child.href === pathname)) {
        initial[item.name] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      {items.map((item) => {
        if (isNavGroup(item)) {
          const isOpen = !!openGroups[item.name];
          const isChildActive = item.children.some((child) => child.href === pathname);
          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() => toggleGroup(item.name)}
                className={`group flex w-full items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${isChildActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                <span className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {isOpen && (
                <div className="ml-4 space-y-1 border-l pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      onClick={onNavigate}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${pathname === child.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      <child.icon
                        className={`mr-3 h-4 w-4 ${pathname === child.href
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                          }`}
                      />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
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
        );
      })}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifPromptDismissed, setNotifPromptDismissed] = useState(false);

  const visibleNavigation = useMemo(() => filterNavigation(navigation, user), [user]);

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

  // Route guard — blocks direct-URL access to a page the logged-in user
  // has no view permission on. Re-checked whenever the route or the user's
  // permissions change (e.g. a super_admin edits their access mid-session).
  const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => {
    if (isLoading || !user) return;
    if (canAccessPath(user, pathname)) {
      setAccessDenied(false);
      return;
    }
    const fallback = firstAccessibleHref(visibleNavigation);
    if (fallback && fallback !== pathname) {
      router.replace(fallback);
    } else {
      // Nothing else this user can see either — show a message instead of
      // redirect-looping.
      setAccessDenied(true);
    }
  }, [isLoading, user, pathname, visibleNavigation, router]);

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
            <SidebarNavList items={visibleNavigation} onNavigate={() => setIsMobileMenuOpen(false)} />
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
              <SidebarNavList items={visibleNavigation} />
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
        <main className="pt-20 pb-6 px-4 sm:px-6 md:pt-6 md:px-8">
          {accessDenied ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="text-lg font-medium">You don't have access to any pages.</p>
              <p className="text-sm text-muted-foreground">
                Contact your super admin to get permissions assigned.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
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