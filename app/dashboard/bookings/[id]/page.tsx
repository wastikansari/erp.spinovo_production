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
        <Button onClick={fetchBookingDetails} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

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

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{customer.mobile}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || 'Not provided'}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="font-medium text-green-600">₹{customer.wallet_balance}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Living Type</p>
                <Badge variant="secondary">{customer.living_type || 'Not specified'}</Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Customer Since</p>
              <p className="font-medium">{formatDate(customer.createdAt)}</p>
            </div>

            <div className="pt-2">
              <Link href={`/dashboard/customers/${customer._id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Customer Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                <span className="text-muted-foreground">Original Amount</span>
                <span>₹{order.garment_original_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-₹{order.garment_discount_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charges</span>
                <span>₹{order.service_charges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slot Charges</span>
                <span>₹{order.slot_charges}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <span>₹{order.order_amount}</span>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-medium">{order.transaction_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Address Label</p>
                <p className="font-medium">{address.address_label}</p>
                {address.isPrimary && (
                  <Badge variant="default" className="text-xs mt-1">Primary Address</Badge>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Full Address</p>
                <p className="font-medium">{address.format_address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{address.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{address.state}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pincode</p>
                  <p className="font-medium">{address.pincode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{address.address_type}</p>
                </div>
              </div>

              {address.landmark && (
                <div>
                  <p className="text-sm text-muted-foreground">Landmark</p>
                  <p className="font-medium">{address.landmark}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <p>Booking ID: {bookingId}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
          <p>Booking Data: {bookingData ? 'Loaded' : 'Not loaded'}</p>
          <p>Order ID: {order?.order_display_no || 'N/A'}</p>
          <p>Customer: {customer?.name || 'N/A'}</p>
          <p>Address: {address?.address_label || 'N/A'}</p>
        </div>
      )}
    </div>
  );
}