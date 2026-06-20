'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { RefreshCw, AlertCircle, Package, Store, Truck, Clock, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AssignApiService } from '@/lib/api/assign';
import { VendorInwardOutwardOrder } from '@/lib/types/process-assign';

export default function VendorOutwardPage() {
  const [orders, setOrders] = useState<VendorInwardOutwardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const statusLabel: Record<number, { label: string; color: string }> = {
    3: { label: 'Picked Up', color: 'bg-purple-100 text-purple-700' },
    4: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  };

  const fetch = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const res = await AssignApiService.getVendorOutward(p, 20);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-purple-600" />
            Vendor Outward
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Orders currently with vendors — picked up but not yet returned
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700 border border-purple-200">
              {total} with vendors
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => fetch(page)} disabled={loading} className="gap-2">
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
          <CardTitle className="text-base">{total} orders with vendors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin" />
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No orders currently with vendors</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Picked Up</th>
                    <th className="px-4 py-3 text-left">SLA Deadline</th>
                    <th className="px-4 py-3 text-left">Garments</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(o => {
                    const sl = statusLabel[o.process_status];
                    const isOverdue = o.service_deadline && new Date(o.service_deadline) < new Date();
                    return (
                      <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">#{o.order_number || o._id.slice(-6).toUpperCase()}</div>
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
                        <td className="px-4 py-3">
                          {sl && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.color}`}>
                              {sl.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {o.picked_up_at ? (
                            <>
                              <div>{format(new Date(o.picked_up_at), 'MMM d, h:mm a')}</div>
                              <div className="text-gray-400">{formatDistanceToNow(new Date(o.picked_up_at), { addSuffix: true })}</div>
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {o.service_deadline ? (
                            <div className={isOverdue ? 'text-red-600' : 'text-green-600'}>
                              <div className="flex items-center gap-1 text-xs font-medium">
                                <Timer className="h-3.5 w-3.5" />
                                {isOverdue ? 'OVERDUE' : 'Due'}
                              </div>
                              <div className="text-xs">{format(new Date(o.service_deadline), 'MMM d, h:mm a')}</div>
                            </div>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800">{o.garment_qty}</span>
                          <span className="text-xs text-gray-400 ml-1">pcs</span>
                        </td>
                      </tr>
                    );
                  })}
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
    </div>
  );
}
