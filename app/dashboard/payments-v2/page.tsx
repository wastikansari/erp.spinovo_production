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
import { Switch } from '@/components/ui/switch';
import { RefreshCw, AlertCircle, ShieldAlert, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PaymentV2ApiService, PendingPaymentV2, PendingPaymentV2Status } from '@/lib/api';

const STATUS_OPTIONS: { value: PendingPaymentV2Status | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'failed', label: 'Failed' },
];

export default function PaymentsV2Page() {
  const [payments, setPayments] = useState<PendingPaymentV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PendingPaymentV2Status | 'all'>('all');
  const [stuckOnly, setStuckOnly] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchPayments = async (page: number, search: string = '') => {
    try {
      setLoading(true);
      setError('');

      const response = await PaymentV2ApiService.getPayments(page, 20, {
        status: statusFilter === 'all' ? '' : statusFilter,
        stuckOnly,
        search,
      });

      if (response.status && response.data) {
        setPayments(response.data.paymentList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalPayments(response.data.total || 0);
      } else {
        setError(response.msg || 'Failed to fetch payments');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch payments',
          variant: 'destructive',
        });
        setPayments([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, stuckOnly]);

  useEffect(() => {
    fetchPayments(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: PendingPaymentV2Status) => {
    switch (status) {
      case 'order_created':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
    }
  };

  const handleViewCustomerDetails = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/bookings/${orderId}`);
  };

  const handleRefresh = () => {
    fetchPayments(currentPage);
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (payment: PendingPaymentV2) => (
        <div>
          <p className="font-medium text-sm">{payment.customer?.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{payment.customer?.mobile || payment.customer_id}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: PendingPaymentV2) => <span>₹{payment.amount}</span>,
      searchable: false,
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: PendingPaymentV2) => (
        <div className="flex flex-col gap-1">
          <Badge className={getStatusColor(payment.status)}>
            {payment.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {payment.is_stuck && (
            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
              <ShieldAlert className="h-3 w-3" />
              STUCK
            </Badge>
          )}
          {payment.status === 'failed' && payment.failure_reason && (
            <p className="text-xs text-muted-foreground max-w-[180px]">
              {payment.failure_reason}
            </p>
          )}
        </div>
      ),
      searchable: false,
    },
    {
      key: 'razorpay_order_id',
      header: 'Razorpay Order ID',
      render: (payment: PendingPaymentV2) => (
        <span className="font-mono text-xs">{payment.razorpay_order_id}</span>
      ),
    },
    {
      key: 'order_display_no',
      header: 'Linked Order',
      render: (payment: PendingPaymentV2) =>
        payment.order_display_no && payment.order_id ? (
          <button
            className="text-primary underline text-sm"
            onClick={() => handleViewOrder(payment.order_id as string)}
          >
            {payment.order_display_no}
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (payment: PendingPaymentV2) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(payment.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (payment: PendingPaymentV2) =>
    payment.customer ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewCustomerDetails(payment.customer_id)}
      >
        <Eye className="mr-2 h-4 w-4" />
        Customer
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payment Reconciliation</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Razorpay Payment Attempts
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {totalPayments} — payments that reached Razorpay but never became an order
            show up here as &quot;STUCK&quot; instead of only showing up as a customer complaint.
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PendingPaymentV2Status | 'all')}
            >
              <SelectTrigger className="w-[200px]">
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

            <div className="flex items-center gap-2">
              <Switch checked={stuckOnly} onCheckedChange={setStuckOnly} id="stuck-only" />
              <label htmlFor="stuck-only" className="text-sm cursor-pointer">
                Stuck payments only
              </label>
            </div>
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
            data={payments}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search by customer name, mobile, or Razorpay order ID..."
            onSearch={(term) => fetchPayments(1, term)}
            emptyMessage={error ? 'Failed to load payments.' : 'No payments found.'}
            actions={renderActions}
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
