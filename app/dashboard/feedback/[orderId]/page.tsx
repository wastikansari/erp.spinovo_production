'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Star,
  User,
  Phone,
  Package,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackApiService, OrderFeedback } from '@/lib/api';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-muted-foreground">{rating}/5</span>
    </div>
  );
}

export default function FeedbackDetailsPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [feedback, setFeedback] = useState<OrderFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await FeedbackApiService.getFeedbackByOrder(orderId);
        if (response.status && response.data) {
          setFeedback(response.data.feedback);
        } else {
          setError(response.msg || 'Failed to fetch feedback details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchDetails();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy • h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/feedback">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Feedback Details</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      ) : error || !feedback ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Feedback not found'}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order {feedback.order_details?.order_display_no || feedback.order_id}
            </CardTitle>
            <Link
              href={`/dashboard/bookings/${feedback.order_id}`}
              className="text-sm text-primary hover:underline w-fit"
            >
              View order details →
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                {feedback.customer_details?.name || '-'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {feedback.customer_details?.mobile || '-'}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(feedback.createdAt)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  DELIVERY EXPERIENCE
                </p>
                <StarRating rating={feedback.delivery_rating} />
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  SERVICE QUALITY
                </p>
                <StarRating rating={feedback.service_rating} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                CUSTOMER COMMENT
              </p>
              <p className="text-sm rounded-lg border p-4 bg-muted/30">
                {feedback.comment || 'No comment left by the customer.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
