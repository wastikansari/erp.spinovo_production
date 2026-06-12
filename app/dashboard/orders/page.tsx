
'use client';
import { Badge } from '@/components/ui/badge';
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
    UserCheck,
    Layers3,
    IndianRupee,
    ListOrdered,
    Hash,
    Shirt,
    Droplets,
    Wind,
    Footprints,
    Flame,
    Sparkles,
    Clock,
    User,
    Phone,
} from 'lucide-react';

import { BookingApiService, Booking, SubOrder } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// import { AssignBookingForm } from '@/components/forms/assign-booking-form';

// ─── Service Color System ────────────────────────────────────────────────────

type ServiceColorKey =
    | 'quick-ironing'
    | 'ironing'
    | 'wash-ironing'
    | 'wash'
    | 'dry-cleaning'
    | 'shoes-cleaning'
    | 'default';

interface ServiceTheme {
    border: string;
    badge: string;
    bg: string;
    dot: string;
    icon: React.ReactNode;
    label: string;
}

const SERVICE_ABBREV: Record<string, ServiceColorKey> = {
    QI: 'quick-ironing',
    I: 'ironing',
    W: 'wash',
    WI: 'wash-ironing',
    DC: 'dry-cleaning',
    SC: 'shoes-cleaning',
};

function abbrevFromSubOrderNo(subOrderNo: string): string {
    const parts = subOrderNo?.split('-') ?? [];
    return parts[parts.length - 1]?.toUpperCase() ?? '';
}

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
    'quick-ironing': {
        border: 'border-l-orange-400',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        bg: 'bg-orange-50',
        dot: 'bg-orange-400',
        icon: <Flame className="h-3.5 w-3.5" />,
        label: 'Quick Ironing',
    },
    ironing: {
        border: 'border-l-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        bg: 'bg-yellow-50',
        dot: 'bg-yellow-400',
        icon: <Shirt className="h-3.5 w-3.5" />,
        label: 'Ironing',
    },
    'wash-ironing': {
        border: 'border-l-purple-400',
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        bg: 'bg-purple-50',
        dot: 'bg-purple-400',
        icon: <Sparkles className="h-3.5 w-3.5" />,
        label: 'Wash + Ironing',
    },
    wash: {
        border: 'border-l-blue-400',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        bg: 'bg-blue-50',
        dot: 'bg-blue-400',
        icon: <Droplets className="h-3.5 w-3.5" />,
        label: 'Wash',
    },
    'dry-cleaning': {
        border: 'border-l-teal-400',
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
        bg: 'bg-teal-50',
        dot: 'bg-teal-400',
        icon: <Wind className="h-3.5 w-3.5" />,
        label: 'Dry Cleaning',
    },
    'shoes-cleaning': {
        border: 'border-l-stone-400',
        badge: 'bg-stone-100 text-stone-700 border-stone-200',
        bg: 'bg-stone-50',
        dot: 'bg-stone-400',
        icon: <Footprints className="h-3.5 w-3.5" />,
        label: 'Shoes Cleaning',
    },
    default: {
        border: 'border-l-gray-300',
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        bg: 'bg-gray-50',
        dot: 'bg-gray-400',
        icon: <Package className="h-3.5 w-3.5" />,
        label: 'Service',
    },
};

function resolveServiceKey(name: string): ServiceColorKey {
    const n = name?.toLowerCase() ?? '';
    if (n.includes('quick') && n.includes('iron')) return 'quick-ironing';
    if (n.includes('wash') && (n.includes('iron') || n.includes('+'))) return 'wash-ironing';
    if (n.includes('dry')) return 'dry-cleaning';
    if (n.includes('shoe')) return 'shoes-cleaning';
    if (n.includes('iron')) return 'ironing';
    if (n.includes('wash')) return 'wash';
    return 'default';
}

// ─── Status Badge ────────────────────────────────────────────────────────────

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

