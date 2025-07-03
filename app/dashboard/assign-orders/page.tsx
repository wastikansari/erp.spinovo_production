'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  RefreshCw, 
  AlertCircle,
  UserCheck,
  MoreHorizontal,
  Eye,
  Package,
  User,
  MapPin,
  Calendar,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { AssignApiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { logger } from '@/lib/utils/logger';
import { errorHandler } from '@/lib/utils/error-handler';
import { AssignBooking } from '@/lib/types/assign';

export default function AssignOrdersPage() {
  const [assignedBookings, setAssignedBookings] = useState<AssignBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchAssignedBookings = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      
      logger.info('Fetching assigned bookings', { page }, 'AssignOrdersPage');
      
      const response = await AssignApiService.getAssignedBookings(page, 20);
      
      if (response.status && response.data) {
        setAssignedBookings(response.data.assignList || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
        
        logger.info('Assigned bookings loaded successfully', { 
          count: response.data.assignList?.length || 0 
        }, 'AssignOrdersPage');
        
        if (response.data.assignList && response.data.assignList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.assignList.length} assigned orders`,
          });
        }
      } else {
        const errorMsg = response.msg || 'Failed to fetch assigned bookings';
        setError(errorMsg);
        logger.error('API Error', { message: errorMsg }, 'AssignOrdersPage');
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        setAssignedBookings([]);
      }
    } catch (error) {
      const handledError = errorHandler.handle(error as Error, 'AssignOrdersPage.fetchAssignedBookings');
      setError(handledError.message);
      logger.error('Failed to fetch assigned bookings', { error: handledError }, 'AssignOrdersPage');
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setAssignedBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedBookings(currentPage);
  }, [currentPage]);

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
      case 'assign':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getAssignStatusColor = (status: number) => {
    return status === 1
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const handleViewBookingDetails = (bookingId: string) => {
    router.push(`/dashboard/bookings/${bookingId}`);
  };

  const handleViewCopilotDetails = (copilotId: string) => {
    router.push(`/dashboard/copilots/${copilotId}`);
  };

  const handleRefresh = () => {
    logger.info('Manual refresh triggered', undefined, 'AssignOrdersPage');
    fetchAssignedBookings(currentPage);
  };

  const columns = [
    {
      key: 'order_display_no',
      header: 'Order ID',
      render: (assignBooking: AssignBooking) => (
        <span className="font-medium">{assignBooking.order_details.order_display_no}</span>
      ),
    },
    {
      key: 'service_name',
      header: 'Service',
      render: (assignBooking: AssignBooking) => (
        <span>{assignBooking.order_details.service_name}</span>
      ),
    },
    {
      key: 'copilot_name',
      header: 'Assigned Copilot',
      render: (assignBooking: AssignBooking) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{assignBooking.copilot_details.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {assignBooking.copilot_details.mobile}
            </p>
          </div>
        </div>
      ),
      searchable: false,
    },
    {
      key: 'order_amount',
      header: 'Amount',
      render: (assignBooking: AssignBooking) => (
        <span className="font-medium">₹{assignBooking.order_details.order_amount}</span>
      ),
      searchable: false,
    },
    {
      key: 'booking_date',
      header: 'Booking Date & Time',
      render: (assignBooking: AssignBooking) => (
        <div className="text-sm">
          <p>{assignBooking.order_details.booking_date}</p>
          <p className="text-muted-foreground">{assignBooking.order_details.booking_time}</p>
        </div>
      ),
      searchable: false,
    },
    {
      key: 'address',
      header: 'Address',
      render: (assignBooking: AssignBooking) => (
        <div className="flex items-start gap-2 max-w-[200px]">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">{assignBooking.address_details.flat_no}</p>
            <p className="text-muted-foreground truncate">{assignBooking.address_details.street}, {assignBooking.address_details.landmark}</p>
          </div>
        </div>
      ),
      searchable: false,
    },
    {
      key: 'ord_status',
      header: 'Order Status',
      render: (assignBooking: AssignBooking) => (
        <Badge className={getStatusColor(assignBooking.order_details.ord_status)}>
          {assignBooking.order_details.ord_status}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'assign_status',
      header: 'Assign Status',
      render: (assignBooking: AssignBooking) => (
        <Badge className={getAssignStatusColor(assignBooking.status)}>
          {assignBooking.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'createdAt',
      header: 'Assigned At',
      render: (assignBooking: AssignBooking) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(assignBooking.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (assignBooking: AssignBooking) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewBookingDetails(assignBooking.booking_id)}>
          <Package className="mr-2 h-4 w-4" />
          View Booking
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleViewCopilotDetails(assignBooking.copilot_id)}>
          <User className="mr-2 h-4 w-4" />
          View Copilot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (loading && assignedBookings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Assigned Orders</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <LoadingSpinner size="lg" text="Loading assigned orders..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Assigned Orders</h1>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Assigned Order Management
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Total Assigned Orders: {totalCount}
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
              data={assignedBookings}
              columns={columns}
              loading={loading}
              searchPlaceholder="Search assigned orders..."
              emptyMessage={error ? "Failed to load assigned orders." : "No assigned orders found."}
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
    </ErrorBoundary>
  );
}