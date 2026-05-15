'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  Eye,
  MoreHorizontal,
  Package,
  RefreshCw,
  ListOrdered,
  Shirt,
  Droplets,
  Wind,
  Footprints,
  Flame,
  Sparkles,
  Clock,
  Phone,
  User,
  Store,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import { AssignApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProcessAssignBooking } from '@/lib/types/process-assign';

// ─── Service Color System ────────────────────────────────────────────────────

type ServiceColorKey =
  | 'quick-ironing' | 'ironing' | 'wash-ironing'
  | 'wash' | 'dry-cleaning' | 'shoes-cleaning' | 'default';

interface ServiceTheme { border: string; badge: string; icon: React.ReactNode; label: string; }

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
  'quick-ironing': { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Flame className="h-3 w-3" />, label: 'Quick Ironing' },
  ironing:         { border: 'border-l-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Shirt className="h-3 w-3" />, label: 'Ironing' },
  'wash-ironing':  { border: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Sparkles className="h-3 w-3" />, label: 'Wash + Ironing' },
  wash:            { border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <Droplets className="h-3 w-3" />, label: 'Wash' },
  'dry-cleaning':  { border: 'border-l-teal-400',   badge: 'bg-teal-100 text-teal-700 border-teal-200',       icon: <Wind className="h-3 w-3" />, label: 'Dry Cleaning' },
  'shoes-cleaning':{ border: 'border-l-stone-400',  badge: 'bg-stone-100 text-stone-700 border-stone-200',    icon: <Footprints className="h-3 w-3" />, label: 'Shoes Cleaning' },
  default:         { border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-600 border-gray-200',       icon: <Package className="h-3 w-3" />, label: 'Service' },
};

function resolveServiceKey(name: string): ServiceColorKey {
  const n = name?.toLowerCase() ?? '';
  if (n.includes('quick') && n.includes('iron')) return 'quick-ironing';
  if (n.includes('wash') && (n.includes('iron') || n.includes('+'))) return 'wash-ironing';
  if (n.includes('dry')) return 'dry-cleaning';
  if (n.includes('shoe')) return 'shoes-cleaning';
  if (n.includes('iron')) return 'ironing';
  if (n.includes('wash')) return 'wash';
  return 'default';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending':              return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'pickup completed':     return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'processing assigned':  return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'processing':           return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'completed':            return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled':            return 'bg-red-100 text-red-700 border-red-200';
    default:                     return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '—';
  try {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('/');
      return format(new Date(`${yyyy}-${mm}-${dd}`), 'dd MMM yyyy');
    }
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch { return dateString; }
}

// ─── Service Legend ───────────────────────────────────────────────────────────

function ServiceLegend() {
  const keys: ServiceColorKey[] = ['quick-ironing', 'ironing', 'wash', 'wash-ironing', 'dry-cleaning', 'shoes-cleaning'];
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => {
        const t = SERVICE_THEMES[k];
        return (
          <div key={k} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${t.badge}`}>
            {t.icon}{t.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({ currentPage, totalPages, totalCount, loading, onPageChange }: {
  currentPage: number; totalPages: number; totalCount: number; loading: boolean; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('…');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t">
      <p className="text-sm text-muted-foreground">
        Showing page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span> &mdash;{' '}
        <span className="font-medium">{totalCount}</span> total assignments
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Prev</Button>
        {getPageNumbers().map((p, i) =>
          p === '…'
            ? <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
            : <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onPageChange(p as number)} disabled={loading}>{p}</Button>
        )}
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COL_STYLE = 'grid gap-x-3 px-5 items-center' as const;
const COL_TEMPLATE = { gridTemplateColumns: '1.6fr 1.1fr 1.4fr 72px 64px 90px 130px 110px 120px 48px' } as const;

export default function ProcessListPage() {
  const [assignList, setAssignList]             = useState<ProcessAssignBooking[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [currentPage, setCurrentPage]           = useState(1);
  const [totalPages, setTotalPages]             = useState(1);
  const [totalCount, setTotalCount]             = useState(0);
  const [error, setError]                       = useState('');
  const [confirmItem, setConfirmItem]           = useState<ProcessAssignBooking | null>(null);
  const [completing, setCompleting]             = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchList = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await AssignApiService.getProcessAssignedList(page, 20);
      if (response.status && response.data) {
        setAssignList(response.data.assignList || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch process assigned list');
        setAssignList([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setAssignList([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchList(currentPage); }, [currentPage, fetchList]);

  const handleMarkCompleted = async () => {
    if (!confirmItem) return;
    try {
      setCompleting(true);
      const response = await AssignApiService.processAssignCompleted(confirmItem._id);
      if (response.status) {
        toast({ title: 'Success', description: 'Process marked as completed successfully.' });
        setConfirmItem(null);
        fetchList(currentPage);
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to mark process as completed.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const processingCount = assignList.filter(a => a.sub_order_details?.ord_status?.toLowerCase() === 'processing assigned').length;
  const uniqueVendors   = new Set(assignList.map(a => a.vendor_id)).size;

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Process Assigned</h1>
          <p className="text-muted-foreground mt-1">
            Sub-orders assigned to vendors for processing
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchList(currentPage)} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS — gradient style matching bookings page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-primary/80">Total Assignments</p>
                <h2 className="text-4xl font-bold mt-2">{totalCount}</h2>
                <p className="text-xs text-muted-foreground mt-2">Process assign records</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Hash className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/40">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Processing Assigned</p>
                <h2 className="text-4xl font-bold mt-2 text-orange-900">{processingCount}</h2>
                <p className="text-xs text-orange-600 mt-2">Sub-orders in process</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-orange-200/60 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-teal-50 to-teal-100/40">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-teal-700">Active Vendors</p>
                <h2 className="text-4xl font-bold mt-2 text-teal-900">{uniqueVendors}</h2>
                <p className="text-xs text-teal-600 mt-2">Vendors handling orders</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-teal-200/60 flex items-center justify-center">
                <Store className="h-7 w-7 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SERVICE LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Service Types:</span>
        <ServiceLegend />
      </div>

      {/* MAIN TABLE */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-5 w-5" />
            Process Assigned List
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* TABLE HEADER — desktop */}
          <div
            className={`hidden lg:grid ${COL_STYLE} py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide`}
            style={COL_TEMPLATE}
          >
            <div>Sub Order Id</div>
            <div>Order Id</div>
            <div>Vendor</div>
            <div>Garment QTY</div>
            <div>Bag</div>
            <div>Service time</div>
            <div>Delivery Date</div>
            <div>Delivery Time</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading assignments…</p>
            </div>
          ) : assignList.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Process Assignments</p>
              <p className="text-sm text-muted-foreground mt-1">Try refreshing the page</p>
            </div>
          ) : (
            assignList.map((item, idx) => {
              const sub   = item.sub_order_details;
              const theme = SERVICE_THEMES[resolveServiceKey(sub?.service_name ?? '')];
              return (
                <div
                  key={`${item._id}-${idx}`}
                  className={`border-b last:border-b-0 border-l-4 ${theme.border}`}
                >
                  {/* DESKTOP ROW */}
                  <div
                    className={`hidden lg:grid ${COL_STYLE} py-3.5 hover:bg-muted/5 transition-colors`}
                    style={COL_TEMPLATE}
                  >
                    {/* Sub Order Id */}
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                        {theme.icon}
                        {sub?.sub_order_no ?? '—'}
                      </span>
                    </div>

                    {/* Order Id */}
                    <div className="text-sm font-medium text-primary">
                      {item.order_details?.order_display_no ?? '—'}
                    </div>

                    {/* Vendor */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.vendor_details?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {item.vendor_details?.mobile ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Garment QTY */}
                    <div className="text-sm font-semibold">{sub?.garment_qty ?? '—'}</div>

                    {/* Bag */}
                    <div className="text-sm text-muted-foreground">{(sub?.no_of_bag ?? 0) > 0 ? sub.no_of_bag : '—'}</div>

                    {/* Service time */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {sub?.booking_time || '—'}
                    </div>

                    {/* Delivery Date */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(sub?.expected_delivery_date ?? '')}
                    </div>

                    {/* Delivery Time */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {sub?.expected_delivery_time || '—'}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(sub?.ord_status ?? '')}`}>
                        {sub?.ord_status || 'Pending'}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${item.order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Main Order Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/sub-order/${item.sub_order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Sub Order Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmItem(item)}
                            className="text-green-600 focus:text-green-700 focus:bg-green-50"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Process Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* MOBILE ROW */}
                  <div className="lg:hidden px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                        {theme.icon}
                        {sub?.sub_order_no ?? '—'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(sub?.ord_status ?? '')}`}>
                        {sub?.ord_status || 'Pending'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Order: <span className="font-medium text-foreground">{item.order_details?.order_display_no ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium text-foreground">{item.vendor_details?.name ?? '—'}</span>
                      <span>·</span>
                      <Phone className="h-3 w-3" />
                      <span>{item.vendor_details?.mobile ?? '—'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Qty: <b>{sub?.garment_qty}</b></span>
                      <span>Bags: <b>{sub?.no_of_bag || 0}</b></span>
                      <span>Time: <b>{sub?.booking_time || '—'}</b></span>
                      <span>Delivery: <b>{formatDate(sub?.expected_delivery_date ?? '')}</b></span>
                    </div>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/${item.order_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Order
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/sub-order/${item.sub_order_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Sub-Order
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg text-green-600 border-green-300 hover:bg-green-50" onClick={() => setConfirmItem(item)}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Completed
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            loading={loading}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </CardContent>
      </Card>

      {/* CONFIRM MARK COMPLETED DIALOG */}
      <AlertDialog open={!!confirmItem} onOpenChange={(open) => { if (!open) setConfirmItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark Process Completed
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Are you sure you want to mark this process as completed? This action cannot be undone.</p>
                {confirmItem && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sub Order</span>
                      <span className="font-semibold">{confirmItem.sub_order_details?.sub_order_no ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order</span>
                      <span className="font-semibold">{confirmItem.order_details?.order_display_no ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor</span>
                      <span className="font-semibold">{confirmItem.vendor_details?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-semibold">{confirmItem.sub_order_details?.service_name ?? '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {completing ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Confirming…</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Confirm</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
