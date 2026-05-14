'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  AlertCircle,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BookingApiService, BookingDetailsData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { toast } = useToast();

  const [bookingData, setBookingData] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== BOOKING DETAILS PAGE ===');
      console.log('Booking ID from params:', bookingId);

      if (!bookingId) {
        setError('Booking ID is missing');
        return;
      }

      const response = await BookingApiService.getBookingDetails(bookingId);

      console.log('=== BOOKING DETAILS RESPONSE ===');
      console.log('Response:', response);

      if (response.status && response.data) {
        setBookingData(response.data);
        console.log('Booking details loaded successfully');
        toast({
          title: 'Success',
          description: 'Booking details loaded successfully',
        });
      } else {
        const errorMsg = response.msg || 'Failed to fetch booking details';
        setError(errorMsg);
        console.error('API Error:', errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('=== BOOKING DETAILS ERROR ===');
      console.error('Error details:', error);

      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load booking details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== BOOKING DETAILS COMPONENT MOUNTED ===');
    console.log('Booking ID:', bookingId);

    if (bookingId && bookingId !== 'undefined') {
      fetchBookingDetails();
    } else {
      setError('Invalid booking ID');
      setLoading(false);
    }
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading booking details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Booking not found'}
                <div className="mt-2">
                  <Button onClick={fetchBookingDetails} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, customer, address } = bookingData;
  console.log('Parsed order_details:' + order.order_details);


  // ✅ Parse order_details safely
  let parsedOrderDetails: any[] = [];

  // ✅ JSON Parse
  try {
    parsedOrderDetails = order.order_details ? JSON.parse(order.order_details) : [];
    console.log('Parsed order_details:', parsedOrderDetails);
  } catch (err) {
    console.error('Invalid JSON', err);
  }
  console.log('Parsed order_details:' + parsedOrderDetails);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-row gap-5">
          <Link href="/dashboard/assign-orders/processes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Order Garment Update</h1></div>
        <Button onClick={fetchBookingDetails} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Garment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {parsedOrderDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No order details available
            </p>
          ) : (
            parsedOrderDetails.map((service: any, index: number) => (
              <div key={index} className="space-y-4 border rounded-lg p-4">

                {/* Service Info */}
                <div>
                  <p className="font-semibold text-lg">{service.service}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Duration:</span>{' '}
                    {service.duration}
                  </p>
                </div>

                <Separator />

                {/* Categories */}
                <div className="space-y-4">
                  {service.categorys?.map((cat: any, i: number) => (
                    <div key={i} className="border rounded-md p-3 space-y-2">

                      {/* Category Header */}
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{cat.category}</p>
                        <Badge variant="secondary">
                          ₹{cat.category_prices} × {cat.items}
                        </Badge>
                      </div>

                      {/* Clothes Types */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Clothes Types:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {cat.types_of_Clothes?.map(
                            (cloth: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {cloth}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">{cat.items}</span>
                      </div>

                      {/* Total per category */}
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total</span>
                        <span>₹{cat.category_prices * cat.items}</span>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))
          )}
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{order.order_display_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(order.ord_status)}>
                  {order.ord_status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium">{order.service_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Type</p>
                  <p className="font-medium capitalize">{order.order_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{order.garment_qty} items</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Booking Date</p>
                  <p className="font-medium">{order.booking_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Booking Time</p>
                  <p className="font-medium">{order.booking_time}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
        {/* Pricing Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Amount</span>
                <span>₹{order.order_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Handling charge</span>
                <span>₹{order.handling_charges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery charge</span>
                <span>₹{order.delivery_charge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slot Amount</span>
                <span>₹{order.slot_charges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-₹{order.garment_discount_amount}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <span>₹{order.total_billing}</span>
            </div>

            <Separator />

            <div className="flex flex-1 justify-between">

              <div>
                {/* <CreditCard className="h-4 w-4 text-muted-foreground" /> */}
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-medium">{order.transaction_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="font-medium text-green-600">{order.payment_status}</p>

              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{order.payment_mode}</p>
              </div>

            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}