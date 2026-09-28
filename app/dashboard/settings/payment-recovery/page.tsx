'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, AlertCircle, ShieldAlert, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import {
  PaymentAlertApiService,
  PaymentAlert,
  PaymentAlertStatus,
  PaymentAlertResolution,
} from '@/lib/api';

const STATUS_OPTIONS: { value: PaymentAlertStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'unresolved', label: 'Unresolved — needs attention' },
  { value: 'resolved', label: 'Resolved' },
];

const RESOLUTION_OPTIONS: { value: PaymentAlertResolution | 'all'; label: string }[] = [
  { value: 'all', label: 'All resolutions' },
  { value: 'pending', label: 'Pending' },
  { value: 'wallet_credited', label: 'Wallet credited' },
  { value: 'wallet_refunded', label: 'Wallet refunded' },
  { value: 'already_safe', label: 'Already safe (no action needed)' },
  { value: 'no_customer_match', label: 'No customer match' },
  { value: 'credit_failed', label: 'Credit failed' },
];

const RESOLUTION_LABELS: Record<PaymentAlertResolution, string> = {
  pending: 'Pending',
  wallet_credited: 'Wallet credited',
  wallet_refunded: 'Wallet refunded',
  already_safe: 'Already safe',
  no_customer_match: 'No customer match',
  credit_failed: 'Credit failed',
};

function getResolutionColor(resolution: PaymentAlertResolution) {
  switch (resolution) {
    case 'wallet_credited':
    case 'wallet_refunded':
    case 'already_safe':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'no_customer_match':
    case 'credit_failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
  }
}

export default function PaymentRecoveryPage() {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<Partial<Record<PaymentAlertResolution, number>>>({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentAlertStatus | 'all'>('unresolved');
  const [resolutionFilter, setResolutionFilter] = useState<PaymentAlertResolution | 'all'>('all');
  const { toast } = useToast();

  const fetchAlerts = async (page: number, search: string = '') => {
    try {
      setLoading(true);
      setError('');

      const response = await PaymentAlertApiService.getPaymentAlerts(page, 20, {
        status: statusFilter === 'all' ? '' : statusFilter,
        resolution: resolutionFilter === 'all' ? '' : resolutionFilter,
        search,
      });

      if (response.status && response.data) {
        setAlerts(response.data.list || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
        setSummary(response.data.summaryByResolution || {});
      } else {
        setError(response.msg || 'Failed to fetch payment alerts');
        toast({ title: 'Error', description: response.msg || 'Failed to fetch payment alerts', variant: 'destructive' });
        setAlerts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      toast({ title: 'Error', description: 'Network error. Please check your connection and try again.', variant: 'destructive' });
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, resolutionFilter]);

  useEffect(() => {
    fetchAlerts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
    } catch {
      return dateString;
    }
  };

  const handleRefresh = () => fetchAlerts(currentPage);

  const columns = [
    {
      key: 'razorpay_payment_id',
      header: 'Payment ID',
      render: (alert: PaymentAlert) => (
        <span className="font-mono text-xs">{alert.razorpay_payment_id}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (alert: PaymentAlert) => <span>₹{alert.amount}</span>,
      searchable: false,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (alert: PaymentAlert) => (
        <div>
          <p className="font-medium text-sm">{alert.customer_name || 'Unmatched'}</p>
          <p className="text-xs text-muted-foreground">{alert.customer_mobile || alert.contact || '—'}</p>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (alert: PaymentAlert) => <span className="uppercase text-xs">{alert.method || '—'}</span>,
      searchable: false,
    },
    {
      key: 'resolution',
      header: 'Resolution',
      render: (alert: PaymentAlert) => (
        <div className="flex flex-col gap-1">
          <Badge className={getResolutionColor(alert.resolution || 'pending')}>
            {RESOLUTION_LABELS[alert.resolution || 'pending']}
          </Badge>
          {alert.resolution_detail && (
            <p className="text-xs text-muted-foreground max-w-[220px]">{alert.resolution_detail}</p>
          )}
          {!!alert.resolved_amount && (
            <p className="text-xs text-muted-foreground">₹{alert.resolved_amount} moved to wallet</p>
          )}
        </div>
      ),
      searchable: false,
    },
    {
      key: 'status',
      header: 'Status',
      render: (alert: PaymentAlert) => (
        <Badge variant={alert.status === 'unresolved' ? 'destructive' : 'outline'}>
          {alert.status.toUpperCase()}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'captured_at',
      header: 'Captured At',
      render: (alert: PaymentAlert) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(alert.captured_at)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payment Recovery Alerts</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Razorpay payments captured with no matching order
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {totalCount} — this mirrors the payment-alert emails, so you can check a
            customer&apos;s &quot;payment done, order missing&quot; complaint here directly instead of
            searching your inbox. The system automatically credits or refunds the customer&apos;s
            wallet where it safely can; rows still marked UNRESOLVED need manual follow-up.
          </div>
          {Object.keys(summary).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {(Object.entries(summary) as [PaymentAlertResolution, number][]).map(([key, count]) => (
                <Badge key={key} className={getResolutionColor(key)} variant="outline">
                  {RESOLUTION_LABELS[key] || key}: {count}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentAlertStatus | 'all')}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resolutionFilter} onValueChange={(value) => setResolutionFilter(value as PaymentAlertResolution | 'all')}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by resolution" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DataTable
            data={alerts}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search by payment ID, contact, or email..."
            onSearch={(term) => fetchAlerts(1, term)}
            emptyMessage={error ? 'Failed to load payment alerts.' : 'No payment alerts found.'}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
