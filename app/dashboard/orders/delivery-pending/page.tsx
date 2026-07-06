'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    Calendar,
    Eye,
    MoreHorizontal,
    Package,
    RefreshCw,
    UserCheck,
    ListOrdered,
    Shirt,
    Droplets,
    Wind,
    Footprints,
    Flame,
    Sparkles,
    Clock,
    Hash,
    CheckCircle2,
    Truck,
    IndianRupee,
    MapPin,
    Search,
    X,
    Filter,
} from 'lucide-react';
import { AssignApiService } from '@/lib/api';
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
import { DeliveryPendingSubOrder } from '@/lib/types/delivery-assign';
import { DeliverySubOrderAssignForm } from '@/components/forms/delivery-suborder-assign-form';

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
    icon: React.ReactNode;
    label: string;
}

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
    'quick-ironing': {
        border: 'border-l-orange-400',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <Flame className="h-3 w-3" />,
        label: 'Quick Ironing',
    },
    ironing: {
        border: 'border-l-yellow-400',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Shirt className="h-3 w-3" />,
        label: 'Ironing',
    },
    'wash-ironing': {
        border: 'border-l-purple-400',
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: <Sparkles className="h-3 w-3" />,
        label: 'Wash + Ironing',
    },
    wash: {
        border: 'border-l-blue-400',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Droplets className="h-3 w-3" />,
        label: 'Wash',
    },
    'dry-cleaning': {
        border: 'border-l-teal-400',
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: <Wind className="h-3 w-3" />,
        label: 'Dry Cleaning',
    },
    'shoes-cleaning': {
        border: 'border-l-stone-400',
        badge: 'bg-stone-100 text-stone-700 border-stone-200',
        icon: <Footprints className="h-3 w-3" />,
        label: 'Shoes Cleaning',
    },
    default: {
        border: 'border-l-gray-300',
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Package className="h-3 w-3" />,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusClass(status: string) {
    const s = status?.toLowerCase() ?? '';
    if (s.includes('processing completed')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('processing')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s.includes('completed')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('cancelled')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('pending')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
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

// ─── Service Legend ───────────────────────────────────────────────────────────

function ServiceLegend() {
    const keys: ServiceColorKey[] = ['quick-ironing', 'ironing', 'wash', 'wash-ironing', 'dry-cleaning', 'shoes-cleaning'];
    return (
        <div className="flex flex-wrap gap-2">
            {keys.map((k) => {
                const t = SERVICE_THEMES[k];
                return (
                    <div key={k} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${t.badge}`}>
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
    currentPage, totalPages, totalCount, loading, onPageChange,
}: {
    currentPage: number; totalPages: number; totalCount: number; loading: boolean; onPageChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages: (number | '…')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('…');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
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
                <span className="font-medium">{totalCount}</span> total sub-orders
            </p>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Prev</Button>
                {getPageNumbers().map((p, i) =>
                    p === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                        <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onPageChange(p as number)} disabled={loading}>{p}</Button>
                    )
                )}
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COL_STYLE = 'grid px-4 items-center' as const;
const COL_TEMPLATE = { gridTemplateColumns: 'minmax(120px,1.4fr) minmax(120px,1.3fr) minmax(80px,1fr) 56px 44px 80px minmax(120px,1.2fr) minmax(140px,1.4fr) minmax(160px,1.6fr) 44px', gap: '0 10px' } as const;

export default function DeliveryPendingPage() {
    const [subOrders, setSubOrders] = useState<DeliveryPendingSubOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState('');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedSubOrder, setSelectedSubOrder] = useState<DeliveryPendingSubOrder | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedService, setSelectedService] = useState<ServiceColorKey | 'all'>('all');

    const router = useRouter();
    const { toast } = useToast();

    const fetchList = useCallback(async (page: number) => {
        try {
            setLoading(true);
            setError('');
            const response = await AssignApiService.getDeliveryPendingSuborders(page, 20);
            if (response.status && response.data) {
                setSubOrders(response.data.subOrders || []);
                setTotalPages(response.data.totalPages || 1);
                setCurrentPage(response.data.currentPage || 1);
                setTotalCount(response.data.totalCount || 0);
            } else {
                setError(response.msg || 'Failed to fetch pending delivery sub-orders');
                setSubOrders([]);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
            setSubOrders([]);
            toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchList(currentPage); }, [currentPage, fetchList]);

    // ── NEW: combined search + service filter ─────────────────────────────────
    const filteredSubOrders = subOrders.filter((sub) => {
        // 1. Search: sub_order_no or order_no
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            sub.sub_order_no?.toLowerCase().includes(q) ||
            sub.order_no?.toLowerCase().includes(q);

        // 2. Service: match service_name against selected key
        const matchesService =
            selectedService === 'all' ||
            resolveServiceKey(sub.service_name) === selectedService;

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

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Delivery Pending</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Assign processing-completed sub-orders to copilots for delivery
                    </p>
                </div>
                <Button variant="outline" onClick={() => fetchList(currentPage)} disabled={loading} className="rounded-xl self-start">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pending Sub-Orders</p>
                            <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Processing Completed</p>
                            <p className="text-2xl font-bold mt-0.5">{subOrders.filter(s => s.ord_status?.toLowerCase().includes('processing completed')).length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SERVICE LEGEND */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Service Types:</span>
                <ServiceLegend />
            </div> */}

            {/* MAIN TABLE */}
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/20 py-4">
                    <div className="flex flex-col gap-3">

                        {/* Row 1: title + active filter count + clear all */}
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListOrdered className="h-5 w-5" />
                                Pending Delivery Assignment
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

                            {/* Search by sub-order no or order no */}
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by sub-order no or order no..."
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
                                onValueChange={(v) => setSelectedService(v as ServiceColorKey | 'all')}
                            >
                                <SelectTrigger className="h-9 w-full sm:w-52 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        {/* {SERVICE_FILTER_OPTIONS.find((o) => o.value === selectedService)?.icon} */}
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
                                const theme = opt.value !== 'all' ? SERVICE_THEMES[opt.value as ServiceColorKey] : null;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedService(opt.value as ServiceColorKey | 'all')}
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
                    <div
                        className={`hidden lg:grid ${COL_STYLE} py-2.5 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide`}
                        style={COL_TEMPLATE}
                    >
                        <div>Sub Order</div>
                        <div>Service</div>
                        <div>Order</div>
                        <div>Qty</div>
                        <div>Bag</div>
                        <div>Amount</div>
                        <div>Delivery Date</div>
                        <div>Delivery Time</div>
                        <div>Status</div>
                        <div className="flex justify-end">Action</div>
                    </div>

                    {/* LOADING */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading sub-orders…</p>
                        </div>
                    ) : filteredSubOrders.length === 0 ? (
                        <div className="py-24 text-center">
                            <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                            <p className="font-semibold text-lg">
                                {activeFilterCount > 0 ? 'No matching sub-orders found' : 'No Pending Delivery Sub-Orders'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeFilterCount > 0
                                    ? 'Try adjusting the search or service filter'
                                    : 'All sub-orders have been assigned for delivery'}
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
                        filteredSubOrders.map((sub, idx) => {
                            const theme = SERVICE_THEMES[resolveServiceKey(sub.service_name)];
                            const walletBalance = sub.customer_details?.wallet_balance;
                            const hasOutstandingDue = typeof walletBalance === 'number' && walletBalance < 0;
                            return (
                                <div
                                    key={`${sub._id}-${idx}`}
                                    className={`border-b last:border-b-0 border-l-4 ${theme.border}`}
                                >
                                    {/* DESKTOP ROW */}
                                    <div
                                        className={`hidden lg:grid ${COL_STYLE} py-3 hover:bg-muted/5 transition-colors`}
                                        style={COL_TEMPLATE}
                                    >
                                        {/* Sub Order No */}
                                        <div className="min-w-0">
                                            <span className="text-sm font-medium font-mono text-foreground">
                                                {sub.sub_order_no}
                                            </span>
                                        </div>

                                        {/* Service — colored badge */}
                                        <div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                                                {theme.icon}
                                                {sub.service_name}
                                            </span>
                                        </div>

                                        {/* Order No */}
                                        <div className="text-sm font-medium text-primary truncate">
                                            {sub.order_no}
                                        </div>

                                        {/* Garment QTY */}
                                        <div className="text-sm font-semibold">{sub.garment_qty}</div>

                                        {/* Bag */}
                                        <div className="text-sm text-muted-foreground">
                                            {sub.no_of_bag > 0 ? sub.no_of_bag : '—'}
                                        </div>

                                        {/* Amount */}
                                        <div className="flex items-center gap-0.5 text-sm font-semibold whitespace-nowrap">
                                            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                                            {sub.garment_amount?.toLocaleString('en-IN')}
                                        </div>

                                        {/* Delivery Date */}
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            {formatDate(sub.expected_delivery_date)}
                                        </div>

                                        {/* Delivery Time */}
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                            {sub.expected_delivery_time || '—'}
                                        </div>

                                        {/* Status */}
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap ${getStatusClass(sub.ord_status)}`}>
                                                {sub.ord_status || 'Pending'}
                                            </span>
                                            {hasOutstandingDue && (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium bg-red-100 text-red-700 border-red-200 whitespace-nowrap"
                                                    title="Customer has an outstanding wallet due"
                                                >
                                                    <AlertCircle className="h-3 w-3" />
                                                    Due ₹{Math.abs(walletBalance as number).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/${sub.order_id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Main Order Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bookings/sub-order/${sub._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Sub Order Details
                                                    </DropdownMenuItem>
                                                    {/* {sub.address_details?.format_address && (
                                                        <DropdownMenuItem onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(sub.address_details.format_address)}`, '_blank')}>
                                                            <MapPin className="mr-2 h-4 w-4" />
                                                            View on Map
                                                        </DropdownMenuItem>
                                                    )} */}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className={hasOutstandingDue ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-primary font-medium'}
                                                        disabled={hasOutstandingDue}
                                                        title={hasOutstandingDue ? 'Customer has an outstanding wallet due — clear it before assigning delivery' : undefined}
                                                        onClick={() => {
                                                            if (hasOutstandingDue) return;
                                                            setSelectedSubOrder(sub);
                                                            setShowAssignForm(true);
                                                        }}
                                                    >
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Assign Delivery
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* MOBILE ROW */}
                                    <div className="lg:hidden px-4 py-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                                                {theme.icon}
                                                {sub.sub_order_no}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStatusClass(sub.ord_status)}`}>
                                                {sub.ord_status || 'Pending'}
                                            </span>
                                        </div>
                                        {hasOutstandingDue && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium bg-red-100 text-red-700 border-red-200">
                                                <AlertCircle className="h-3 w-3" />
                                                Outstanding due ₹{Math.abs(walletBalance as number).toLocaleString('en-IN')}
                                            </span>
                                        )}
                                        <div className="text-xs text-muted-foreground">Order: <span className="font-medium text-foreground">{sub.order_no}</span></div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span>Qty: <b>{sub.garment_qty}</b></span>
                                            <span>Bags: <b>{sub.no_of_bag || 0}</b></span>
                                            <span>₹<b>{sub.garment_amount?.toLocaleString('en-IN')}</b></span>
                                            <span>Delivery: <b>{formatDate(sub.expected_delivery_date)}</b></span>
                                        </div>
                                        {sub.address_details?.format_address && (
                                            <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                                <span>{sub.address_details.format_address}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-1">
                                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/${sub.order_id}`)}>
                                                <Eye className="mr-1 h-3 w-3" /> Order
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/bookings/sub-order/${sub._id}`)}>
                                                <Eye className="mr-1 h-3 w-3" /> Sub-Order
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-7 text-xs rounded-lg"
                                                disabled={hasOutstandingDue}
                                                title={hasOutstandingDue ? 'Customer has an outstanding wallet due — clear it before assigning delivery' : undefined}
                                                onClick={() => {
                                                    if (hasOutstandingDue) return;
                                                    setSelectedSubOrder(sub);
                                                    setShowAssignForm(true);
                                                }}
                                            >
                                                <UserCheck className="mr-1 h-3 w-3" /> Assign
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        loading={loading}
                        onPageChange={(p) => setCurrentPage(p)}
                    />
                </CardContent>
            </Card>

            {/* DELIVERY ASSIGN FORM */}
            <DeliverySubOrderAssignForm
                open={showAssignForm}
                onOpenChange={setShowAssignForm}
                subOrder={selectedSubOrder}
                onSuccess={() => { setShowAssignForm(false); fetchList(currentPage); }}
                enforceWalletCheck
            />
        </div>
    );
}