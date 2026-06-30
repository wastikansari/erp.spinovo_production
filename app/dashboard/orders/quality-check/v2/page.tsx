'use client';
import { Badge } from '@/components/ui/badge';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    Calendar,
    Eye,
    Package,
    RefreshCw,
    Layers3,
    IndianRupee,
    ListOrdered,
    Shirt,
    Droplets,
    Wind,
    Footprints,
    Flame,
    Sparkles,
    Clock,
    CheckCircle2,
    Search,  // ← NEW
    X,       // ← NEW
    Filter,  // ← NEW
} from 'lucide-react';

import { BookingApiService, PendingQCOrder } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

// ── NEW: service filter options ───────────────────────────────────────────────
const SERVICE_FILTER_OPTIONS: {
    value: ServiceColorKey | 'all';
    label: string;
    icon: React.ReactNode;
}[] = [
        { value: 'all', label: 'All Services', icon: <Filter className="h-3.5 w-3.5" /> },
        { value: 'quick-ironing', label: 'Quick Ironing', icon: <Flame className="h-3.5 w-3.5" /> },
        { value: 'ironing', label: 'Ironing', icon: <Shirt className="h-3.5 w-3.5" /> },
        { value: 'wash', label: 'Wash', icon: <Droplets className="h-3.5 w-3.5" /> },
        { value: 'wash-ironing', label: 'Wash + Ironing', icon: <Sparkles className="h-3.5 w-3.5" /> },
        { value: 'dry-cleaning', label: 'Dry Cleaning', icon: <Wind className="h-3.5 w-3.5" /> },
        { value: 'shoes-cleaning', label: 'Shoes Cleaning', icon: <Footprints className="h-3.5 w-3.5" /> },
    ];

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
        case 'pickup completed':
            return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'cancelled':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

