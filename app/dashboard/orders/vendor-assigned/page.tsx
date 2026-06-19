'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import {
  RefreshCw, AlertCircle, Clock, Package, Store,
  CheckCircle2, XCircle, Truck, Wrench, ListOrdered,
  AlertTriangle, Activity, Download, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { VendorOrderApiService } from '@/lib/api/vendorOrders';
import { VendorOrder, VendorOrderStats, VendorOrderStatus } from '@/lib/types/vendor-orders';

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportCsv(orders: VendorOrder[]) {
  const header = ['Order#', 'Service', 'Vendor', 'City', 'Status', 'Assigned At', 'Picked Up At', 'Deadline', 'Garments'];
  const rows = orders.map(o => [
    o.order_number || o._id.slice(-6),
    o.service,
    o.vendor?.name || '',
    o.vendor?.city || '',
    o.status,
    o.assigned_at ? format(new Date(o.assigned_at), 'yyyy-MM-dd HH:mm') : '',
    o.picked_up_at ? format(new Date(o.picked_up_at), 'yyyy-MM-dd HH:mm') : '',
    o.service_deadline ? format(new Date(o.service_deadline), 'yyyy-MM-dd HH:mm') : '',
    String(o.garment_qty),
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vendor-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Timeline Modal ─────────────────────────────────────────────────────────────

function TimelineModal({ order, open, onClose }: { order: VendorOrder | null; open: boolean; onClose: () => void }) {
  if (!order) return null;

  type TimelineStep = { label: string; time: string | null; done: boolean; active: boolean; color: string };

  const steps: TimelineStep[] = [
    { label: 'Assigned to Vendor', time: order.assigned_at, done: true, active: false, color: 'bg-amber-500' },
    { label: 'Accepted by Vendor', time: order.accepted_at, done: !!order.accepted_at, active: order.status === 'accepted', color: 'bg-blue-500' },
    { label: 'Picked Up from Warehouse', time: order.picked_up_at, done: !!order.picked_up_at, active: order.status === 'picked_up', color: 'bg-purple-500' },
    { label: 'Processing Started', time: order.processing_started_at, done: !!order.processing_started_at, active: order.status === 'processing', color: 'bg-sky-500' },
    { label: 'Processing Completed', time: order.processing_completed_at, done: !!order.processing_completed_at, active: order.status === 'completed', color: 'bg-green-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Order Timeline — #{order.order_number || order._id.slice(-6).toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {order.status === 'rejected' ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="font-medium text-red-700 mb-1">Rejected by Vendor</div>
              {order.reject_reason && (
                <div className="text-sm text-red-600">{order.reject_reason}</div>
              )}
            </div>
          ) : (
            steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${step.done ? step.color : 'bg-gray-200'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 h-6 ${step.done ? 'bg-gray-300' : 'bg-gray-100'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <div className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                    {step.active && <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Current</span>}
                  </div>
                  {step.time && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(step.time), 'EEE, MMM d yyyy • h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {order.service_deadline && (
            <div className="mt-3 rounded-lg bg-gray-50 border p-3 text-xs">
              <span className="font-medium text-gray-600">Service Deadline: </span>
              <span className="text-gray-800">{format(new Date(order.service_deadline), 'EEE, MMM d • h:mm a')}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VendorOrderStatus, {
  label: string; color: string; badgeCls: string; icon: React.ReactNode;
}> = {
  assigned:   { label: 'Assigned',   color: '#F59E0B', badgeCls: 'bg-amber-100 text-amber-700 border-amber-200',     icon: <Clock className="h-3 w-3" /> },
  accepted:   { label: 'Accepted',   color: '#3B82F6', badgeCls: 'bg-blue-100 text-blue-700 border-blue-200',         icon: <CheckCircle2 className="h-3 w-3" /> },
  picked_up:  { label: 'Picked Up',  color: '#7C3AED', badgeCls: 'bg-purple-100 text-purple-700 border-purple-200',   icon: <Truck className="h-3 w-3" /> },
  processing: { label: 'Processing', color: '#0284C7', badgeCls: 'bg-sky-100 text-sky-700 border-sky-200',             icon: <Wrench className="h-3 w-3" /> },
  completed:  { label: 'Completed',  color: '#16A34A', badgeCls: 'bg-green-100 text-green-700 border-green-200',       icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected:   { label: 'Rejected',   color: '#DC2626', badgeCls: 'bg-red-100 text-red-700 border-red-200',             icon: <XCircle className="h-3 w-3" /> },
};

// ── Timer cell ─────────────────────────────────────────────────────────────────

function TimerCell({ deadline }: { deadline: string | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!deadline) return <span className="text-gray-400 text-xs">—</span>;

  const remaining = differenceInSeconds(new Date(deadline), new Date());
  const isOverdue = remaining < 0;
  const abs = Math.abs(remaining);
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  const ss = String(abs % 60).padStart(2, '0');
  const display = isOverdue ? `-${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;

  return (
    <span className={`font-mono text-xs font-bold ${
      isOverdue ? 'text-red-600' : remaining < 3600 ? 'text-amber-600' : 'text-green-600'
    }`}>
      {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-1" />}
      {display}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <div style={{ color }}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Filter tab ────────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: VendorOrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Active', value: 'accepted' },
  { label: 'Picked Up', value: 'picked_up' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorAssignedOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [stats, setStats] = useState<VendorOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<VendorOrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [timelineOrder, setTimelineOrder] = useState<VendorOrder | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (p = page, f = filter) => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, statsRes] = await Promise.all([
        VendorOrderApiService.getVendorOrders(p, 20, f),
        VendorOrderApiService.getStats(),
      ]);
      if (ordersRes.status && ordersRes.data) {
        setOrders(ordersRes.data.orders);
        setTotal(ordersRes.data.total);
        setTotalPages(ordersRes.data.totalPages);
      }
      if (statsRes.status && statsRes.data) {
        setStats(statsRes.data.stats);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchData(page, filter); }, [page, filter]);

  function handleFilterChange(f: VendorOrderStatus | 'all') {
    setFilter(f);
    setPage(1);
  }

  return (
    <>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live tracking of all vendor-assigned processing orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(orders)}
            disabled={orders.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(page, filter)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total" value={stats.total} color="#6B7280" icon={<ListOrdered className="h-5 w-5" />} />
          <StatCard label="Assigned" value={stats.assigned} color="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Active" value={stats.active} color="#3B82F6" icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Picked Up" value={stats.picked_up} color="#7C3AED" icon={<Truck className="h-5 w-5" />} />
          <StatCard label="Processing" value={stats.processing} color="#0284C7" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="Completed" value={stats.completed} color="#16A34A" icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard label="Overdue" value={stats.overdue} color="#DC2626" icon={<AlertTriangle className="h-5 w-5" />} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f.label}
            {f.value === 'rejected' && stats && stats.rejected > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {stats.rejected}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">
            {total} order{total !== 1 ? 's' : ''}
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
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Timer</th>
                    <th className="px-4 py-3 text-left">Assigned At</th>
                    <th className="px-4 py-3 text-left">Booking Slot</th>
                    <th className="px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(order => {
                    const cfg = STATUS_CONFIG[order.status];
                    const isTimerActive = order.status === 'picked_up' || order.status === 'processing';
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badgeCls}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          {order.status === 'rejected' && order.reject_reason && (
                            <div className="text-xs text-red-500 mt-1 max-w-32 truncate" title={order.reject_reason}>
                              {order.reject_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isTimerActive ? (
                            <TimerCell deadline={order.service_deadline} />
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {format(new Date(order.assigned_at), 'MMM d, h:mm a')}
                          <div className="text-gray-400">
                            {formatDistanceToNow(new Date(order.assigned_at), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {order.booking_date && (
                            <div>{order.booking_date}</div>
                          )}
                          {order.booking_time && (
                            <div className="text-gray-400">{order.booking_time}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setTimelineOrder(order)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View timeline"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Timeline modal */}
    <TimelineModal
      order={timelineOrder}
      open={!!timelineOrder}
      onClose={() => setTimelineOrder(null)}
    />
    </>
  );
}
