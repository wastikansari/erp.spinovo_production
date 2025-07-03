'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RefreshCw, MoreHorizontal, Eye, Package, Calendar, AlertCircle, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { BookingApiService, Booking } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { AssignBookingForm } from '@/components/forms/assign-booking-form';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string>('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchBookings = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await BookingApiService.getBookings(page, 20);
      
      if (response.status && response.data) {
        setBookings(response.data.bookingList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalOrders(response.data.totalOrders || 0);
        
        if (response.data.bookingList && response.data.bookingList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.bookingList.length} bookings`,
          });
        }
      } else {
        setError(response.msg || 'Failed to fetch bookings');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch bookings',
          variant: 'destructive',
        });
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'assign':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/dashboard/bookings/${bookingId}`);
  };

  const handleAssignBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowAssignForm(true);
  };

  const handleAssignSuccess = () => {
    fetchBookings(currentPage);
  };

  const handleRefresh = () => {
    fetchBookings(currentPage);
  };

  const columns = [
    {
      key: 'order_display_no',
      header: 'Order ID',
      render: (booking: Booking) => (
        <span className="font-medium">{booking.order_display_no}</span>
      ),
    },
    {
      key: 'order_type',
      header: 'Order Type',
      render: (booking: Booking) => (
        <span className="capitalize">{booking.order_type}</span>
      ),
    },
    {
      key: 'service_name',
      header: 'Service Name',
    },
    {
      key: 'garment_qty',
      header: 'Quantity',
    },
    {
      key: 'booking_date',
      header: 'Booking Date',
    },
    {
      key: 'booking_time',
      header: 'Booking Time',
    },
    {
      key: 'order_amount',
      header: 'Amount',
      render: (booking: Booking) => (
        <span className="font-medium">₹{booking.order_amount}</span>
      ),
      searchable: false,
    },
    {
      key: 'ord_status',
      header: 'Status',
      render: (booking: Booking) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            booking.ord_status
          )}`}
        >
          {booking.ord_status}
        </span>
      ),
      searchable: false,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (booking: Booking) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(booking.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (booking: Booking) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(booking._id)}>
          <Eye className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>
        {booking.order_stage_id === 1 && (
          <DropdownMenuItem onClick={() => handleAssignBooking(booking)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Assign
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Booking Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Orders: {totalOrders}
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
            data={bookings}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search bookings..."
            emptyMessage={error ? "Failed to load bookings." : "No bookings found."}
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

      <AssignBookingForm
        open={showAssignForm}
        onOpenChange={setShowAssignForm}
        booking={selectedBooking}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
}