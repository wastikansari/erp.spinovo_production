'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    AlertCircle,
    RefreshCw,
    Package,
    Truck,
    Wrench,
    CheckCircle2,
    Clock,
    User,
    Phone,
    Calendar,
    Shirt,
    Droplets,
    Wind,
    Footprints,
    Flame,
    Sparkles,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { BookingApiService } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { OrderTimelineItem } from '@/lib/types/orderTimeline';
import { useRouter } from 'next/navigation';

// ─── Status helpers ───────────────────────────────────────────────────────────

const PICKUP_STATUS: Record<number, { label: string; color: string }> = {
    0: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
    1: { label: 'Assigned', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    2: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    3: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' },
};

const PROCESS_STATUS: Record<number, { label: string; color: string }> = {
    0: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
    1: { label: 'Assigned', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    2: { label: 'Accepted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    3: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    4: { label: 'Processing', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    5: { label: 'Inward Pending', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    6: { label: 'Inward Done', color: 'bg-green-100 text-green-700 border-green-200' },
};

const DELIVERY_STATUS: Record<number, { label: string; color: string }> = {
    0: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
    1: { label: 'Assigned', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    2: { label: 'Out for Delivery', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    3: { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200' },
};

function getOrdStatusColor(status: string) {
    const s = status?.toLowerCase() ?? '';
    if (s === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('cancel')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('pickup') && s.includes('progress')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s.includes('processing')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s.includes('delivery')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (s.includes('completed')) return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
}

// ─── Service theme ────────────────────────────────────────────────────────────

type ServiceKey = 'ironing' | 'quick-ironing' | 'wash-ironing' | 'wash' | 'dry-cleaning' | 'shoes-cleaning' | 'default';

const SERVICE_THEMES: Record<ServiceKey, { badge: string; icon: React.ReactNode }> = {
    'quick-ironing': { badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Flame className="h-3 w-3" /> },
    ironing: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Shirt className="h-3 w-3" /> },
    'wash-ironing': { badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Sparkles className="h-3 w-3" /> },
    wash: { badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Droplets className="h-3 w-3" /> },
    'dry-cleaning': { badge: 'bg-teal-100 text-teal-700 border-teal-200', icon: <Wind className="h-3 w-3" /> },
    'shoes-cleaning': { badge: 'bg-stone-100 text-stone-700 border-stone-200', icon: <Footprints className="h-3 w-3" /> },
    default: { badge: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Package className="h-3 w-3" /> },
};

function resolveServiceKey(name: string): ServiceKey {
    const n = name?.toLowerCase() ?? '';
    if (n.includes('quick') && n.includes('iron')) return 'quick-ironing';
    if (n.includes('wash') && n.includes('iron')) return 'wash-ironing';
    if (n.includes('dry')) return 'dry-cleaning';
    if (n.includes('shoe')) return 'shoes-cleaning';
    if (n.includes('iron')) return 'ironing';
    if (n.includes('wash')) return 'wash';
    return 'default';
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(val: string | null | undefined): string {
    if (!val) return '—';
    try {
        return new Date(val).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch { return val; }
}

function fmtDateTime(val: string | null | undefined): string {
    if (!val) return '—';
    try {
        return new Date(val).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return val; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageCell({
    icon,
    label,
    assignedName,
    assigneDate,
    completedName,
    completedDate,
    badge,
    badgeColor,
    empty,
}: {
    icon: React.ReactNode;
    label: string;
    assignedName: string;
    assigneDate: string | null | undefined;
    completedName: string;
    completedDate: string | null | undefined;
    badge?: string;
    badgeColor?: string;
    empty?: boolean;
}) {
    if (empty) {
        return (
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">—</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            {badge && (
                <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeColor}`}>
                    {badge}
                </span>
            )}
            <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{assignedName}:</span>
                <span className="font-medium">{fmtDateTime(assigneDate)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{completedName}:</span>
                <span className="font-medium">{fmtDateTime(completedDate)}</span>
            </div>
        </div>
    );
}

// ─── ORD_STATUS filter options ────────────────────────────────────────────────

const STATUS_OPTIONS = [
    'All',
    'Pending',
    'Pickup Assigned',
    'Pickup In Progress',
    'Pickup Completed',
    'Processing Assigned',
    'Processing In Progress',
    'Processing Completed',
    'Vendor Inward Pending',
    'Vendor Inward Completed',
    'Ironing Assigned',
    'Ironing In Progress',
    'Ironing Completed',
    'Delivery Assigned',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderTimelinePage() {
    const { toast } = useToast();
    const router = useRouter();

    const [items, setItems] = useState<OrderTimelineItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSubOrders, setTotalSubOrders] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchData = useCallback(async (page: number, limit: number, status: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await BookingApiService.getOrderTimeline(
                page,
                limit,
                status === 'All' ? undefined : status
            );
            if (res.status && res.data) {
                setItems(res.data.data);
                setTotalPages(res.data.total_pages);
                setTotalSubOrders(res.data.totalSubOrders);
                setCurrentPage(res.data.currentPage);
            } else {
                setError(res.msg || 'Failed to load data');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData(1, pageSize, statusFilter);
    }, []);

    function handlePageChange(page: number) {
        setCurrentPage(page);
        fetchData(page, pageSize, statusFilter);
    }

    function handlePageSizeChange(val: string) {
        const size = Number(val);
        setPageSize(size);
        fetchData(1, size, statusFilter);
    }

    function handleStatusChange(val: string) {
        setStatusFilter(val);
        fetchData(1, pageSize, val);
    }

    function handleRefresh() {
        fetchData(currentPage, pageSize, statusFilter);
    }

    return (
        <div className="p-6 space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Order Timeline</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Pickup · Process · Delivery timestamps for every sub-order
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-52 h-9 text-sm">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select> */}

                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-28 h-9 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {!loading && (
                    <span className="text-xs text-muted-foreground ml-auto">
                        {totalSubOrders} sub-order{totalSubOrders !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Error ── */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* ── Table ── */}
            <Card>
                <CardHeader className="py-3 px-5 border-b">
                    <div className="grid grid-cols-[1.2fr_1.6fr_1.4fr_1.6fr_1.6fr_1.6fr_1.2fr] gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span>Sub-Order</span>
                        <span>Customer</span>
                        <span>Service</span>
                        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Pickup</span>
                        <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> Process</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Delivery</span>
                        <span>Status</span>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Loading...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Package className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">No sub-orders found</p>
                            <p className="text-xs text-muted-foreground">Try changing the status filter</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map((item) => {
                                const svcKey = resolveServiceKey(item.service_name);
                                const svcTheme = SERVICE_THEMES[svcKey];

                                // Pickup timestamps: assigned = createdAt, completed = updatedAt when status=3
                                const pickupAssignedAt = item.pickup?.createdAt ?? null;
                                const pickupCompletedAt = item.pickup?.status === 3 ? item.pickup?.updatedAt : null;

                                // Process timestamps from explicit fields
                                const processAssignedAt = item.process?.createdAt ?? null;
                                // const processStartedAt = item.process?.processing_started_at ?? null;
                                const processCompletedAt = item.status === 3 ? item.process?.updatedAt : null;

                                // Delivery timestamps: assigned = createdAt, delivered = updatedAt when status=3
                                const deliveryAssignedAt = item.delivery?.createdAt ?? null;
                                const deliveryCompletedAt = item.delivery?.status === 3 ? item.delivery?.updatedAt : null;

                                const pickupInfo = item.pickup ? PICKUP_STATUS[item.pickup.status] : null;
                                const processInfo = item.process ? PROCESS_STATUS[item.process.status] : null;
                                const deliveryInfo = item.delivery ? DELIVERY_STATUS[item.delivery.status] : null;

                                return (
                                    <div
                                        key={item._id}
                                        className="grid grid-cols-[1.2fr_1.6fr_1.4fr_1.6fr_1.6fr_1.6fr_1.2fr] gap-4 px-5 py-4 items-start hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Sub-order # */}
                                        <div className="flex flex-col gap-1 min-w-0">
                                            {/* <span className="font-semibold text-sm text-primary">
                                                {item.sub_order_no}
                                            </span> */}
                                            <button
                                                onClick={() => router.push(`/dashboard/bookings/sub-order/${item._id}`)}
                                                className="font-semibold text-sm text-primary hover:underline text-left"
                                            >
                                                {item.sub_order_no}
                                            </button>
                                            <span className="text-xs text-muted-foreground">
                                                {item.order?.order_display_no ?? item.order_no}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                {fmtDate(item.createdAt)}
                                            </div>
                                        </div>

                                        {/* Customer */}
                                        <div className="flex flex-col gap-1 min-w-0">
                                            {item.customer ? (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <button
                                                            onClick={() => router.push(`/dashboard/customers/${item.customer?._id}`)}
                                                            className="font-medium text-sm truncate hover:underline text-primary text-left"
                                                        >
                                                            {item.customer?.name || '—'}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3 shrink-0" />
                                                        {item.customer.mobile || '—'}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        {/* Service */}
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                            <span
                                                className={`inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${svcTheme.badge}`}
                                            >
                                                {svcTheme.icon}
                                                {item.service_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.garment_qty} pcs
                                            </span>
                                            <div className="text-xs text-muted-foreground">
                                                Exp: {item.expected_delivery_date || '—'}
                                            </div>
                                        </div>

                                        {/* Pickup */}
                                        {item.pickup ? (
                                            <StageCell
                                                icon={<Truck className="h-3 w-3" />}
                                                label="Pickup"
                                                badge={pickupInfo?.label}
                                                badgeColor={pickupInfo?.color}
                                                assignedName="Assigned"
                                                assigneDate={pickupAssignedAt}
                                                completedName="Completed"
                                                completedDate={pickupCompletedAt}
                                            />
                                        ) : (
                                            <StageCell icon={<Truck className="h-3 w-3" />} label="Pickup" assignedName="Assigned" assigneDate={pickupAssignedAt} completedName="Completed" completedDate={pickupCompletedAt} empty />
                                        )}

                                        {/* Process */}
                                        {item.process ? (
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Wrench className="h-3 w-3" />
                                                    <span>Process</span>
                                                </div>
                                                {processInfo && (
                                                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${processInfo.color}`}>
                                                        {processInfo.label}
                                                    </span>
                                                )}
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="text-muted-foreground">Assigned:</span>
                                                        <span className="font-medium">{fmtDateTime(processAssignedAt)}</span>
                                                    </span>
                                                    {/* {processStartedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground">Started:</span>
                                                            <span className="font-medium">{fmtDateTime(processStartedAt)}</span>
                                                        </span>
                                                    )} */}
                                                    {processCompletedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground">Done:</span>
                                                            <span className="font-medium">{fmtDateTime(processCompletedAt)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <StageCell icon={<Wrench className="h-3 w-3" />} label="Process" assignedName="Assigned" assigneDate={processAssignedAt} completedName="Completed" completedDate={processCompletedAt} empty />
                                        )}

                                        {/* Delivery */}
                                        {item.delivery ? (
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Delivery</span>
                                                </div>
                                                {deliveryInfo && (
                                                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${deliveryInfo.color}`}>
                                                        {deliveryInfo.label}
                                                    </span>
                                                )}
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="text-muted-foreground">Assigned:</span>
                                                        <span className="font-medium">{fmtDateTime(deliveryAssignedAt)}</span>
                                                    </span>
                                                    {deliveryCompletedAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                            <span className="text-muted-foreground">Delivered:</span>
                                                            <span className="font-medium">{fmtDateTime(deliveryCompletedAt)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <StageCell icon={<CheckCircle2 className="h-3 w-3" />} label="Delivery" assignedName="Assigned" assigneDate={deliveryAssignedAt} completedName="Completed" completedDate={deliveryCompletedAt} empty />
                                        )}

                                        {/* Order status */}
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOrdStatusColor(item.ord_status)}`}
                                            >
                                                {item.ord_status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t">
                            <span className="text-xs text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let page: number;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else if (currentPage <= 3) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    } else {
                                        page = currentPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={page}
                                            variant={page === currentPage ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-8 w-8 p-0 text-xs"
                                            onClick={() => handlePageChange(page)}
                                            disabled={loading}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}