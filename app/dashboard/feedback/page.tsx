'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Star, User, Phone, Package, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackApiService, OrderFeedback } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { HeaderSection } from '@/components/ui/header-section';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<OrderFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string>('');

  const router = useRouter();
  const { toast } = useToast();

  const fetchFeedback = useCallback(async (page: number, limit: number = pageSize) => {
    try {
      setLoading(true);
      setError('');
      const response = await FeedbackApiService.getFeedbackList(page, limit);
      if (response.status && response.data) {
        setFeedbackList(response.data.feedbackList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalFeedback(response.data.totalFeedback || 0);
      } else {
        setError(response.msg || 'Failed to fetch feedback');
        toast({ title: 'Error', description: response.msg || 'Failed to fetch feedback', variant: 'destructive' });
        setFeedbackList([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({ title: 'Error', description: 'Network error. Please check your connection.', variant: 'destructive' });
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  }, [toast, pageSize]);

  useEffect(() => {
    fetchFeedback(currentPage, pageSize);
  }, [currentPage, pageSize, fetchFeedback]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/dashboard/feedback/${orderId}`);
  };

  const columns = [
    {
      key: 'order_details.order_display_no',
      header: 'Order',
      render: (fb: OrderFeedback) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{fb.order_details?.order_display_no || fb.order_id}</span>
        </div>
      ),
    },
    {
      key: 'customer_details.name',
      header: 'Customer',
      render: (fb: OrderFeedback) => (
        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {fb.customer_details?.name || '-'}
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Phone className="h-3 w-3" />
            {fb.customer_details?.mobile || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'delivery_rating',
      header: 'Delivery Rating',
      render: (fb: OrderFeedback) => <StarRating rating={fb.delivery_rating} />,
      searchable: false,
    },
    {
      key: 'service_rating',
      header: 'Service Rating',
      render: (fb: OrderFeedback) => <StarRating rating={fb.service_rating} />,
      searchable: false,
    },
    {
      key: 'comment',
      header: 'Comment',
      render: (fb: OrderFeedback) => (
        <div className="flex items-center gap-2 max-w-xs">
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-sm text-muted-foreground">
            {fb.comment || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (fb: OrderFeedback) => (
        <span className="text-sm text-muted-foreground">{formatDate(fb.createdAt)}</span>
      ),
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Customer Feedback"
        handleRefresh={() => fetchFeedback(currentPage, pageSize)}
        loading={loading}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Post-Delivery Ratings & Reviews
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${totalFeedback} review${totalFeedback !== 1 ? 's' : ''} found`}
              </p>
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
            data={feedbackList}
            columns={columns}
            loading={loading}
            emptyMessage={error ? 'Failed to load feedback.' : 'No customer feedback yet.'}
            actions={(fb) => (
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => handleViewDetails(fb.order_id)}
              >
                View
              </button>
            )}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
