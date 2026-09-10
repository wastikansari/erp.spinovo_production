'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  UserPlus,
  ShoppingBag,
  Truck,
  PackageCheck,
  Wrench,
  Send as SendIcon,
  CheckCircle2,
  Mail,
  MailCheck,
  MailWarning,
  History,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
} from 'lucide-react';

import { DailyReportApiService } from '@/lib/api';
import { DailyReportData, DailyReportMetrics, DailyReportOrderRow } from '@/lib/types/dailyReport';
import { useToast } from '@/hooks/use-toast';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Canonical stage order for the status filter chips — mirrors
// models/booking/orderModel.js's ord_status enum.
const STATUS_FILTER_ORDER = [
  'Pending',
  'Pickup Assigned',
  'Pickup In Progress',
  'Pickup Completed',
  'Processing Assigned',
  'Processing In Progress',
  'Processing Completed',
  'Vendor Inward Pending',
  'Vendor Reassign Pending',
  'Vendor Inward Completed',
  'Ironing Assigned',
  'Ironing In Progress',
  'Ironing Completed',
  'Delivery Assigned',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

// Same status → badge-color mapping as app/dashboard/order-timeline/page.tsx,
// so a status reads the same color wherever it appears in the ERP.
function statusBadgeClasses(status: string) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
  if (s.includes('cancel')) return 'bg-red-100 text-red-700 border-red-200';
  if (s.includes('pickup') && s.includes('progress')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s.includes('processing') || s.includes('ironing') || s.includes('inward')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (s.includes('delivery') || s.includes('out for delivery')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (s.includes('completed')) return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function fmtTime(val: string | null | undefined) {
  if (!val) return null;
  try {
    return new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return val;
  }
}

const ORDERS_PAGE_SIZE = 15;

interface MetricTile {
  key: keyof DailyReportMetrics;
  label: string;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const METRIC_TILES: MetricTile[] = [
  {
    key: 'newCustomers',
    label: 'New Registered Customers',
    hint: 'Signed up today',
    icon: <UserPlus className="h-5 w-5" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    key: 'newOrders',
    label: 'New Orders',
    hint: 'Placed today',
    icon: <ShoppingBag className="h-5 w-5" />,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    key: 'pickupAssigned',
    label: 'Pickup Assigned',
    hint: 'Assigned to a pickup copilot',
    icon: <Truck className="h-5 w-5" />,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    key: 'pickedUp',
    label: 'Picked Up',
    hint: 'Pickup completed',
    icon: <PackageCheck className="h-5 w-5" />,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    key: 'processed',
    label: 'Processed',
    hint: 'Washing/ironing completed',
    icon: <Wrench className="h-5 w-5" />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    key: 'deliveryAssigned',
    label: 'Delivery Assigned',
    hint: 'Assigned to a delivery copilot',
    icon: <SendIcon className="h-5 w-5" />,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    hint: 'Handed over to the customer',
    icon: <CheckCircle2 className="h-5 w-5" />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
];

function todayIso() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function fmtDateTime(val: string | null | undefined) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return val;
  }
}

function fmtDateLabel(reportDate: string) {
  try {
    const [y, m, d] = reportDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return reportDate;
  }
}

export default function DailyReportPage() {
  const { toast } = useToast();
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [history, setHistory] = useState<DailyReportData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  // Daily Order Details — the per-order table
  const [orderRows, setOrderRows] = useState<DailyReportOrderRow[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchReport = useCallback(async (date: string) => {
    setLoading(true);
    setError('');
    try {
      const isToday = date === todayIso();
      const res = isToday
        ? await DailyReportApiService.getToday()
        : await DailyReportApiService.getByDate(date);

      if (res.status && res.data) {
        setReport(res.data);
      } else {
        setReport(null);
        setError(res.msg || 'No report found for this date');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({ title: 'Error', description: 'Failed to fetch daily report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await DailyReportApiService.getHistory(14);
      if (res.status && res.data) setHistory(res.data.history);
    } catch {
      // Non-critical — history sidebar just stays empty.
    }
  }, []);

  const fetchOrders = useCallback(async (date: string, status: string, search: string, page: number) => {
    setOrdersLoading(true);
    try {
      const res = await DailyReportApiService.getOrders({ date, status, search, page, limit: ORDERS_PAGE_SIZE });
      if (res.status && res.data) {
        setOrderRows(res.data.rows);
        setOrderTotal(res.data.total);
        setOrderTotalPages(res.data.totalPages);
        setOrderStatusCounts(res.data.statusCounts);
        setOrderPage(res.data.page);
      }
    } catch {
      // Non-critical section — the summary tiles above still work even if this fails.
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(selectedDate);
    fetchHistory();
    fetchOrders(selectedDate, 'all', '', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search — refetches 400ms after the admin stops typing.
  useEffect(() => {
    const t = setTimeout(() => {
      if (orderSearchInput !== orderSearch) {
        setOrderSearch(orderSearchInput);
        fetchOrders(selectedDate, orderStatusFilter, orderSearchInput, 1);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSearchInput]);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    fetchReport(date);
    setOrderStatusFilter('all');
    setOrderSearchInput('');
    setOrderSearch('');
    fetchOrders(date, 'all', '', 1);
  }

  function handleStatusFilter(status: string) {
    setOrderStatusFilter(status);
    fetchOrders(selectedDate, status, orderSearch, 1);
  }

  function handleOrdersPageChange(page: number) {
    fetchOrders(selectedDate, orderStatusFilter, orderSearch, page);
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await DailyReportApiService.resend(selectedDate === todayIso() ? undefined : selectedDate);
      if (res.status && res.data) {
        setReport(res.data.report);
        toast({ title: 'Report sent', description: `Daily report emailed to ${res.data.report.email?.recipients.join(', ') || 'recipients'}.` });
        fetchHistory();
      } else {
        toast({ title: 'Failed to send', description: res.msg || 'Something went wrong', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      toast({ title: 'Failed to send', description: msg, variant: 'destructive' });
    } finally {
      setResending(false);
    }
  }

  const metrics = report?.metrics;
  const total = metrics ? METRIC_TILES.reduce((sum, t) => sum + (metrics[t.key] || 0), 0) : 0;

  return (
    <div className="space-y-6">
      <HeaderSection title="Daily Report" loading={loading} handleRefresh={() => fetchReport(selectedDate)} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date + status + resend bar */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold">
                {report ? fmtDateLabel(report.reportDate) : fmtDateLabel(selectedDate)}
              </span>
              {report?.isLive && (
                <Badge variant="outline" className="border-primary text-primary">Live · updating until 8 PM</Badge>
              )}
              {report && !report.isLive && (
                <Badge variant="outline">Saved snapshot</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {report
                ? `Generated ${fmtDateTime(report.generatedAt)}`
                : 'No data generated for this date yet'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={selectedDate}
              max={todayIso()}
              onChange={(e) => handleSelectDate(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
            <Button size="sm" onClick={handleResend} disabled={resending || loading}>
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {selectedDate === todayIso() ? 'Send Now' : 'Resend Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email status */}
      {report?.email && (
        <Alert variant={report.email.sent ? 'default' : 'destructive'} className="items-start">
          {report.email.sent ? <MailCheck className="h-4 w-4 mt-0.5" /> : <MailWarning className="h-4 w-4 mt-0.5" />}
          <AlertDescription>
            {report.email.sent ? (
              <>Emailed to <span className="font-medium">{report.email.recipients.join(', ')}</span> at {fmtDateTime(report.email.sentAt)}.</>
            ) : report.email.error ? (
              <>Email not sent yet — last attempt failed: {report.email.error}</>
            ) : (
              <>Email not sent yet for this day.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <span className="text-sm text-muted-foreground">Loading daily report...</span>
          </CardContent>
        </Card>
      ) : metrics ? (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {METRIC_TILES.map((tile) => (
              <Card key={tile.key} className="rounded-2xl border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={tile.iconColor}>{tile.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{tile.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-0.5">{metrics[tile.key]}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tile.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formatted table */}
          <div>
            <h2 className="text-lg font-semibold tracking-tight mb-3">Report Table</h2>
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {METRIC_TILES.map((tile) => (
                    <TableRow key={tile.key}>
                      <TableCell>
                        <div className="font-medium">{tile.label}</div>
                        <div className="text-xs text-muted-foreground">{tile.hint}</div>
                      </TableCell>
                      <TableCell className="text-right text-base font-bold text-primary">
                        {metrics[tile.key]}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell>Total events recorded</TableCell>
                    <TableCell className="text-right">{total}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Daily Order Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> Daily Order Details
              </h2>
              <span className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{orderRows.length}</span> of{' '}
                <span className="font-medium text-foreground">{orderTotal}</span> orders
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  orderStatusFilter === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All ({Object.values(orderStatusCounts).reduce((a, b) => a + b, 0)})
              </button>
              {STATUS_FILTER_ORDER.filter((s) => orderStatusCounts[s] > 0).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    orderStatusFilter === s
                      ? 'bg-foreground text-background border-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s} ({orderStatusCounts[s]})
                </button>
              ))}
              <div className="relative ml-auto w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={orderSearchInput}
                  onChange={(e) => setOrderSearchInput(e.target.value)}
                  placeholder="Search order # or customer…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <Table className="min-w-[880px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Pickup Assigned</TableHead>
                    <TableHead>Picked Up</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Delivery Assigned</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                        <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : orderRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                        No orders match this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderRows.map((r) => (
                      <TableRow key={r.orderId}>
                        <TableCell>
                          <div className="font-medium text-primary whitespace-nowrap">{r.orderNo}</div>
                          <div className="text-xs text-muted-foreground">Placed {fmtTime(r.placedAt) || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">{r.customerName || '—'}</div>
                          <div className="text-xs text-muted-foreground">{r.customerMobile}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{r.service}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtTime(r.pickupAssignedAt) || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtTime(r.pickedUpAt) || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtTime(r.processedAt) || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtTime(r.deliveryAssignedAt) || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtTime(r.deliveredAt) || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <span className={`inline-flex whitespace-nowrap items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClasses(r.status)}`}>
                            {r.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {orderTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">Page {orderPage} of {orderTotalPages}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      disabled={orderPage <= 1 || ordersLoading}
                      onClick={() => handleOrdersPageChange(orderPage - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(5, orderTotalPages) }, (_, i) => {
                      let page: number;
                      if (orderTotalPages <= 5) page = i + 1;
                      else if (orderPage <= 3) page = i + 1;
                      else if (orderPage >= orderTotalPages - 2) page = orderTotalPages - 4 + i;
                      else page = orderPage - 2 + i;
                      return (
                        <Button
                          key={page}
                          variant={page === orderPage ? 'default' : 'outline'}
                          size="sm" className="h-7 w-7 p-0 text-xs"
                          disabled={ordersLoading}
                          onClick={() => handleOrdersPageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline" size="sm" className="h-7 w-7 p-0"
                      disabled={orderPage >= orderTotalPages || ordersLoading}
                      onClick={() => handleOrdersPageChange(orderPage + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Recent history */}
          {history.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight mb-3 flex items-center gap-2">
                <History className="h-4 w-4" /> Recent Reports
              </h2>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h.reportDate}
                    onClick={() => handleSelectDate(h.reportDate)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      h.reportDate === selectedDate
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {h.reportDate}
                    {h.email?.sent && <MailCheck className="inline h-3 w-3 ml-1 -mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium">No report for this date</p>
            <p className="text-xs text-muted-foreground">Pick another date, or send today's report now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
