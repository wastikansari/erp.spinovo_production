'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Package,
  RefreshCw,
  IndianRupee,
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
  Hash,
  CheckCircle2,
  Truck,
  MapPin,
} from 'lucide-react';
import { AssignApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeliveryAssignBooking } from '@/lib/types/delivery-assign';

// ─── Service Color System ─────────────────────────────────────────────────────

type ServiceColorKey =
  | 'quick-ironing'
  | 'ironing'
  | 'wash-ironing'
  | 'wash'
  | 'dry-cleaning'
  | 'shoes-cleaning'
  | 'default';

interface ServiceTheme {
  border: string;
  badge: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
}

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
  'quick-ironing': {
    border: 'border-l-orange-400',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    bg: 'bg-orange-50',
    icon: <Flame className="h-3.5 w-3.5" />,
    label: 'Quick Ironing',
  },
  ironing: {
    border: 'border-l-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    bg: 'bg-yellow-50',
    icon: <Shirt className="h-3.5 w-3.5" />,
    label: 'Ironing',
  },
  'wash-ironing': {
    border: 'border-l-purple-400',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    bg: 'bg-purple-50',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: 'Wash + Ironing',
  },
  wash: {
    border: 'border-l-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    bg: 'bg-blue-50',
    icon: <Droplets className="h-3.5 w-3.5" />,
    label: 'Wash',
  },
  'dry-cleaning': {
    border: 'border-l-teal-400',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    bg: 'bg-teal-50',
    icon: <Wind className="h-3.5 w-3.5" />,
    label: 'Dry Cleaning',
  },
  'shoes-cleaning': {
    border: 'border-l-stone-400',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
    bg: 'bg-stone-50',
    icon: <Footprints className="h-3.5 w-3.5" />,
    label: 'Shoes Cleaning',
  },
  default: {
    border: 'border-l-gray-300',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    bg: 'bg-gray-50',
    icon: <Package className="h-3.5 w-3.5" />,
    label: 'Service',
  },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAssignStatusInfo(status: number) {
  switch (status) {
    case 0: return { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200' };
    case 1: return { label: 'Assigned', cls: 'bg-green-100 text-green-700 border-green-200' };
    case 2: return { label: 'Started', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 3: return { label: 'Completed', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
    default: return { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
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
  } catch {
    return dateString;
  }
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
            {t.icon}
            {t.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  currentPage, totalPages, totalCount, loading, onPageChange,
}: {
  currentPage: number; totalPages: number; totalCount: number; loading: boolean; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
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
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
          ) : (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onPageChange(p as number)} disabled={loading}>{p}</Button>
          )
        )}
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COL_GRID = 'grid gap-x-3 px-5 items-center' as const;
const COL_TEMPLATE = { gridTemplateColumns: '1.4fr 1.2fr 1.4fr 72px 130px 110px 110px 100px 48px' } as const;

export default function DeliveryAssignedPage() {
  const [assignedList, setAssignedList] = useState<DeliveryAssignBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  const fetchList = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await AssignApiService.getDeliveryAssignedList(page, 20);
      if (response.status && response.data) {
        setAssignedList(response.data.assignList || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch delivery assigned orders');
        setAssignedList([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setAssignedList([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchList(currentPage); }, [currentPage, fetchList]);

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  const handlePageChange = (page: number) => {
    setExpandedRows([]);
    setCurrentPage(page);
  };

  const assignedCount = assignedList.filter((a) => a.status === 1).length;
  const startedCount = assignedList.filter((a) => a.isStarted === 1).length;

  return (
    <div className="space-y-5 p-4 md:p-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Assigned</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sub-orders assigned to copilots awaiting delivery
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchList(currentPage)} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold mt-0.5">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out for Delivery</p>
              <p className="text-2xl font-bold mt-0.5">{startedCount}</p>
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
            Delivery Assigned List
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
            className={`hidden lg:grid ${COL_GRID} py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide`}
            style={COL_TEMPLATE}
          >
            <div>Sub Order</div>
            <div>Order</div>
            <div>Copilot</div>
            <div>Qty</div>
            <div>Delivery Date</div>
            <div>Delivery Time</div>
            <div>Order Status</div>
            <div>Assign Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading assignments…</p>
            </div>
          ) : assignedList.length === 0 ? (
            <div className="py-24 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Delivery Assignments</p>
              <p className="text-sm text-muted-foreground mt-1">No sub-orders have been assigned for delivery yet</p>
            </div>
          ) : (
            assignedList.map((item) => {
              const isExpanded = expandedRows.includes(item._id);
              const sub = item.sub_order_details;
              const theme = SERVICE_THEMES[resolveServiceKey(sub?.service_name ?? '')];
              const assignStatus = getAssignStatusInfo(item.status);

              return (
                <div key={item._id} className={`border-b last:border-b-0 border-l-4 ${theme.border}`}>

                  {/* DESKTOP ROW */}
                  <div
                    className={`hidden lg:grid ${COL_GRID} py-3.5 transition-colors ${isExpanded ? 'bg-muted/10' : 'hover:bg-muted/5'}`}
                    style={COL_TEMPLATE}
                  >
                    {/* Sub Order */}
                    <div className="min-w-0">
                      <button onClick={() => toggleRow(item._id)} className="flex items-center gap-1 hover:opacity-80">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                          {theme.icon}
                          {sub?.sub_order_no ?? '—'}
                        </span>
                      </button>
                    </div>

                    {/* Order */}
                    <div className="text-sm font-medium text-primary">
                      {item.order_details?.order_display_no ?? '—'}
                    </div>

                    {/* Copilot */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate">{item.copilot_details?.name ?? '—'}</span>
                    </div>

                    {/* Qty */}
                    <div className="text-sm font-semibold">{sub?.garment_qty ?? '—'}</div>

                    {/* Delivery Date */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(sub?.expected_delivery_date ?? '')}
                    </div>

                    {/* Delivery Time */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {sub?.expected_delivery_time ?? '—'}
                    </div>

                    {/* Order Status */}
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${
                        item.order_details?.ord_status?.toLowerCase().includes('delivery assigned')
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {item.order_details?.ord_status ?? '—'}
                      </span>
                    </div>

                    {/* Assign Status */}
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium w-fit ${assignStatus.cls}`}>
                        {assignStatus.label}
                      </span>
                      {item.isStarted === 1 && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Truck className="h-3 w-3" /> En route
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${item.order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Main Order Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/sub-order/${item.sub_order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Sub Order Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleRow(item._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* MOBILE ROW */}
                  <div className="lg:hidden px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => toggleRow(item._id)} className="flex items-center gap-1.5">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                          {theme.icon}
                          {sub?.sub_order_no ?? '—'}
                        </span>
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${assignStatus.cls}`}>
                        {assignStatus.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Order: <span className="font-medium text-foreground">{item.order_details?.order_display_no ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium text-foreground">{item.copilot_details?.name ?? '—'}</span>
                      {item.copilot_details?.mobile && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="h-3 w-3" />
                          {item.copilot_details.mobile}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Qty: <b>{sub?.garment_qty ?? '—'}</b></span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(sub?.expected_delivery_date ?? '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sub?.expected_delivery_time ?? '—'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/${item.order_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Order
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/sub-order/${item.sub_order_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Sub-Order
                      </Button>
                    </div>
                  </div>

                  {/* EXPANDED PANEL */}
                  {isExpanded && (
                    <div className="bg-muted/10 border-t px-5 py-5 space-y-5">

                      {/* Copilot */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-1 rounded-full bg-primary" />
                          <h3 className="font-semibold text-sm">Assigned Copilot</h3>
                        </div>
                        <div className="max-w-sm rounded-xl border bg-background shadow-sm p-4 flex items-start gap-4">
                          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm">{item.copilot_details?.name ?? '—'}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                              {item.copilot_details?.mobile && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {item.copilot_details.mobile}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${item.copilot_details?.status === 1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                {item.copilot_details?.status === 1 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub Order Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-1 rounded-full bg-primary" />
                          <h3 className="font-semibold text-sm">Sub Order Details</h3>
                        </div>
                        <div className={`border border-l-4 ${theme.border} rounded-xl overflow-hidden bg-background shadow-sm max-w-lg`}>
                          <div className={`${theme.bg} px-4 py-2.5 flex items-center justify-between border-b`}>
                            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                              {theme.icon}
                              {sub?.service_name ?? '—'}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{sub?.sub_order_no ?? '—'}</span>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Shirt className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-semibold text-foreground">{sub?.garment_qty}</span>
                                <span>garments</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-semibold text-foreground">{sub?.garment_amount?.toLocaleString('en-IN')}</span>
                              </div>
                              {(sub?.no_of_bag ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Package className="h-3.5 w-3.5 shrink-0" />
                                  <span>{sub?.no_of_bag} bag{sub?.no_of_bag! > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>Delivery:</span>
                                <span className="text-foreground font-medium">{formatDate(sub?.expected_delivery_date ?? '')}, {sub?.expected_delivery_time ?? '—'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      {item.address_details?.format_address && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-1 rounded-full bg-primary" />
                            <h3 className="font-semibold text-sm">Delivery Address</h3>
                          </div>
                          <div className="max-w-sm rounded-xl border bg-background shadow-sm p-4 flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                              <p className="text-foreground font-medium">{item.address_details.format_address}</p>
                              {item.address_details.address_type && (
                                <p className="text-xs mt-1">{item.address_details.address_type}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} loading={loading} onPageChange={handlePageChange} />
        </CardContent>
      </Card>
    </div>
  );
}
