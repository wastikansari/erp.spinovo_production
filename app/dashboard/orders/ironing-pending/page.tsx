'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Package, Play, CheckCircle2, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AssignApiService } from '@/lib/api/assign';
import { IroningOrder } from '@/lib/types/process-assign';

export default function IroningPendingPage() {
  const [orders, setOrders] = useState<IroningOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();

  const statusColor: Record<string, string> = {
    'Ironing Assigned':    'bg-amber-100 text-amber-700 border-amber-200',
    'Ironing In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Ironing Completed':   'bg-green-100 text-green-700 border-green-200',
  };

  const fetch = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const res = await AssignApiService.getIroningPending(p, 20);
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

  async function handleStart(id: string) {
    setActionId(id);
    try {
      const res = await AssignApiService.startIroning(id);
      if (res.status) {
        toast({ title: 'Ironing started' });
        fetch(page);
      } else {
        toast({ title: 'Error', description: res.msg, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  }

  async function handleComplete(id: string) {
    setActionId(id);
    try {
      const res = await AssignApiService.completeIroning(id);
      if (res.status) {
        toast({ title: 'Ironing complete — moved to Delivery Assigned' });
        fetch(page);
      } else {
        toast({ title: 'Error', description: res.msg, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shirt className="h-6 w-6 text-orange-500" />
            Ironing Pending
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Post-vendor ironing for Wash + Ironing orders — in-house workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border border-orange-200">
              {total} pending
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
          <CardTitle className="text-base">{total} order{total !== 1 ? 's' : ''} requiring ironing</CardTitle>
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
              <p className="text-sm font-medium">No ironing pending</p>
              <p className="text-xs mt-1">All wash + ironing orders are complete</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Slot</th>
                    <th className="px-4 py-3 text-left">Garments</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          #{o.sub_order_no || o._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">{o.order_no}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                          {o.service_name || `Service ${o.service_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>{o.booking_date}</div>
                        <div className="text-gray-400">{o.booking_time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{o.garment_qty}</span>
                        <span className="text-xs text-gray-400 ml-1">pcs</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[o.ord_status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {o.ord_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {o.ord_status === 'Ironing Assigned' && (
                            <Button
                              size="sm"
                              onClick={() => handleStart(o._id)}
                              disabled={actionId === o._id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1"
                            >
                              {actionId === o._id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                              Start
                            </Button>
                          )}
                          {o.ord_status === 'Ironing In Progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(o._id)}
                              disabled={actionId === o._id}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1"
                            >
                              {actionId === o._id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Complete
                            </Button>
                          )}
                          {o.ord_status === 'Ironing Completed' && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Done → Delivery
                            </span>
                          )}
                        </div>
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
