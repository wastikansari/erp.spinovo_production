'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import {
  RefreshCw, AlertTriangle, Store, Package,
  Clock, Wrench, Truck, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VendorOrderApiService } from '@/lib/api/vendorOrders';
import { OverdueOrder } from '@/lib/types/vendor-orders';

// Live overdue timer
function OverdueBadge({ deadline }: { deadline: string | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return null;
  const secs = Math.abs(differenceInSeconds(new Date(), new Date(deadline)));
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <span className="font-mono text-sm font-bold text-red-600">
      +{hh}:{mm}:{ss}
    </span>
  );
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  picked_up: <Truck className="h-3.5 w-3.5" />,
  processing: <Wrench className="h-3.5 w-3.5" />,
};

export default function VendorOverduePage() {
  const [orders, setOrders] = useState<OverdueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await VendorOrderApiService.getOverdueOrders(p, 20);
      if (res.status && res.data) {
        setOrders(res.data.orders as OverdueOrder[]);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(page); }, [page]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Overdue Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Orders that have exceeded their service SLA deadline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              {total} overdue
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

      <Card className="border-red-200">
        <CardHeader className="pb-3 bg-red-50 rounded-t-lg">
          <CardTitle className="text-base text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {total} order{total !== 1 ? 's' : ''} past deadline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No overdue orders</p>
              <p className="text-xs mt-1">All active orders are within their SLA</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Deadline</th>
                    <th className="px-4 py-3 text-left">Overdue By</th>
                    <th className="px-4 py-3 text-left">Picked Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-red-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          #{order.order_number || order._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">{order.garment_qty} garments</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.service}</div>
                        {order.service_duration_hours > 0 && (
                          <div className="text-xs text-gray-400">SLA: {order.service_duration_hours}h</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.vendor ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <Store className="h-3 w-3 text-gray-400" />
                              {order.vendor.name}
                            </div>
                            <div className="text-xs text-gray-400">{order.vendor.city}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          {STATUS_ICON[order.status] || <Clock className="h-3 w-3" />}
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {order.service_deadline
                          ? format(new Date(order.service_deadline), 'MMM d, h:mm a')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <OverdueBadge deadline={order.service_deadline} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {order.picked_up_at
                          ? <>{format(new Date(order.picked_up_at), 'MMM d, h:mm a')}<br />
                            <span className="text-gray-400">{formatDistanceToNow(new Date(order.picked_up_at), { addSuffix: true })}</span></>
                          : '—'}
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
    </div>
  );
}
