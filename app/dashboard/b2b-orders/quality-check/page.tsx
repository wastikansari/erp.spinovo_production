'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  IndianRupee,
  ListOrdered,
  Loader2,
  Package,
  RefreshCw,
  Shirt,
  Upload,
  X,
} from 'lucide-react';
import { B2BAssignApiService } from '@/lib/api/b2bAssign';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { B2BOrderSummary } from '@/lib/types/b2b-pickup-assign';
import { B2BQcItemPayload } from '@/lib/types/b2b-process-assign';
import { B2BQcGarmentEditor } from '@/components/forms/b2b-qc-garment-editor';

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

// ─── QC Confirm Dialog ──────────────────────────────────────────────────────

function QcConfirmDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: {
  order: B2BOrderSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<B2BQcItemPayload[]>([]);
  const [correctedTotal, setCorrectedTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setNote('');
      setPhoto(null);
      setItems([]);
      setCorrectedTotal(0);
    }
  }, [open]);

  // Stable setter — safe as the editor's onChange dependency, won't trigger
  // an effect-identity loop.
  const handleEditorChange = useCallback(
    (nextItems: B2BQcItemPayload[], _serviceCharges: number, nextTotal: number) => {
      setItems(nextItems);
      setCorrectedTotal(nextTotal);
    },
    [],
  );

  const hasGarments = items.some((group) => group.garment.length > 0);

  const handleSubmit = async () => {
    if (!order || !hasGarments) return;
    setSubmitting(true);
    try {
      const res = await B2BAssignApiService.qcCompleted(order._id, {
        items,
        note: note || undefined,
        photo: photo || undefined,
      });
      if (res.status && res.data) {
        const { previous_total, corrected_total, billing_difference } = res.data;
        const diffCopy =
          billing_difference === 0
            ? 'No billing change.'
            : billing_difference > 0
              ? `Company wallet debited an extra ₹${Math.abs(billing_difference).toLocaleString('en-IN')}.`
              : `Company wallet credited ₹${Math.abs(billing_difference).toLocaleString('en-IN')}.`;
        toast({
          title: 'QC Passed',
          description: `Order ${order.orderNo} — billing corrected from ₹${previous_total.toLocaleString('en-IN')} to ₹${corrected_total.toLocaleString('en-IN')}. ${diffCopy}`,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: 'Failed', description: res.msg || 'Could not complete QC.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not complete QC. Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Quality Check — {order?.orderNo}
          </DialogTitle>
          <DialogDescription>
            Correct the garments and quantities against what was actually picked up. This becomes the final billing
            amount for this order.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{companyName(order)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ordered garments</span>
                <span className="font-medium">{garmentQty(order)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ordered amount</span>
                <span className="font-medium">₹{order.totalBilling?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <B2BQcGarmentEditor order={order} disabled={submitting} onChange={handleEditorChange} />

            <div className="space-y-2">
              <Label htmlFor="qc-note">Note (optional)</Label>
              <Textarea
                id="qc-note"
                placeholder="Any observations about garment condition or count…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              {photo ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">{photo.name}</span>
                  <button type="button" onClick={() => setPhoto(null)} disabled={submitting}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Attach Photo
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasGarments}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Mark QC Passed (₹{correctedTotal.toLocaleString('en-IN')})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export default function B2BQualityCheckPage() {
  const [orders, setOrders] = useState<B2BOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [qcOrder, setQcOrder] = useState<B2BOrderSummary | null>(null);
  const [showQcDialog, setShowQcDialog] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await B2BAssignApiService.getQualityCheckPendingList(page, 20);
      if (response.status && response.data) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch orders pending quality check');
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
          <h1 className="text-2xl font-bold tracking-tight">B2B Quality Check</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pickup-completed B2B orders pending quality check
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
              <p className="text-xs text-muted-foreground">Pending QC</p>
              <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
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
            Pending Quality Check Orders
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

          <div className="hidden lg:grid grid-cols-7 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Order No</div>
            <div>Company</div>
            <div>Qty</div>
            <div>Pickup Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Orders Pending QC</p>
              <p className="text-sm text-muted-foreground mt-1">All quality checks are up to date</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="border-b last:border-b-0">
                <div className="hidden lg:grid grid-cols-7 gap-3 px-5 py-3.5 items-center hover:bg-muted/5 transition-colors">
                  <div className="font-semibold text-primary text-sm">{order.orderNo}</div>
                  <div className="flex items-center gap-1.5 text-sm min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{companyName(order)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {garmentQty(order)}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(order.bookingDate)}
                  </div>
                  <div className="font-semibold text-sm flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {order.totalBilling?.toLocaleString('en-IN')}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs border font-medium bg-indigo-100 text-indigo-700 border-indigo-200">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => router.push(`/dashboard/b2b-orders/${order._id}`)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => { setQcOrder(order); setShowQcDialog(true); }}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Start QC
                    </Button>
                  </div>
                </div>

                {/* MOBILE ROW */}
                <div className="lg:hidden px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary text-sm">{order.orderNo}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs border font-medium bg-indigo-100 text-indigo-700 border-indigo-200">
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
                      className="h-7 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => { setQcOrder(order); setShowQcDialog(true); }}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Start QC
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} loading={loading} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <QcConfirmDialog
        order={qcOrder}
        open={showQcDialog}
        onOpenChange={setShowQcDialog}
        onSuccess={() => fetchOrders(currentPage)}
      />
    </div>
  );
}
