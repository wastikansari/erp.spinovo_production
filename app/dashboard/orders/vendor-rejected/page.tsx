'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCw, AlertCircle, Package, Store,
  XCircle, UserCheck, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { VendorOrderApiService } from '@/lib/api/vendorOrders';
import { VendorOrder, ActiveVendor } from '@/lib/types/vendor-orders';

// ── Reassign dialog ──────────────────────────────────────────────────────────

function ReassignDialog({
  order,
  vendors,
  open,
  onClose,
  onSuccess,
}: {
  order: VendorOrder | null;
  vendors: ActiveVendor[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setSelectedVendorId('');
  }, [open]);

  async function handleReassign() {
    if (!order || !selectedVendorId) return;
    setLoading(true);
    try {
      const res = await VendorOrderApiService.reassignOrder(order._id, selectedVendorId);
      if (res.status) {
        toast({
          title: 'Order Reassigned',
          description: `Order reassigned to ${res.data?.vendor_name}`,
        });
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      toast({
        title: 'Reassignment Failed',
        description: e.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            Reassign Order
          </DialogTitle>
          <DialogDescription>
            {order && (
              <span>
                Reassigning{' '}
                <strong>#{order.order_number || order._id.slice(-6).toUpperCase()}</strong>
                {' '}— {order.service}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {order?.reject_reason && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <div className="font-medium mb-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Rejection reason
            </div>
            {order.reject_reason}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Select new vendor
          </label>
          <div className="relative">
            <select
              value={selectedVendorId}
              onChange={e => setSelectedVendorId(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Choose a vendor —</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} · {v.cityName} · {v.mobile}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          {vendors.length === 0 && (
            <p className="text-xs text-amber-600">No active vendors available.</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={!selectedVendorId || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorRejectedOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [vendors, setVendors] = useState<ActiveVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOrder, setDialogOrder] = useState<VendorOrder | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await VendorOrderApiService.getRejectedOrders(p, 20);
      if (res.status && res.data) {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load rejected orders');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await VendorOrderApiService.getActiveVendors();
      if (res.status && res.data) setVendors(res.data.vendors);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchOrders(page);
    fetchVendors();
  }, [page]);

  function openReassign(order: VendorOrder) {
    setDialogOrder(order);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            Rejected Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Orders rejected by vendors — reassign to another available vendor
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle className="h-3 w-3" />
              {total} need{total === 1 ? 's' : ''} reassignment
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">
            {total} rejected order{total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No rejected orders</p>
              <p className="text-xs mt-1">All orders are being handled by vendors</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Rejected By</th>
                    <th className="px-4 py-3 text-left">Rejection Reason</th>
                    <th className="px-4 py-3 text-left">Assigned At</th>
                    <th className="px-4 py-3 text-left">Booking Slot</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          #{order.order_number || order._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">{order.garment_qty} garments</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.service}</div>
                        {order.service_duration_hours > 0 && (
                          <div className="text-xs text-gray-400">{order.service_duration_hours}h SLA</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.vendor ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-gray-800">
                              <Store className="h-3 w-3 text-gray-400" />
                              {order.vendor.name}
                            </div>
                            <div className="text-xs text-gray-400">{order.vendor.city}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.reject_reason ? (
                          <div className="flex items-start gap-1.5 text-red-600 text-xs max-w-40">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{order.reject_reason}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No reason given</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>{format(new Date(order.assigned_at), 'MMM d, h:mm a')}</div>
                        <div className="text-gray-400">
                          {formatDistanceToNow(new Date(order.assigned_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {order.booking_date && <div>{order.booking_date}</div>}
                        {order.booking_time && <div className="text-gray-400">{order.booking_time}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => openReassign(order)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-3 gap-1"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Reassign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Reassign dialog */}
      <ReassignDialog
        order={dialogOrder}
        vendors={vendors}
        open={!!dialogOrder}
        onClose={() => setDialogOrder(null)}
        onSuccess={() => fetchOrders(page)}
      />
    </div>
  );
}
