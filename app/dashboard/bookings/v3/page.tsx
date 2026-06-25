

'use client';

import { useEffect, useState } from 'react';

import { format } from 'date-fns';

import { useRouter } from 'next/navigation';

import {
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronRight,
    Eye,
    MoreHorizontal,
    Package,
    RefreshCw,
    Shirt,
    UserCheck,
} from 'lucide-react';

import { BookingApiService, Booking } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';

import { Pagination } from '@/components/ui/pagination';

import { AssignBookingForm } from '@/components/forms/assign-booking-form';

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);

    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);

    const [totalOrders, setTotalOrders] = useState(0);

    const [error, setError] = useState('');

    const [expandedRows, setExpandedRows] = useState<
        string[]
    >([]);

    const [showAssignForm, setShowAssignForm] =
        useState(false);

    const [selectedBooking, setSelectedBooking] =
        useState<Booking | null>(null);

    const router = useRouter();

    const { toast } = useToast();

    const fetchBookings = async (page: number) => {
        try {
            setLoading(true);

            setError('');

            const response =
                await BookingApiService.getBookings(page, 20);

            if (response.status && response.data) {
                setBookings(response.data.bookingList || []);

                setTotalPages(
                    response.data.total_pages || 1
                );

                setCurrentPage(
                    response.data.currentPage || 1
                );

                setTotalOrders(
                    response.data.totalOrders || 0
                );
            } else {
                setError(
                    response.msg || 'Failed to fetch orders'
                );

                toast({
                    title: 'Error',
                    description:
                        response.msg ||
                        'Failed to fetch bookings',
                    variant: 'destructive',
                });
            }
        } catch {
            setError('Network error occurred');

            toast({
                title: 'Error',
                description:
                    'Something went wrong while fetching orders',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(currentPage);
    }, [currentPage]);

    const toggleRow = (id: string) => {
        setExpandedRows((prev) =>
            prev.includes(id)
                ? prev.filter((rowId) => rowId !== id)
                : [...prev, id]
        );
    };

    const handleAssignBooking = (
        booking: Booking
    ) => {
        setSelectedBooking(booking);

        setShowAssignForm(true);
    };

    const handleAssignSuccess = () => {
        fetchBookings(currentPage);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(
                new Date(dateString),
                'dd MMM yyyy'
            );
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
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
                return 'bg-muted text-muted-foreground border';
        }
    };

    const getOrderTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'express':
                return 'bg-purple-100 text-purple-700';

            case 'premium':
                return 'bg-blue-100 text-blue-700';

            case 'regular':
                return 'bg-gray-100 text-gray-700';

            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const pendingOrders = bookings.filter(
        (order) => order.ord_status === 'Pending'
    ).length;

    const pickupAssignedOrders = bookings.filter(
        (order) => order.ord_status === 'Pickup Assigned'
    ).length;

    const processingAssignedOrders = bookings.filter(
        (order) =>
            order.ord_status === 'Processing Assigned'
    ).length;

    const deliveryAssignedOrders = bookings.filter(
        (order) => order.ord_status === 'Delivery Assigned'
    ).length;

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* HEADER */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Order Management
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        Manage main orders, sub orders,
                        assignments and order tracking
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() =>
                        fetchBookings(currentPage)
                    }
                    disabled={loading}
                    className="rounded-xl"
                >
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''
                            }`}
                    />

                    Refresh
                </Button>
            </div>

            {/* STATS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* PENDING */}

                <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100/40">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-yellow-700">
                                    Pending Orders
                                </p>

                                <h2 className="text-4xl font-bold mt-2 text-yellow-900">
                                    {pendingOrders}
                                </h2>

                                <p className="text-xs text-yellow-600 mt-2">
                                    Waiting for assignment
                                </p>
                            </div>

                            <div className="h-14 w-14 rounded-2xl bg-yellow-200/60 flex items-center justify-center">
                                <Package className="h-7 w-7 text-yellow-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PICKUP ASSIGNED */}

                <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/40">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">
                                    Pickup Assigned
                                </p>

                                <h2 className="text-4xl font-bold mt-2 text-blue-900">
                                    {pickupAssignedOrders}
                                </h2>

                                <p className="text-xs text-blue-600 mt-2">
                                    Pickup partner assigned
                                </p>
                            </div>

                            <div className="h-14 w-14 rounded-2xl bg-blue-200/60 flex items-center justify-center">
                                <Calendar className="h-7 w-7 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PROCESSING ASSIGNED */}

                <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/40">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-700">
                                    Processing Assigned
                                </p>

                                <h2 className="text-4xl font-bold mt-2 text-orange-900">
                                    {processingAssignedOrders}
                                </h2>

                                <p className="text-xs text-orange-600 mt-2">
                                    Processing team assigned
                                </p>
                            </div>

                            <div className="h-14 w-14 rounded-2xl bg-orange-200/60 flex items-center justify-center">
                                <RefreshCw className="h-7 w-7 text-orange-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DELIVERY ASSIGNED */}

                <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/40">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">
                                    Delivery Assigned
                                </p>

                                <h2 className="text-4xl font-bold mt-2 text-green-900">
                                    {deliveryAssignedOrders}
                                </h2>

                                <p className="text-xs text-green-600 mt-2">
                                    Ready for delivery
                                </p>
                            </div>

                            <div className="h-14 w-14 rounded-2xl bg-green-200/60 flex items-center justify-center">
                                <UserCheck className="h-7 w-7 text-green-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ERROR */}

            {error && (
                <Alert
                    variant="destructive"
                    className="rounded-xl"
                >
                    <AlertCircle className="h-4 w-4" />

                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* ORDER LIST */}

            <div className="space-y-4">
                {loading ? (
                    <Card className="rounded-2xl">
                        <CardContent className="p-10 flex justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                        </CardContent>
                    </Card>
                ) : bookings.length === 0 ? (
                    <Card className="rounded-2xl">
                        <CardContent className="p-10 text-center">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

                            <h3 className="text-lg font-semibold">
                                No Orders Found
                            </h3>

                            <p className="text-muted-foreground">
                                Orders will appear here once created
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    bookings.map((booking) => (
                        <Card
                            key={booking._id}
                            className="rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            {/* MAIN ORDER */}

                            <div
                                className="p-5 cursor-pointer hover:bg-muted/30 transition"
                                onClick={() =>
                                    toggleRow(booking._id)
                                }
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                    {/* LEFT */}

                                    <div className="flex items-start gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full"
                                        >
                                            {expandedRows.includes(
                                                booking._id
                                            ) ? (
                                                <ChevronDown className="h-5 w-5" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5" />
                                            )}
                                        </Button>

                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-bold">
                                                    {
                                                        booking.order_display_no
                                                    }
                                                </h2>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getOrderTypeColor(
                                                        booking.order_type
                                                    )}`}
                                                >
                                                    {booking.order_type}
                                                </span>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                                        booking.ord_status
                                                    )}`}
                                                >
                                                    {booking.ord_status}
                                                </span>
                                            </div>

                                            <p className="text-muted-foreground text-sm">
                                                {booking.service_name}
                                            </p>

                                            <div className="flex flex-wrap gap-5 text-sm">
                                                <div>
                                                    Qty:{' '}
                                                    <span className="font-semibold">
                                                        {
                                                            booking.garment_qty
                                                        }
                                                    </span>
                                                </div>

                                                <div>
                                                    Amount:{' '}
                                                    <span className="font-semibold">
                                                        ₹
                                                        {
                                                            booking.total_billing
                                                        }
                                                    </span>
                                                </div>

                                                <div>
                                                    Booking Date:{' '}
                                                    <span className="font-semibold">
                                                        {formatDate(
                                                            booking.booking_date
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT */}

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                router.push(
                                                    `/dashboard/bookings/${booking._id}`
                                                );
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                asChild
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        router.push(
                                                            `/dashboard/bookings/${booking._id}`
                                                        )
                                                    }
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {booking.order_stage_id ===
                                                    1 && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleAssignBooking(
                                                                    booking
                                                                )
                                                            }
                                                        >
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Assign Main Order
                                                        </DropdownMenuItem>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>

                            {/* SUB ORDERS */}

                            {expandedRows.includes(
                                booking._id
                            ) && (
                                    <div className="border-t bg-muted/20 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Sub Orders
                                                </h3>

                                                <p className="text-sm text-muted-foreground">
                                                    Manage sub orders,
                                                    assignments and details
                                                </p>
                                            </div>
                                        </div>

                                        {booking.sub_orders
                                            ?.length ? (
                                            <div className="grid gap-4">
                                                {booking.sub_orders.map(
                                                    (sub) => (
                                                        <div
                                                            key={sub._id}
                                                            className="bg-background border rounded-2xl p-5 hover:shadow-sm transition"
                                                        >
                                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                                {/* LEFT */}

                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h4 className="font-bold text-base">
                                                                            {
                                                                                sub.sub_order_no
                                                                            }
                                                                        </h4>

                                                                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                                            {
                                                                                sub.service_name
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                                                                        <div>
                                                                            Qty:{' '}
                                                                            {
                                                                                sub.garment_qty
                                                                            }
                                                                        </div>

                                                                        <div>
                                                                            Amount: ₹
                                                                            {
                                                                                sub.garment_amount
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* ACTIONS */}

                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-xl"
                                                                        onClick={() =>
                                                                            router.push(
                                                                                `/dashboard/bookings/sub-order/${sub._id}`
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        Details
                                                                    </Button>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                            >
                                                                                <MoreHorizontal className="h-5 w-5" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>

                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    router.push(
                                                                                        `/dashboard/bookings/sub-orders/${sub._id}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Eye className="mr-2 h-4 w-4" />
                                                                                View Sub Order
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuSeparator />

                                                                            <DropdownMenuItem>
                                                                                <UserCheck className="mr-2 h-4 w-4" />
                                                                                Assign Sub Order
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem>
                                                                                <Package className="mr-2 h-4 w-4" />
                                                                                Update Status
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 border rounded-2xl bg-background">
                                                <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />

                                                <p className="font-medium">
                                                    No Sub Orders
                                                </p>

                                                <p className="text-sm text-muted-foreground">
                                                    Sub orders will appear
                                                    here
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </Card>
                    ))
                )}
            </div>

            {/* PAGINATION */}

            <Card className="rounded-2xl">
                <CardContent className="p-5">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            {/* ASSIGN FORM */}

            <AssignBookingForm
                open={showAssignForm}
                onOpenChange={setShowAssignForm}
                booking={selectedBooking}
                onSuccess={handleAssignSuccess}
            />
        </div>
    );
}

