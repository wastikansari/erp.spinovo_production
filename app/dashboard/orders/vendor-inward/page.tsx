'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCw, AlertCircle, Package, Store,
  ShieldCheck, KeyRound, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AssignApiService } from '@/lib/api/assign';
import { VendorInwardOutwardOrder } from '@/lib/types/process-assign';

// ── OTP Verify Dialog ─────────────────────────────────────────────────────────

function OtpDialog({
  order,
  open,
  onClose,
  onSuccess,
}: {
  order: VendorInwardOutwardOrder | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) { setOtp(''); setVerified(false); setNextStatus(''); }
  }, [open]);

  async function handleVerify() {
    if (!order || otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await AssignApiService.verifyInwardOtp(order._id, otp);
      if (res.status) {
        setVerified(true);
        setNextStatus(res.data?.next_status || '');
        toast({ title: 'OTP Verified ✅', description: `Garments received. Order → ${res.data?.next_status}` });
      } else {
        toast({ title: 'Incorrect OTP', description: res.msg || 'Please check and try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            Verify Inward OTP
          </DialogTitle>
          <DialogDescription>
            {order && (
              <span>
                Order <strong>#{order.order_number || order._id.slice(-6).toUpperCase()}</strong>
                {' — '}{order.service || `Service ${order.service_id}`}
                {order.vendor && ` · ${order.vendor.name}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {verified ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm font-semibold text-green-700">Garments received by warehouse!</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Next step:</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                {nextStatus}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Enter 6-digit OTP from vendor</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="_ _ _ _ _ _"
                className="w-full text-center text-2xl font-mono tracking-widest rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none py-3 px-4"
                autoFocus
              />
              <p className="text-xs text-gray-400 text-center">
                Vendor shows this OTP on their app after processing is complete.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6 || loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Verify OTP
              </Button>
            </DialogFooter>
          </>
        )}

        {verified && (
          <DialogFooter>
            <Button onClick={() => { onClose(); onSuccess(); }} className="w-full">
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorInwardPage() {
  const [orders, setOrders] = useState<VendorInwardOutwardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOrder, setDialogOrder] = useState<VendorInwardOutwardOrder | null>(null);

  const fetch = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const res = await AssignApiService.getVendorInwardPending(p, 20);
      if (res.status && res.data) {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        setError(res.msg || 'Failed to load');
      }
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(page); }, [page]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            Vendor Inward
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vendors completed processing — scan OTP to confirm garments returned to warehouse
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700 border border-amber-200">
              {total} awaiting OTP
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => fetch(page)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Instructions banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How to complete Vendor Inward:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-700">
          <li>Vendor marks processing complete on their app → generates a 6-digit OTP</li>
          <li>Supervisor collects garments from vendor, vendor shows OTP on their screen</li>
          <li>Supervisor clicks <strong>Verify OTP</strong> and enters the 6-digit code below</li>
          <li>System confirms receipt → order auto-routes based on service type (wash/ironing etc.)</li>
        </ol>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{total} order{total !== 1 ? 's' : ''} awaiting inward verification</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin" />
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle2 className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No pending inward verifications</p>
              <p className="text-xs mt-1">All completed vendor orders have been received</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Completed At</th>
                    <th className="px-4 py-3 text-left">Garments</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          #{o.order_number || o._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">{o.booking_date} {o.booking_time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {o.service || `Service ${o.service_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {o.vendor ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-gray-800">
                              <Store className="h-3.5 w-3.5 text-gray-400" />
                              {o.vendor.name}
                            </div>
                            <div className="text-xs text-gray-400">{o.vendor.city}</div>
                          </div>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {o.processing_completed_at ? (
                          <>
                            <div>{format(new Date(o.processing_completed_at), 'MMM d, h:mm a')}</div>
                            <div className="text-gray-400">{formatDistanceToNow(new Date(o.processing_completed_at), { addSuffix: true })}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{o.garments_returned_qty || o.garment_qty}</span>
                        <span className="text-xs text-gray-400 ml-1">pcs</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => setDialogOrder(o)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Verify OTP
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <OtpDialog
        order={dialogOrder}
        open={!!dialogOrder}
        onClose={() => setDialogOrder(null)}
        onSuccess={() => fetch(page)}
      />
    </div>
  );
}