function formatDate(dateString: string) {
    if (!dateString) return '—';
    try {
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
    currentPage,
    totalPages,
    totalOrders,
    loading,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    loading: boolean;
    onPageChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;

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
            <p className="text-sm text-muted-foreground">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> &mdash;{' '}
                <span className="font-medium">{totalOrders}</span> total orders
            </p>
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
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QualityCheckPendingPage() {
    const [orders, setOrders] = useState<PendingQCOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');                                      // ← NEW
    const [selectedService, setSelectedService] = useState<ServiceColorKey | 'all'>('all'); // ← NEW

    const router = useRouter();
    const { toast } = useToast();

    const fetchOrders = useCallback(async (page: number) => {
        try {
            setLoading(true);
            setError('');
            const response = await BookingApiService.getPendingQualityCheckOrders(page, 20);
            if (response.status && response.data) {
                setOrders(response.data.Orders || []);
                setTotalPages(response.data.totalPages || 1);
                setCurrentPage(response.data.currentPage || 1);
                setTotalOrders(response.data.totalCount || 0);
            } else {
                setError(response.msg || 'Failed to fetch orders');
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred');
            toast({
                title: 'Error',
                description: 'Failed to fetch pending quality check orders',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage, fetchOrders]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const totalGarments = orders.reduce((sum, o) => sum + (o.garment_qty ?? 0), 0);
    const totalPickupGarments = orders.reduce((sum, o) => sum + (o.no_of_garments_picked ?? 0), 0);
    const paidOrders = orders.filter((o) => o.payment_status === 'Paid').length;
    const pickupCompletedOrders = orders.filter((o) => o.ord_status === 'Pickup Completed').length;

    // ── NEW: combined search + service filter ─────────────────────────────────
    const filteredOrders = orders.filter((order) => {
        // 1. Search: order display no or order no
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            order.order_display_no?.toLowerCase().includes(q) ||
            order.order_no?.toString().toLowerCase().includes(q);

        // 2. Service: service_name is a comma-separated string e.g. "Wash, Ironing"
        const matchesService =
            selectedService === 'all' ||
            order.service_name
                ?.split(',')
                .map((s) => s.trim())
                .some((svc) => resolveServiceKey(svc) === selectedService);

        return matchesSearch && matchesService;
    });

    const activeFilterCount =
        (searchQuery.trim() ? 1 : 0) + (selectedService !== 'all' ? 1 : 0);

    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedService('all');
    };

    return (
        <div className="space-y-5 p-4 md:p-6">
            {/* PAGE HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quality Check</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Pending quality check orders
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchOrders(currentPage)}
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
                            <p className="text-xs text-muted-foreground">Total Pending QC</p>
                            <p className="text-2xl font-bold mt-0.5">{totalOrders}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Shirt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Garments (Order Qty)</p>
                            <p className="text-2xl font-bold mt-0.5">{totalGarments}</p>

                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Shirt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Garments (Pickup Qty)</p>
                            <p className="text-2xl font-bold mt-0.5">{totalPickupGarments}</p>

                        </div>
                    </CardContent>
                </Card>
                {/* <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Paid (this page)</p>
                            <p className="text-2xl font-bold mt-0.5">{paidOrders}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Layers3 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pickup Completed</p>
                            <p className="text-2xl font-bold mt-0.5">{pickupCompletedOrders}</p>
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            {/* LEGEND */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
                    Service Types:
                </span>
                <ServiceLegend />
            </div> */}

            {/* MAIN CARD */}
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <div className="flex flex-col gap-3">

                        {/* Row 1: title + active filter count + clear all */}
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListOrdered className="h-5 w-5" />
                                Pending Quality Check Orders
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </CardTitle>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Row 2: search input + service dropdown */}
                        <div className="flex flex-col sm:flex-row gap-2">

                            {/* Search by order ID / order no */}
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by order ID or order number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Service dropdown */}
                            <Select
                                value={selectedService}
                                onValueChange={(v) =>
                                    setSelectedService(v as ServiceColorKey | 'all')
                                }
                            >
                                <SelectTrigger className="h-9 w-full sm:w-52 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        {SERVICE_FILTER_OPTIONS.find((o) => o.value === selectedService)?.icon}
                                        <SelectValue placeholder="Filter by service" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {SERVICE_FILTER_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                {opt.icon}
                                                <span>{opt.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Row 3: quick-select pill buttons */}
                        <div className="flex flex-wrap gap-1.5">
                            {SERVICE_FILTER_OPTIONS.map((opt) => {
                                const isActive = selectedService === opt.value;
                                const theme =
                                    opt.value !== 'all'
                                        ? SERVICE_THEMES[opt.value as ServiceColorKey]
                                        : null;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() =>
                                            setSelectedService(opt.value as ServiceColorKey | 'all')
                                        }
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all
                                            ${isActive
                                                ? theme
                                                    ? `${theme.badge} ring-2 ring-offset-1 ring-current`
                                                    : 'bg-primary text-primary-foreground border-primary ring-2 ring-offset-1 ring-primary'
                                                : theme
                                                    ? `${theme.badge} opacity-60 hover:opacity-100`
                                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                            }`}
                                    >
                                        {opt.icon}
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                    </div>
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
                    <div className="hidden lg:grid grid-cols-9 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <div>Order ID</div>
                        {/* <div>Sub Order</div> */}
                        <div>Services</div>
                        <div>Qty</div>
                        <div>Pickup Qty</div>
                        <div>Pickup Date</div>
                        <div>Pickup Time</div>
                        <div>Amount</div>
                        {/* <div>Status</div> */}
                        <div className="text-right">Actions</div>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading orders…</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-24 text-center">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="font-semibold text-lg">
                                {activeFilterCount > 0 ? 'No matching orders found' : 'No Pending Orders'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeFilterCount > 0
                                    ? 'Try adjusting the search or service filter'
                                    : 'All quality checks are up to date'}
                            </p>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-3 text-sm text-primary hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order._id} className="border-b last:border-b-0">
                                <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 px-5 py-4 items-center hover:bg-muted/5 transition-colors">

                                    {/* ORDER ID */}
                                    <div>
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/orders/quality-check/v2/update?id=${order._id}`
                                                )
                                            }
                                            className="font-semibold text-primary hover:underline text-sm"
                                        >
                                            {order.order_display_no}
                                        </button>
                                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                            #{order.order_no}
                                        </div>
                                    </div>

                                    {/* SUB ORDER */}
                                    {/* <div>
                                        {order.sub_order_no ? (
                                            <span className="text-sm font-medium font-mono text-foreground">
                                                {order.sub_order_no}
                                            </span>
                                        ) : order.sub_orders?.length > 0 ? (
                                            <div className="flex flex-col gap-0.5">
                                                {order.sub_orders.map((sub: any, i: number) => (
                                                    <span key={i} className="text-xs font-mono text-foreground">
                                                        {sub.sub_order_no}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </div> */}

                                    {/* SERVICES */}
                                    <div className="flex flex-wrap gap-1">
                                        {order.service_name
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean)
                                            .map((svc, i) => {
                                                const theme = SERVICE_THEMES[resolveServiceKey(svc)];
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border font-medium ${theme.badge}`}
                                                    >
                                                        {theme.icon}
                                                        <span className="truncate max-w-[80px]">{svc}</span>
                                                    </span>
                                                );
                                            })}
                                    </div>

                                    {/* Total QTY */}
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="font-medium">{order.garment_qty}</span>
                                    </div>
                                    {/* Pickup QTY */}
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="font-medium">{order.no_of_garments_picked}</span>
                                    </div>

                                    {/* DATE */}
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                        {formatDate(order.booking_date)}
                                    </div>

                                    {/* TIME */}
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />
                                        {order.booking_time}
                                    </div>

                                    {/* AMOUNT */}
                                    <div className="font-semibold text-sm flex items-center gap-0.5">
                                        <IndianRupee className="h-3.5 w-3.5" />
                                        {order.total_billing?.toLocaleString('en-IN')}
                                    </div>

                                    {/* STATUS */}
                                    {/* <div>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(order.ord_status)}`}
                                        >
                                            {order.ord_status}
                                        </span>
                                    </div> */}

                                    {/* ACTIONS */}
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/orders/quality-check/v2/update?id=${order._id}`
                                                )
                                            }
                                        >
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            Start QC
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* PAGINATION */}
                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalOrders={totalOrders}
                        loading={loading}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>
        </div>
    );
}