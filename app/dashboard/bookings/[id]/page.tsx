'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';

import { BookingApiService, BookingDetailsData } from '@/lib/api';

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
  Receipt,
  RefreshCw,
} from 'lucide-react';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId = params.id as string;

  const [bookingData, setBookingData] =
    useState<BookingDetailsData | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      const response =
        await BookingApiService.getBookingDetails(
          bookingId
        );

      if (response.status) {
        setBookingData(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!bookingData) {
    return <div>No Booking Found</div>;
  }

  const { order, customer, address, subOrders } =
    bookingData;

  let parsedOrderDetails: any[] = [];

  try {
    if (Array.isArray(order.order_details)) {
      parsedOrderDetails = JSON.parse(
        order.order_details[0]
      );
    } else {
      parsedOrderDetails = JSON.parse(
        order.order_details
      );
    }
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold">
          Order Details
        </h1>

        <Button
          onClick={fetchBookingDetails}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {order.order_display_no}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Service
              </p>

              <p className="font-semibold">
                {order.service_name}
              </p>
            </div>

            <Badge>
              {order.ord_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Quantity
              </p>

              <p className="font-semibold">
                {order.garment_qty}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Amount
              </p>

              <p className="font-semibold">
                ₹{order.total_billing}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Booking Date
              </p>

              <p className="font-semibold">
                {order.booking_date}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Booking Time
              </p>

              <p className="font-semibold">
                {order.booking_time}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Name
            </p>

            <p className="font-semibold">
              {customer.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Mobile
            </p>

            <p className="font-semibold">
              {customer.mobile}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Wallet
            </p>

            <p className="font-semibold">
              ₹{customer.wallet_balance}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p>{address.format_address}</p>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pricing
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Order Amount</span>

            <span>₹{order.order_amount}</span>
          </div>

          <div className="flex justify-between">
            <span>Handling Charges</span>

            <span>₹{order.handling_charges}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Charges</span>

            <span>₹{order.delivery_charge}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>

            <span>₹{order.total_billing}</span>
          </div>
        </CardContent>
      </Card>

      {/* Sub Orders */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sub Orders
          </CardTitle>
        </CardHeader>

        <CardContent>
          {subOrders?.length ? (
            <div className="space-y-4">
              {subOrders.map((sub) => (
                <div
                  key={sub._id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/bookings/sub-orders/${sub._id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {sub.sub_order_no}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {sub.service_name}
                      </p>
                    </div>

                    <Badge>
                      {sub.ord_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Quantity
                      </p>

                      <p className="font-medium">
                        {sub.garment_qty}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Amount
                      </p>

                      <p className="font-medium">
                        ₹{sub.garment_amount}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Booking
                      </p>

                      <p className="font-medium">
                        {sub.booking_date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No sub orders available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Order Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {parsedOrderDetails.map(
            (service: any, index: number) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-4"
              >
                <div>
                  <p className="font-semibold text-lg">
                    {service.service}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>

                {service.categorys?.map(
                  (cat: any, idx: number) => (
                    <div
                      key={idx}
                      className="border rounded-md p-3"
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">
                          {cat.category}
                        </p>

                        <Badge variant="secondary">
                          ₹{cat.category_prices}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {cat.types_of_Clothes?.map(
                          (
                            cloth: string,
                            clothIndex: number
                          ) => (
                            <Badge
                              key={clothIndex}
                              variant="outline"
                            >
                              {cloth}
                            </Badge>
                          )
                        )}
                      </div>

                      <div className="mt-4 text-sm">
                        Items: {cat.items}
                      </div>
                    </div>
                  )
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import {
//   ArrowLeft,
//   Package,
//   User,
//   Phone,
//   MapPin,
//   Calendar,
//   Clock,
//   CreditCard,
//   Loader2,
//   RefreshCw,
//   AlertCircle,
//   Receipt
// } from 'lucide-react';
// import Link from 'next/link';
// import { format } from 'date-fns';
// import { BookingApiService, BookingDetailsData } from '@/lib/api';
// import { useToast } from '@/hooks/use-toast';
// import { Alert, AlertDescription } from '@/components/ui/alert';

// export default function BookingDetailsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const bookingId = params.id as string;
//   const { toast } = useToast();

//   const [bookingData, setBookingData] = useState<BookingDetailsData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');

//   const fetchBookingDetails = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       console.log('=== BOOKING DETAILS PAGE ===');
//       console.log('Booking ID from params:', bookingId);

//       if (!bookingId) {
//         setError('Booking ID is missing');
//         return;
//       }

//       const response = await BookingApiService.getBookingDetails(bookingId);

//       console.log('=== BOOKING DETAILS RESPONSE ===');
//       console.log('Response:', response);

//       if (response.status && response.data) {
//         setBookingData(response.data);
//         console.log('Booking details loaded successfully');
//         toast({
//           title: 'Success',
//           description: 'Booking details loaded successfully',
//         });
//       } else {
//         const errorMsg = response.msg || 'Failed to fetch booking details';
//         setError(errorMsg);
//         console.error('API Error:', errorMsg);
//         toast({
//           title: 'Error',
//           description: errorMsg,
//           variant: 'destructive',
//         });
//       }
//     } catch (error) {
//       console.error('=== BOOKING DETAILS ERROR ===');
//       console.error('Error details:', error);

//       const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
//       setError(errorMessage);
//       toast({
//         title: 'Error',
//         description: 'Failed to load booking details. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     console.log('=== BOOKING DETAILS COMPONENT MOUNTED ===');
//     console.log('Booking ID:', bookingId);

//     if (bookingId && bookingId !== 'undefined') {
//       fetchBookingDetails();
//     } else {
//       setError('Invalid booking ID');
//       setLoading(false);
//     }
//   }, [bookingId]);

//   const formatDate = (dateString: string) => {
//     try {
//       return format(new Date(dateString), 'MMMM do, yyyy');
//     } catch {
//       return dateString;
//     }
//   };

//   const formatDateTime = (dateString: string) => {
//     try {
//       return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
//     } catch {
//       return dateString;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status.toLowerCase()) {
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
//       case 'completed':
//         return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
//       case 'processing':
//         return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
//       default:
//         return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Link href="/dashboard/bookings">
//             <Button variant="outline" size="sm">
//               <ArrowLeft className="mr-2 h-4 w-4" />
//               Back to Bookings
//             </Button>
//           </Link>
//           <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
//         </div>
//         <Card>
//           <CardContent className="flex items-center justify-center py-10">
//             <div className="flex items-center">
//               <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
//               <span>Loading booking details...</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (error || !bookingData) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Link href="/dashboard/bookings">
//             <Button variant="outline" size="sm">
//               <ArrowLeft className="mr-2 h-4 w-4" />
//               Back to Bookings
//             </Button>
//           </Link>
//           <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
//         </div>
//         <Card>
//           <CardContent className="py-10">
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>
//                 {error || 'Booking not found'}
//                 <div className="mt-2">
//                   <Button onClick={fetchBookingDetails} variant="outline" size="sm">
//                     <RefreshCw className="mr-2 h-4 w-4" />
//                     Try Again
//                   </Button>
//                 </div>
//               </AlertDescription>
//             </Alert>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const { order, customer, address } = bookingData;
//   console.log('Parsed order_details:' + order.order_details);


//   // ✅ Parse order_details safely
//   let parsedOrderDetails: any[] = [];

//     // ✅ JSON Parse
//   try {
//     parsedOrderDetails = order.order_details ? JSON.parse(order.order_details) : [];
//     console.log('Parsed order_details:', parsedOrderDetails);
//   } catch (err) {
//     console.error('Invalid JSON', err);
//   }

//   console.log('Parsed order_details:' + parsedOrderDetails);

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center gap-4">
//         <Link href="/dashboard/bookings">
//           <Button variant="outline" size="sm">
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Back to Bookings
//           </Button>
//         </Link>
//         <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
//         <Button onClick={fetchBookingDetails} variant="outline" size="sm">
//           <RefreshCw className="mr-2 h-4 w-4" />
//           Refresh
//         </Button>
//       </div>

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* Order Information */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Package className="h-5 w-5" />
//               Order Information
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-muted-foreground">Order ID</p>
//                 <p className="font-medium">{order.order_display_no}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Status</p>
//                 <Badge className={getStatusColor(order.ord_status)}>
//                   {order.ord_status}
//                 </Badge>
//               </div>
//             </div>

//             <Separator />

//             <div className="space-y-3">
//               <div>
//                 <p className="text-sm text-muted-foreground">Service</p>
//                 <p className="font-medium">{order.service_name}</p>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Order Type</p>
//                   <p className="font-medium capitalize">{order.order_type}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Quantity</p>
//                   <p className="font-medium">{order.garment_qty} items</p>
//                 </div>
//               </div>
//             </div>

//             <Separator />

//             <div className="space-y-3">
//               <div className="flex items-center gap-2">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 <div>
//                   <p className="text-sm text-muted-foreground">Booking Date</p>
//                   <p className="font-medium">{order.booking_date}</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Clock className="h-4 w-4 text-muted-foreground" />
//                 <div>
//                   <p className="text-sm text-muted-foreground">Booking Time</p>
//                   <p className="font-medium">{order.booking_time}</p>
//                 </div>
//               </div>
//             </div>

//             <Separator />

//             <div>
//               <p className="text-sm text-muted-foreground">Created</p>
//               <p className="font-medium">{formatDateTime(order.createdAt)}</p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Customer Information */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <User className="h-5 w-5" />
//               Customer Information
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-3">
//               <div className="flex items-center gap-2">
//                 <User className="h-4 w-4 text-muted-foreground" />
//                 <div>
//                   <p className="text-sm text-muted-foreground">Name</p>
//                   <p className="font-medium">{customer.name}</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Phone className="h-4 w-4 text-muted-foreground" />
//                 <div>
//                   <p className="text-sm text-muted-foreground">Mobile</p>
//                   <p className="font-medium">{customer.mobile}</p>
//                 </div>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Email</p>
//                 <p className="font-medium">{customer.email || 'Not provided'}</p>
//               </div>
//             </div>

//             <Separator />

//             <div className="space-y-3">
//               <div>
//                 <p className="text-sm text-muted-foreground">Wallet Balance</p>
//                 <p className="font-medium text-green-600">₹{customer.wallet_balance}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Living Type</p>
//                 <Badge variant="secondary">{customer.living_type || 'Not specified'}</Badge>
//               </div>
//             </div>

//             <Separator />

//             <div>
//               <p className="text-sm text-muted-foreground">Customer Since</p>
//               <p className="font-medium">{formatDate(customer.createdAt)}</p>
//             </div>

//             <div className="pt-2">
//               <Link href={`/dashboard/customers/${customer._id}`}>
//                 <Button variant="outline" size="sm" className="w-full">
//                   View Customer Profile
//                 </Button>
//               </Link>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* Pricing Details */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Receipt className="h-5 w-5" />
//               Pricing Details
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Order Amount</span>
//                 <span>₹{order.order_amount}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Handling charge</span>
//                 <span>₹{order.handling_charges}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Delivery charge</span>
//                 <span>₹{order.delivery_charge}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Slot Amount</span>
//                 <span>₹{order.slot_charges}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Discount</span>
//                 <span className="text-green-600">-₹{order.garment_discount_amount}</span>
//               </div>
//             </div>

//             <Separator />

//             <div className="flex justify-between text-lg font-semibold">
//               <span>Total Amount</span>
//               <span>₹{order.total_billing}</span>
//             </div>

//             <Separator />

//             <div className="flex flex-1 justify-between">

//               <div>
//                 {/* <CreditCard className="h-4 w-4 text-muted-foreground" /> */}
//                 <p className="text-sm text-muted-foreground">Transaction ID</p>
//                 <p className="font-medium">{order.transaction_id}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Payment Status</p>
//                 <p className="font-medium text-green-600">{order.payment_status}</p>

//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Payment Method</p>
//                 <p className="font-medium">{order.payment_mode}</p>
//               </div>

//             </div>
//           </CardContent>

//         </Card>

//         {/* Delivery Address */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <MapPin className="h-5 w-5" />
//               Delivery Address
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-3">
//               <div>
//                 <p className="text-sm text-muted-foreground">Address Label</p>
//                 <p className="font-medium">{address.address_label}</p>
//                 {address.isPrimary && (
//                   <Badge variant="default" className="text-xs mt-1">Primary Address</Badge>
//                 )}
//               </div>

//               <div>
//                 <p className="text-sm text-muted-foreground">Full Address</p>
//                 <p className="font-medium">{address.format_address}</p>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">City</p>
//                   <p className="font-medium">{address.city}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">State</p>
//                   <p className="font-medium">{address.state}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Pincode</p>
//                   <p className="font-medium">{address.pincode}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Type</p>
//                   <p className="font-medium capitalize">{address.address_type}</p>
//                 </div>
//               </div>

//               {address.landmark && (
//                 <div>
//                   <p className="text-sm text-muted-foreground">Landmark</p>
//                   <p className="font-medium">{address.landmark}</p>
//                 </div>

//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
      

//       {/* Order Details */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Package className="h-5 w-5" />
//             Order Details
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {parsedOrderDetails.length === 0 ? (
//             <p className="text-sm text-muted-foreground">
//               No order details available
//             </p>
//           ) : (
//             parsedOrderDetails.map((service: any, index: number) => (
//               <div key={index} className="space-y-4 border rounded-lg p-4">

//                 {/* Service Info */}
//                 <div>
//                   <p className="font-semibold text-lg">{service.service}</p>
//                   <p className="text-sm text-muted-foreground">
//                     {service.description}
//                   </p>
//                   <p className="text-sm mt-1">
//                     <span className="font-medium">Duration:</span>{' '}
//                     {service.duration}
//                   </p>
//                 </div>

//                 <Separator />

//                 {/* Categories */}
//                 <div className="space-y-4">
//                   {service.categorys?.map((cat: any, i: number) => (
//                     <div key={i} className="border rounded-md p-3 space-y-2">

//                       {/* Category Header */}
//                       <div className="flex justify-between items-center">
//                         <p className="font-medium">{cat.category}</p>
//                         <Badge variant="secondary">
//                           ₹{cat.category_prices} × {cat.items}
//                         </Badge>
//                       </div>

//                       {/* Clothes Types */}
//                       <div>
//                         <p className="text-sm text-muted-foreground mb-1">
//                           Clothes Types:
//                         </p>
//                         <div className="flex flex-wrap gap-1">
//                           {cat.types_of_Clothes?.map(
//                             (cloth: string, idx: number) => (
//                               <Badge
//                                 key={idx}
//                                 variant="outline"
//                                 className="text-xs"
//                               >
//                                 {cloth}
//                               </Badge>
//                             )
//                           )}
//                         </div>
//                       </div>

//                       {/* Items */}
//                       <div className="flex justify-between text-sm">
//                         <span className="text-muted-foreground">Items</span>
//                         <span className="font-medium">{cat.items}</span>
//                       </div>

//                       {/* Total per category */}
//                       <div className="flex justify-between text-sm font-medium">
//                         <span>Total</span>
//                         <span>₹{cat.category_prices * cat.items}</span>
//                       </div>

//                     </div>
//                   ))}
//                 </div>

//               </div>
//             ))
//           )}
//         </CardContent>
//       </Card>


//       {/* Debug Information (remove in production) */}
//       {/* {process.env.NODE_ENV === 'development' && (
//         <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
//           <h4 className="font-semibold mb-2">Debug Info:</h4>
//           <p>Booking ID: {bookingId}</p>
//           <p>Loading: {loading.toString()}</p>
//           <p>Error: {error || 'None'}</p>
//           <p>Booking Data: {bookingData ? 'Loaded' : 'Not loaded'}</p>
//           <p>Order ID: {order?.order_display_no || 'N/A'}</p>
//           <p>Customer: {customer?.name || 'N/A'}</p>
//           <p>Address: {address?.address_label || 'N/A'}</p>
//         </div>
//       )} */}
//     </div>
//   );
// }