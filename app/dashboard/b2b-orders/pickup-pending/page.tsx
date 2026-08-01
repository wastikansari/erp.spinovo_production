'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Calendar,
  Eye,
  IndianRupee,
  ListOrdered,
  MoreHorizontal,
  Package,
  RefreshCw,
  Shirt,
  UserCheck,
} from 'lucide-react';
import { B2BAssignApiService } from '@/lib/api/b2bAssign';
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
import { B2BOrderSummary } from '@/lib/types/b2b-pickup-assign';
import { B2BAssignBookingForm } from '@/components/forms/b2b-assign-booking-form';

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

function garmentQty(order: B2BOrderSummary) {
  return order.items?.reduce((sum, i) => sum + i.garment.reduce((s, g) => s + g.qty, 0), 0) ?? 0;
}

function companyName(order: B2BOrderSummary) {
  return typeof order.company_id === 'object' ? order.company_id.companyName : '—';
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
        <span className="font-medium">{totalCount}</span> total orders
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

const COL_STYLE = 'grid gap-x-3 px-5 items-center' as const;
const COL_TEMPLATE = { gridTemplateColumns: '1.4fr 1.4fr 80px 120px 100px 130px 48px' } as const;

export default function B2BPickupPendingPage() {
  const [orders, setOrders] = useState<B2BOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<B2BOrderSummary | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await B2BAssignApiService.getPickupPendingList(page, 20);
      if (response.status && response.data) {
        setOrders(response.data.bookingList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalOrders(response.data.totalOrders || 0);
      } else {
        setError(response.msg || 'Failed to fetch B2B orders');
        setOrders([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setOrders([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  const totalGarments = orders.reduce((sum, o) => sum + garmentQty(o), 0);

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">B2B Pickup Pending</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            B2B orders ready to be assigned to a copilot for pickup
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchOrders(currentPage)} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Orders</p>
              <p className="text-2xl font-bold mt-0.5">{totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Shirt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Garments (this page)</p>
              <p className="text-2xl font-bold mt-0.5">{totalGarments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CARD */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-5 w-5" />
            Orders List
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
          <div className={`hidden lg:grid ${COL_STYLE} py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide`} style={COL_TEMPLATE}>
            <div>Order No</div>
            <div>Company</div>
            <div>Qty</div>
            <div>Pickup Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Pending B2B Orders</p>
              <p className="text-sm text-muted-foreground mt-1">All orders have been assigned for pickup</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="border-b last:border-b-0">
                {/* DESKTOP ROW */}
                <div className={`hidden lg:grid ${COL_STYLE} py-3.5 hover:bg-muted/5 transition-colors`} style={COL_TEMPLATE}>
                  <div>
                    <button
                      onClick={() => router.push(`/dashboard/b2b-orders/${order._id}`)}
                      className="font-semibold text-primary hover:underline text-sm"
                    >
                      {order.orderNo}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{companyName(order)}</span>
                  </div>
                  <div className="text-sm font-medium">{garmentQty(order)}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(order.bookingDate)}
                  </div>
                  <div className="font-semibold text-sm flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {order.totalBilling?.toLocaleString('en-IN')}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs border font-medium bg-yellow-100 text-yellow-700 border-yellow-200">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/b2b-orders/${order._id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Order
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowAssignForm(true);
                          }}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Assign Pickup
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* MOBILE ROW */}
                <div className="lg:hidden px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary text-sm">{order.orderNo}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs border font-medium bg-yellow-100 text-yellow-700 border-yellow-200">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {companyName(order)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Qty: <b>{garmentQty(order)}</b></span>
                    <span>₹<b>{order.totalBilling?.toLocaleString('en-IN')}</b></span>
                    <span>Pickup: <b>{formatDate(order.bookingDate)}</b></span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/b2b-orders/${order._id}`)}>
                      <Eye className="mr-1 h-3 w-3" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAssignForm(true);
                      }}
                    >
                      <UserCheck className="mr-1 h-3 w-3" /> Assign
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalCount={totalOrders} loading={loading} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <B2BAssignBookingForm
        open={showAssignForm}
        onOpenChange={setShowAssignForm}
        order={selectedOrder}
        onSuccess={() => { setShowAssignForm(false); fetchOrders(currentPage); }}
      />
    </div>
  );
}
