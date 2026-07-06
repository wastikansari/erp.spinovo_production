'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Eye,
  IndianRupee,
  Package,
  Phone,
  Shirt,
  User,
} from 'lucide-react';

import { BookingApiService, Booking } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeaderSection } from '@/components/ui/header-section';
import { Pagination } from '@/components/ui/pagination';

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'processing':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default function TodayBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const router = useRouter();
  const { toast } = useToast();

  const fetchTodayBookings = useCallback(async (page: number, limit: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await BookingApiService.getTodayBookings(page, limit);
      if (response.status && response.data) {
        setBookings(response.data.bookingList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalOrders(response.data.totalOrders || 0);
      } else {
        setError(response.msg || "Failed to fetch today's bookings");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({
        title: 'Error',
        description: "Failed to fetch today's bookings",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTodayBookings(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Today's Bookings"
        loading={loading}
        handleRefresh={() => fetchTodayBookings(currentPage, pageSize)}
      />

      <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-4 py-2 text-sm">
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span>
          Showing bookings created <span className="font-medium">today</span> ({format(new Date(), 'dd MMM yyyy')})
        </span>
      </div>

      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" />
            Today's Orders ({totalOrders})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* TABLE HEADER — desktop */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Order</div>
            <div>Customer</div>
            <div>Service</div>
            <div>Qty</div>
            <div>Time</div>
            <div>Amount</div>
            <div className="text-right">Status</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Package className="h-7 w-7 animate-pulse text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading today's bookings…</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Bookings Today</p>
              <p className="text-sm text-muted-foreground mt-1">
                No orders have been placed today yet.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="border-b last:border-b-0">
                {/* MOBILE CARD */}
                <div className="lg:hidden px-4 py-4 space-y-3 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                      className="font-bold text-primary hover:underline text-base"
                    >
                      {booking.order_display_no}
                    </button>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium shrink-0 ${getStatusClass(booking.ord_status)}`}>
                      {booking.ord_status}
                    </span>
                  </div>

                  {booking.customer_details && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground leading-tight">
                          {booking.customer_details.name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {booking.customer_details.mobile || '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Shirt className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground">{booking.garment_qty}</span>
                      <span>garments</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-0.5 font-semibold text-foreground">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span>{booking.total_billing?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-lg h-8 text-xs"
                    onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Details
                  </Button>
                </div>

                {/* DESKTOP ROW */}
                <div className="hidden lg:grid lg:grid-cols-7 gap-3 px-5 py-4 items-center hover:bg-muted/5 transition-colors">
                  <div>
                    <button
                      onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                      className="font-semibold text-primary hover:underline text-sm"
                    >
                      {booking.order_display_no}
                    </button>
                  </div>

                  <div className="min-w-0">
                    {booking.customer_details ? (
                      <>
                        <p className="font-medium text-sm truncate">
                          {booking.customer_details.name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {booking.customer_details.mobile || '—'}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground truncate">{booking.service_name}</div>

                  <div className="font-medium text-sm">{booking.garment_qty}</div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {booking.booking_time}
                  </div>

                  <div className="font-semibold text-sm flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {booking.total_billing?.toLocaleString('en-IN')}
                  </div>

                  <div className="flex justify-end items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(booking.ord_status)}`}>
                      {booking.ord_status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && bookings.length > 0 && (
            <div className="px-5 py-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                loading={loading}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