function formatDate(dateString: string) {
    if (!dateString) return '—';
    try {
        // Handle DD/MM/YYYY from API
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [dd, mm, yyyy] = dateString.split('/');
            return format(new Date(`${yyyy}-${mm}-${dd}`), 'dd MMM yyyy');
        }
        return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
        return dateString;
    }
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function ServiceLegend() {
    const keys: ServiceColorKey[] = [
        'quick-ironing',
        'ironing',
        'wash',
        'wash-ironing',
        'dry-cleaning',
        'shoes-cleaning',
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {keys.map((k) => {
                const t = SERVICE_THEMES[k];
                return (
                    <div
                        key={k}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${t.badge}`}
                    >
                        {t.icon}
                        {t.label}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Sub-order Card ───────────────────────────────────────────────────────────

function parseGarmentDetails(raw: any): any[] {
    if (!raw) return [];
    try {
        const str = Array.isArray(raw) ? raw[0] : raw;
        const parsed = typeof str === 'string' ? JSON.parse(str) : str;
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [];
    }
}

function SubOrderCard({
    sub,
    onViewDetails,
}: {
    sub: SubOrder;
    onViewDetails: (id: string) => void;
}) {
    const theme = SERVICE_THEMES[resolveServiceKey(sub.service_name)];
    const garmentDetails = parseGarmentDetails(sub.garment_details);

    return (
        <div
            className={`border border-l-4 ${theme.border} rounded-xl overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow`}
        >
            {/* Header stripe */}
            <div className={`${theme.bg} px-4 py-2.5 flex items-center justify-between border-b`}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold shrink-0 ${theme.badge}`}>
                        {theme.icon}
                        {sub.service_name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono truncate">
                        {sub.sub_order_no}
                    </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium shrink-0 ${getStatusClass(sub.ord_status)}`}>
                    {sub.ord_status}
                </span>
            </div>

            {/* Meta row */}
            <div className="px-4 py-3 space-y-2 border-b">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Shirt className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-semibold text-foreground">{sub.garment_qty}</span>
                        <span>garments</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-semibold text-foreground">
                            {sub.garment_amount?.toLocaleString('en-IN')}
                        </span>
                    </div>
                    {sub.no_of_bag > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Package className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.no_of_bag} bag{sub.no_of_bag > 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {sub.service_duration_hours > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.service_duration_hours}h duration</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Pickup:</span>
                        <span className="text-foreground font-medium">
                            {formatDate(sub.booking_date)}, {sub.booking_time}
                        </span>
                    </div>
                    {sub.expected_delivery_date && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>Delivery:</span>
                            <span className="text-foreground font-medium">
                                {formatDate(sub.expected_delivery_date)}, {sub.expected_delivery_time}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions row */}
            <div className="px-4 py-2.5 flex justify-end gap-2 border-b">
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8 text-xs"
                        onClick={() => onViewDetails(sub._id)}
                    >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Details
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(sub._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Sub Order
                            </DropdownMenuItem>
                            {/* <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign Sub Order
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Update Status
                            </DropdownMenuItem> */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Garment details */}
            {/* {garmentDetails.length > 0 && (
                <div className="px-4 py-4 space-y-4">
                    {garmentDetails.map((svc: any, i: number) => (
                        <div key={i}>
                         
                            {(svc.service || svc.description) && (
                                <div className="mb-3">
                                    {svc.service && (
                                        <p className="font-semibold text-sm">{svc.service}</p>
                                    )}
                                    {svc.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {svc.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {svc.categorys?.length > 0 && (
                                <div className="space-y-3">
                                    {svc.categorys.map((cat: any, ci: number) => (
                                        <div
                                            key={ci}
                                            className="rounded-lg border bg-muted/20 p-3 space-y-2"
                                        >
                                          
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">
                                                    {cat.category}
                                                </p>
                                                {cat.category_prices !== undefined && (
                                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                                        <IndianRupee className="h-3 w-3" />
                                                        {cat.category_prices}
                                                    </span>
                                                )}
                                            </div>

                                        
                                            {cat.types_of_Clothes?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {cat.types_of_Clothes.map(
                                                        (cloth: string, ci2: number) => (
                                                            <span
                                                                key={ci2}
                                                                className={`px-2 py-0.5 rounded-full border text-xs font-medium ${theme.badge}`}
                                                            >
                                                                {cloth}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {cat.items !== undefined && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                                                    <Shirt className="h-3 w-3" />
                                                    <span>
                                                        Items:{' '}
                                                        <span className="font-semibold text-foreground">
                                                            {cat.items}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )} */}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function PaginationBar({
    currentPage,
    totalPages,
    totalOrders,
    pageSize,
    loading,
    onPageChange,
    onPageSizeChange,
}: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    pageSize: number;
    loading: boolean;
    onPageChange: (p: number) => void;
    onPageSizeChange: (size: number) => void;
}) {
    const from = totalOrders === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalOrders);

    const getPageNumbers = () => {
        const pages: (number | '…')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('…');
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            )
                pages.push(i);
            if (currentPage < totalPages - 2) pages.push('…');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t">
            {/* Left: rows-per-page + info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="shrink-0">Rows per page:</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => onPageSizeChange(Number(v))}
                        disabled={loading}
                    >
                        <SelectTrigger className="h-8 w-20 rounded-lg text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <SelectItem key={n} value={String(n)} className="text-xs">
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {totalOrders > 0 && (
                    <span>
                        <span className="font-medium text-foreground">{from}–{to}</span>
                        {' '}of{' '}
                        <span className="font-medium text-foreground">{totalOrders}</span>
                        {' '}orders
                    </span>
                )}
            </div>

            {/* Right: page buttons */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                    >
                        Prev
                    </Button>
                    {getPageNumbers().map((p, i) =>
                        p === '…' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">
                                …
                            </span>
                        ) : (
                            <Button
                                key={p}
                                variant={p === currentPage ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={() => onPageChange(p as number)}
                                disabled={loading}
                            >
                                {p}
                            </Button>
                        )
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    // const [showAssignForm, setShowAssignForm] = useState(false);
    // const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const router = useRouter();
    const { toast } = useToast();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchBookings(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const fetchBookings = async (page: number, limit: number) => {
        try {
            setLoading(true);
            setError('');
            const response = await BookingApiService.getBookings(page, limit);
            if (response.status && response.data) {
                setBookings(response.data.bookingList || []);
                setTotalPages(response.data.total_pages || 1);
                setCurrentPage(response.data.currentPage || 1);
                setTotalOrders(response.data.totalOrders || 0);
            } else {
                setError(response.msg || 'Failed to fetch bookings');
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred');
            toast({
                title: 'Error',
                description: 'Failed to fetch bookings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) =>
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );

    const handlePageChange = (page: number) => {
        setExpandedRows([]);
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setExpandedRows([]);
        setPageSize(size);
        setCurrentPage(1);
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
        <div className="space-y-5 p-4 md:p-6">
            {/* PAGE HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage orders, sub-orders and assignments
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchBookings(currentPage, pageSize)}
                    disabled={loading}
                    className="rounded-xl self-start"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pending Orders</p>
                            <p className="text-2xl font-bold mt-0.5">{pendingOrders}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pickup Assigned</p>
                            <p className="text-2xl font-bold mt-0.5">{pickupAssignedOrders}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <Layers3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Processing Assigned</p>
                            <p className="text-2xl font-bold mt-0.5">{processingAssignedOrders}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <Layers3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Delivery Assigned</p>
                            <p className="text-2xl font-bold mt-0.5">{deliveryAssignedOrders}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LEGEND */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
                    Service Types:
                </span>
                <ServiceLegend />
            </div>

            {/* MAIN CARD */}
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ListOrdered className="h-5 w-5" />
                        Orders List
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
                    <div className="hidden lg:grid lg:grid-cols-9 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <div>Order</div>
                        <div>Service</div>
                        <div>Customer</div>
                        <div>Qty</div>
                        <div>Pickup Date</div>
                        <div>Time</div>
                        <div>Amount</div>
                        <div>Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading orders…</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="py-24 text-center">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="font-semibold text-lg">No Orders Found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Try refreshing or changing filters
                            </p>
                        </div>
                    ) : (
                        bookings.map((booking) => {
                            const isExpanded = expandedRows.includes(booking._id);
                            const subCount = booking.sub_orders?.length ?? 0;
                            return (
                                <div key={booking._id} className="border-b last:border-b-0">
                                    {/* MOBILE CARD */}
                                    <div className={`lg:hidden px-4 py-4 space-y-3 transition-colors ${isExpanded ? 'bg-muted/10' : 'hover:bg-muted/5'}`}>
                                        {/* Order no + status */}
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => toggleRow(booking._id)}
                                                className="font-bold text-primary hover:underline text-base"
                                            >
                                                {booking.order_display_no}
                                            </button>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium shrink-0 ${getStatusClass(booking.ord_status)}`}>
                                                {booking.ord_status}
                                            </span>
                                        </div>

                                        {/* Customer info */}
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

                                        {/* Details */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Shirt className="h-3.5 w-3.5 shrink-0" />
                                                <span className="font-medium text-foreground">{booking.garment_qty}</span>
                                                <span>garments</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                <span>{formatDate(booking.booking_date)}, {booking.booking_time}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 font-semibold text-foreground">
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                <span>{booking.total_billing?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Footer: sub-orders + actions */}
                                        <div className="flex items-center justify-between">
                                            {subCount > 0 ? (
                                                <button
                                                    onClick={() => toggleRow(booking._id)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    {subCount} sub-order{subCount > 1 ? 's' : ''} {isExpanded ? '▲' : '▼'}
                                                </button>
                                            ) : <span />}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleRow(booking._id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Sub-Orders
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* DESKTOP ROW */}
                                    <div className={`hidden lg:grid lg:grid-cols-9 gap-3 px-5 py-4 items-center transition-colors ${isExpanded ? 'bg-muted/10' : 'hover:bg-muted/5'}`}>
                                        {/* ORDER ID */}
                                        <div>
                                            <button
                                                onClick={() => toggleRow(booking._id)}
                                                className="font-semibold text-primary hover:underline text-sm"
                                            >
                                                {booking.order_display_no}
                                            </button>
                                            {subCount > 0 && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {subCount} sub-order{subCount > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                        {/* SERVICE */}
                                        <div className="flex flex-wrap gap-1">
                                            {booking.sub_orders?.map((sub) => {
                                                const abbrev = abbrevFromSubOrderNo(sub.sub_order_no);
                                                const key = SERVICE_ABBREV[abbrev] ?? 'default';
                                                const t = SERVICE_THEMES[key];
                                                return (
                                                    <span
                                                        key={sub._id}
                                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-semibold ${t.badge}`}
                                                        title={t.label}
                                                    >
                                                        {t.icon}
                                                        {abbrev}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* CUSTOMER */}
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

                                        {/* QTY */}
                                        <div className="font-medium text-sm">
                                            {booking.garment_qty}
                                        </div>

                                        {/* PICKUP DATE */}
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            {formatDate(booking.booking_date)}
                                        </div>

                                        {/* PICKUP TIME */}
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                            {booking.booking_time}
                                        </div>

                                        {/* AMOUNT */}
                                        <div className="font-semibold text-sm flex items-center gap-0.5">
                                            <IndianRupee className="h-3.5 w-3.5" />
                                            {booking.total_billing?.toLocaleString('en-IN')}
                                        </div>

                                        {/* ORDER STATUS */}
                                        <div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(booking.ord_status)}`}>
                                                {booking.ord_status}
                                            </span>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleRow(booking._id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Sub-Orders
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* SUB-ORDERS PANEL */}
                                    {isExpanded && (
                                        <div className="bg-muted/10 border-t px-5 py-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-6 w-1 rounded-full bg-primary" />
                                                <h3 className="font-semibold text-sm">
                                                    Sub Orders
                                                </h3>
                                                {subCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                        {subCount}
                                                    </span>
                                                )}
                                            </div>

                                            {subCount > 0 ? (
                                                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                                                    {booking.sub_orders!.map((sub) => (
                                                        <SubOrderCard
                                                            key={sub._id}
                                                            sub={sub}
                                                            onViewDetails={(id) =>
                                                                router.push(
                                                                    `/dashboard/bookings/sub-order/${id}`
                                                                )
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 border rounded-xl bg-background">
                                                    <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm font-medium">
                                                        No Sub Orders
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Sub orders will appear here once created
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* PAGINATION */}
                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalOrders={totalOrders}
                        pageSize={pageSize}
                        loading={loading}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </CardContent>
            </Card>

            {/* ASSIGN FORM */}
            {/* <AssignBookingForm
                open={showAssignForm}
                onOpenChange={setShowAssignForm}
                booking={selectedBooking}
                onSuccess={() => fetchBookings(currentPage)}
            /> */}
        </div>
    );
}
