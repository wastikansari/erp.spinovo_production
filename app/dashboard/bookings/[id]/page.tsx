'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
    Loader2,
    AlertCircle,
    IndianRupee,
    CreditCard,
    Tag,
    Shirt,
    Flame,
    Droplets,
    Wind,
    Footprints,
    Sparkles,
    Home,
    Eye,
    CheckCircle2,
    Wallet,
    Hash,
    Layers,
    ChevronRight,
    UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BookingApiService, BookingDetailsData } from '@/lib/api';

// ─── Service Color System ─────────────────────────────────────────────────────

type ServiceColorKey =
    | 'quick-ironing' | 'ironing' | 'wash-ironing'
    | 'wash' | 'dry-cleaning' | 'shoes-cleaning' | 'default';

interface ServiceTheme {
    border: string; badge: string; bg: string;
    iconBg: string; iconColor: string;
    icon: React.ReactNode; label: string;
}

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
    'quick-ironing': {
        border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700 border-orange-200',
        bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
        icon: <Flame className="h-4 w-4" />, label: 'Quick Ironing',
    },
    ironing: {
        border: 'border-l-yellow-400', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600',
        icon: <Shirt className="h-4 w-4" />, label: 'Ironing',
    },
    'wash-ironing': {
        border: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700 border-purple-200',
        bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
        icon: <Sparkles className="h-4 w-4" />, label: 'Wash + Ironing',
    },
    wash: {
        border: 'border-l-blue-400', badge: 'bg-blue-100 text-blue-700 border-blue-200',
        bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
        icon: <Droplets className="h-4 w-4" />, label: 'Wash',
    },
    'dry-cleaning': {
        border: 'border-l-teal-400', badge: 'bg-teal-100 text-teal-700 border-teal-200',
        bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
        icon: <Wind className="h-4 w-4" />, label: 'Dry Cleaning',
    },
    'shoes-cleaning': {
        border: 'border-l-stone-400', badge: 'bg-stone-100 text-stone-700 border-stone-200',
        bg: 'bg-stone-50', iconBg: 'bg-stone-100', iconColor: 'text-stone-600',
        icon: <Footprints className="h-4 w-4" />, label: 'Shoes Cleaning',
    },
    default: {
        border: 'border-l-gray-300', badge: 'bg-gray-100 text-gray-600 border-gray-200',
        bg: 'bg-gray-50', iconBg: 'bg-gray-100', iconColor: 'text-gray-600',
        icon: <Package className="h-4 w-4" />, label: 'Service',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
        case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'completed': return 'bg-green-100 text-green-700 border-green-200';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
        case 'pickup assigned': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'picked up': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case 'delivery assigned': return 'bg-violet-100 text-violet-700 border-violet-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

function getPaymentStatusClass(status: string) {
    switch (status?.toLowerCase()) {
        case 'paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'failed': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

function formatDate(ds: string) {
    if (!ds) return '—';
    try {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(ds)) {
            const [dd, mm, yyyy] = ds.split('/');
            return format(new Date(`${yyyy}-${mm}-${dd}`), 'dd MMM yyyy');
        }
        return format(new Date(ds), 'dd MMM yyyy');
    } catch { return ds; }
}

function formatDateTime(ds: string) {
    if (!ds) return '—';
    try { return format(new Date(ds), 'dd MMM yyyy, hh:mm a'); }
    catch { return ds; }
}

function parseOrderDetails(raw: any): any[] {
    if (!raw) return [];
    try {
        const str = Array.isArray(raw) ? raw[0] : raw;
        const parsed = typeof str === 'string' ? JSON.parse(str) : str;
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch { return []; }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="text-sm font-semibold text-foreground">{value ?? '—'}</div>
        </div>
    );
}

function PriceRow({
    label, value, highlight, negative,
}: {
    label: string; value: number | string; highlight?: boolean; negative?: boolean;
}) {
    return (
        <div className={`flex items-center justify-between py-1.5 ${highlight ? 'font-bold text-base' : 'text-sm'}`}>
            <span className={highlight ? '' : 'text-muted-foreground'}>{label}</span>
            <span className={negative ? 'text-green-600' : highlight ? '' : ''}>
                {negative ? '-' : ''}₹{Number(value)?.toLocaleString('en-IN')}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [bookingData, setBookingData] = useState<BookingDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await BookingApiService.getBookingDetails(bookingId);
            if (response.status && response.data) {
                setBookingData(response.data);
            } else {
                setError(response.msg || 'Failed to fetch booking details');
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (bookingId) fetchDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading booking details…</p>
            </div>
        );
    }

    if (error || !bookingData) {
        return (
            <div className="p-6 space-y-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || 'Booking not found'}</AlertDescription>
                </Alert>
                <Button onClick={fetchDetails} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                </Button>
            </div>
        );
    }

    const { order, customer, address, subOrders } = bookingData;
    const orderDetails = parseOrderDetails(order.order_details);
    const serviceNames = order.service_name?.split(',').map((s) => s.trim()) ?? [];

    return (
        <div className="space-y-5 p-4 md:p-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.back()}>
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{order.order_display_no}</h1>
                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(order.ord_status)}`}>
                            {order.ord_status}
                        </span>
                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getPaymentStatusClass(order.payment_status)}`}>
                            {order.payment_status}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {order.service_name} &nbsp;·&nbsp; {formatDate(order.booking_date)}, {order.booking_time}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDetails} className="shrink-0 rounded-xl">
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <IndianRupee className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Billing</p>
                            <p className="text-xl font-bold mt-0.5">₹{order.total_billing?.toLocaleString('en-IN')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Shirt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Garments</p>
                            <p className="text-2xl font-bold mt-0.5">{order.garment_qty}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Layers className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Sub Orders</p>
                            <p className="text-2xl font-bold mt-0.5">{subOrders?.length ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Order No</p>
                            <p className="text-lg font-bold mt-0.5">{order.order_display_no}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── LEFT (2/3) ── */}
                <div className="xl:col-span-2 space-y-5">

                    {/* Order Info */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Order Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
                            <InfoRow label="Order No" value={order.order_display_no} />
                            <InfoRow label="Order Stage" value={`Stage ${order.order_stage_id}`} />
                            <InfoRow
                                label="Status"
                                value={
                                    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${getStatusClass(order.ord_status)}`}>
                                        {order.ord_status}
                                    </span>
                                }
                            />
                            <InfoRow
                                label="Services"
                                value={
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {serviceNames.map((s, i) => {
                                            const t = SERVICE_THEMES[resolveServiceKey(s)];
                                            return (
                                                <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${t.badge}`}>
                                                    {t.icon}{s}
                                                </span>
                                            );
                                        })}
                                    </div>
                                }
                            />
                            <InfoRow label="Total Garments" value={`${order.garment_qty} pcs`} />
                            <InfoRow
                                label="Booking Date"
                                value={
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {formatDate(order.booking_date)}
                                    </span>
                                }
                            />
                            <InfoRow
                                label="Booking Time"
                                value={
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        {order.booking_time}
                                    </span>
                                }
                            />
                            {order.offer_code ? (
                                <InfoRow
                                    label="Offer Code"
                                    value={
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-green-600 font-mono">{order.offer_code}</span>
                                        </span>
                                    }
                                />
                            ) : null}
                            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
                            <InfoRow label="Updated At" value={formatDateTime(order.updatedAt)} />
                        </CardContent>
                    </Card>

                    {/* Sub Orders */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                Sub Orders
                                {subOrders?.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                        {subOrders.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {subOrders?.length > 0 ? (
                                <div className="space-y-3">
                                    {subOrders.map((sub) => {
                                        const t = SERVICE_THEMES[resolveServiceKey(sub.service_name)];
                                        return (
                                            <div
                                                key={sub._id}
                                                className={`border border-l-4 ${t.border} rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
                                                onClick={() => router.push(`/dashboard/bookings/sub-order/${sub._id}`)}
                                            >
                                                <div className={`${t.bg} px-4 py-2.5 flex items-center justify-between border-b`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold shrink-0 ${t.badge}`}>
                                                            {t.icon}{sub.service_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-mono truncate">
                                                            {sub.sub_order_no}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusClass(sub.ord_status)}`}>
                                                            {sub.ord_status}
                                                        </span>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Shirt className="h-3.5 w-3.5" />
                                                        <span className="font-semibold text-foreground">{sub.garment_qty}</span>
                                                        <span>garments</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <IndianRupee className="h-3.5 w-3.5" />
                                                        <span className="font-semibold text-foreground">
                                                            {sub.garment_amount?.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{formatDate(sub.booking_date)}, {sub.booking_time}</span>
                                                    </div>
                                                    {(sub as any).expected_delivery_date && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>
                                                                Delivery: {formatDate((sub as any).expected_delivery_date)}, {(sub as any).expected_delivery_time}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-4 py-2 border-t bg-muted/10 flex justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 text-xs gap-1 text-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/dashboard/bookings/sub-order/${sub._id}`);
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 border rounded-xl bg-muted/10">
                                    <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">No sub orders</p>
                                    <p className="text-xs text-muted-foreground mt-1">Sub orders will appear here once created</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Service Breakdown from order_details */}
                    {orderDetails.length > 0 && (
                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                    Service Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-5">
                                {orderDetails.map((svc: any, si: number) => {
                                    const t = SERVICE_THEMES[resolveServiceKey(svc.service)];
                                    return (
                                        <div key={si} className={`border rounded-xl overflow-hidden`}>
                                            {/* Service header */}
                                            <div className={`${t.bg} px-4 py-3 flex items-start justify-between border-b`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${t.badge}`}>
                                                            {t.icon}{svc.service}
                                                        </span>
                                                        {svc.duration && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />{svc.duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {svc.description && (
                                                        <p className="text-xs text-muted-foreground mt-1.5">{svc.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Categories */}
                                            <div className="divide-y">
                                                {svc.categorys?.map((cat: any, ci: number) => (
                                                    <div key={ci} className="px-4 py-3 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold">{cat.category}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {cat.items} item{cat.items !== 1 ? 's' : ''}
                                                                </span>
                                                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-xs font-bold ${t.badge}`}>
                                                                    <IndianRupee className="h-3 w-3" />{cat.category_prices}/item
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {cat.types_of_Clothes?.map((cloth: string, ci2: number) => (
                                                                <span key={ci2} className="px-2 py-0.5 rounded-full bg-muted border text-xs">
                                                                    {cloth}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                                                            <span>{cat.items} × ₹{cat.category_prices}</span>
                                                            <span className="font-semibold text-foreground">
                                                                = ₹{(Number(cat.items) * Number(cat.category_prices)).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── RIGHT (1/3) ── */}
                <div className="space-y-5">

                    {/* Customer */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <UserCircle className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">{customer.living_type || 'Customer'}</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{customer.mobile}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="font-mono text-xs">{customer.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Wallet:</span>
                                    <span className="font-semibold text-green-600">₹{customer.wallet_balance?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    <span>Since {formatDate(customer.createdAt)}</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl"
                                onClick={() => router.push(`/dashboard/customers/${customer._id}`)}
                            >
                                <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                            </Button>
                        </CardContent>
                    </Card>
                    {/* Address */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Pickup Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm">{address.address_type}</p>
                                        {address.isPrimary && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{address.format_address}</p>
                                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                                        <span>Pincode: <span className="font-semibold text-foreground">{address.pincode}</span></span>
                                        <span>City: <span className="font-semibold text-foreground">{address.city}</span></span>
                                    </div>
                                    {address.landmark && (
                                        <p className="text-xs text-muted-foreground">
                                            Near: <span className="font-medium text-foreground">{address.landmark}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                Billing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1">
                            <PriceRow label="Order Amount" value={order.order_amount} />
                            {order.handling_charges > 0 && (
                                <PriceRow label="Handling Charges" value={order.handling_charges} />
                            )}
                            {order.delivery_charge > 0 && (
                                <PriceRow label="Delivery Charges" value={order.delivery_charge} />
                            )}
                            {order.slot_charges > 0 && (
                                <PriceRow label="Slot Charges" value={order.slot_charges} />
                            )}
                            {order.service_charges > 0 && (
                                <PriceRow label="Service Charges" value={order.service_charges} />
                            )}
                            {order.tip_amount > 0 && (
                                <PriceRow label="Tip" value={order.tip_amount} />
                            )}
                            {order.offer_amount > 0 && (
                                <PriceRow label={`Offer (${order.offer_code || 'Discount'})`} value={order.offer_amount} negative />
                            )}
                            {order.garment_discount_amount > 0 && (
                                <PriceRow label="Garment Discount" value={order.garment_discount_amount} negative />
                            )}
                            <Separator className="my-2" />
                            <PriceRow label="Total Billing" value={order.total_billing} highlight />
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getPaymentStatusClass(order.payment_status)}`}>
                                    {order.payment_status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Mode</span>
                                <span className="text-sm font-semibold">{order.payment_mode}</span>
                            </div>
                            {order.transaction_id && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                                    <p className="text-xs font-mono mt-0.5 break-all text-foreground">{order.transaction_id}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Pickup Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm">{address.address_type}</p>
                                        {address.isPrimary && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{address.format_address}</p>
                                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                                        <span>Pincode: <span className="font-semibold text-foreground">{address.pincode}</span></span>
                                        <span>City: <span className="font-semibold text-foreground">{address.city}</span></span>
                                    </div>
                                    {address.landmark && (
                                        <p className="text-xs text-muted-foreground">
                                            Near: <span className="font-medium text-foreground">{address.landmark}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments summary */}
                    {((bookingData as any).pickupAssignments?.length > 0 ||
                        (bookingData as any).processAssignments?.length > 0 ||
                        (bookingData as any).deliveryAssignments?.length > 0) && (
                            <Card className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-base">Assignments</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    {[
                                        { label: 'Pickup', data: (bookingData as any).pickupAssignments },
                                        { label: 'Processing', data: (bookingData as any).processAssignments },
                                        { label: 'Delivery', data: (bookingData as any).deliveryAssignments },
                                    ].map(({ label, data }) => (
                                        <div key={label} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{label}</span>
                                            {data?.length > 0 ? (
                                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {data.length} assigned
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Not assigned</span>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                </div>
            </div>
        </div>
    );
}
