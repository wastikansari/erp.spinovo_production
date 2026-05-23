'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    RefreshCw,
    Loader2,
    AlertCircle,
    Clock,
    Minus,
    Plus,
    Shirt,
    IndianRupee,
    CheckCircle2,
    Flame,
    Droplets,
    Wind,
    Footprints,
    Sparkles,
    Package,
    Hash,
    ChevronRight,
    Calendar,
    CreditCard,
    Tag,
    Layers3,
    Receipt,
    Truck,
    Zap,
    Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    BookingApiService,
    AssignApiService,
    FullServiceCategory,
    MainOrderDetailsData,
    SubOrder,
    CategoryItem,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type GarmentEdits = Record<number, Record<number, number>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGarmentDetails(raw: string) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function formatDate(d: string) {
    if (!d) return '—';
    try {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
            const [dd, mm, yyyy] = d.split('/');
            return new Date(`${yyyy}-${mm}-${dd}`).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
        }
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return d;
    }
}

type ServiceKey = 'quick-ironing' | 'ironing' | 'wash-ironing' | 'wash' | 'dry-cleaning' | 'shoes-cleaning' | 'default';

function resolveServiceKey(name: string): ServiceKey {
    const n = name?.toLowerCase() ?? '';
    if (n.includes('quick') && n.includes('iron')) return 'quick-ironing';
    if (n.includes('wash') && (n.includes('iron') || n.includes('+'))) return 'wash-ironing';
    if (n.includes('dry')) return 'dry-cleaning';
    if (n.includes('shoe')) return 'shoes-cleaning';
    if (n.includes('iron')) return 'ironing';
    if (n.includes('wash')) return 'wash';
    return 'default';
}

const SERVICE_META: Record<ServiceKey, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    'quick-ironing': {
        icon: <Flame className="h-4 w-4" />,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
    },
    ironing: {
        icon: <Shirt className="h-4 w-4" />,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
    },
    'wash-ironing': {
        icon: <Sparkles className="h-4 w-4" />,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
    },
    wash: {
        icon: <Droplets className="h-4 w-4" />,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
    },
    'dry-cleaning': {
        icon: <Wind className="h-4 w-4" />,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
    },
    'shoes-cleaning': {
        icon: <Footprints className="h-4 w-4" />,
        color: 'text-stone-600',
        bg: 'bg-stone-50',
        border: 'border-stone-200',
    },
    default: {
        icon: <Package className="h-4 w-4" />,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
    },
};

// ─── Main content ─────────────────────────────────────────────────────────────

function QCUpdateContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const orderId = searchParams.get('id') || searchParams.get('orderId') || '';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orderData, setOrderData] = useState<MainOrderDetailsData | null>(null);
    const [serviceList, setServiceList] = useState<FullServiceCategory[]>([]);
    const [activeServiceId, setActiveServiceId] = useState<number | null>(null);
    const [garmentEdits, setGarmentEdits] = useState<GarmentEdits>({});

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const [qcLoading, setQcLoading] = useState(false);
    const [qcError, setQcError] = useState('');
    const [showQcConfirm, setShowQcConfirm] = useState(false);

    const fetchData = useCallback(async () => {
        if (!orderId) {
            setError('No order ID provided');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError('');
            const [orderRes, serviceRes] = await Promise.all([
                BookingApiService.getMainOrderDetails(orderId),
                BookingApiService.getServiceCategoryList(),
            ]);

            if (orderRes.status && orderRes.data && serviceRes.status && serviceRes.data) {
                setOrderData(orderRes.data);
                setServiceList(serviceRes.data.service);

                const edits: GarmentEdits = {};
                orderRes.data.subOrders.forEach((sub) => {
                    const sid = parseInt(sub.service_id);
                    edits[sid] = {};
                    const garment = parseGarmentDetails(sub.garment_details);
                    if (garment?.categorys) {
                        garment.categorys.forEach((cat: any) => {
                            edits[sid][cat.category_id] = Number(cat.items ?? 0);
                        });
                    }
                });
                setGarmentEdits(edits);

                if (!activeServiceId && orderRes.data.subOrders.length > 0) {
                    setActiveServiceId(parseInt(orderRes.data.subOrders[0].service_id));
                }
            } else {
                setError(orderRes.msg || serviceRes.msg || 'Failed to fetch data');
            }
        } catch (err: any) {
            setError(err.message || 'Network error occurred');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeSubOrder: SubOrder | undefined = orderData?.subOrders.find(
        (s) => parseInt(s.service_id) === activeServiceId
    );
    const activeService: FullServiceCategory | undefined = serviceList.find(
        (s) => s.service_id === activeServiceId
    );
    const activeEdits: Record<number, number> = garmentEdits[activeServiceId ?? -1] ?? {};
    const totalActiveQty = Object.values(activeEdits).reduce((s, q) => s + q, 0);
    const pickedLimit = activeSubOrder?.no_of_garments_picked ?? 0;
    const isFull = totalActiveQty === pickedLimit;

    const adjustQty = (categoryId: number, delta: number) => {
        if (activeServiceId === null) return;
        setGarmentEdits((prev) => {
            const serviceEdits = prev[activeServiceId] ?? {};
            const current = serviceEdits[categoryId] ?? 0;
            const newQty = Math.max(0, current + delta);
            const totalWithout = Object.entries(serviceEdits)
                .filter(([k]) => parseInt(k) !== categoryId)
                .reduce((s, [, q]) => s + q, 0);
            if (totalWithout + newQty > pickedLimit) return prev;
            return { ...prev, [activeServiceId]: { ...serviceEdits, [categoryId]: newQty } };
        });
    };

    const removeAll = () => {
        if (activeServiceId === null) return;
        setGarmentEdits((prev) => ({ ...prev, [activeServiceId]: {} }));
    };

    const handleSave = async () => {
        if (!activeSubOrder || !activeService) return;
        const garment = parseGarmentDetails(activeSubOrder.garment_details);
        const updatedCategorys = activeService.category_list
            .filter((cat) => (activeEdits[cat.category_id] ?? 0) > 0)
            .map((cat) => ({
                category_id: cat.category_id,
                category: cat.category,
                types_of_Clothes: cat.types_of_Clothes,
                category_prices: cat.price,
                items: activeEdits[cat.category_id],
            }));
        const updatedGarmentDetails = JSON.stringify({
            service_id: garment?.service_id ?? activeServiceId,
            service: garment?.service ?? activeService.service,
            duration: garment?.duration ?? activeService.duration,
            description: garment?.description ?? activeService.description,
            categorys: updatedCategorys,
        });
        const newTotal = activeService.category_list.reduce(
            (s, c) => s + (activeEdits[c.category_id] ?? 0) * Number(c.price),
            0
        );
        const unpaid_amount = newTotal - (activeSubOrder.garment_amount ?? 0);

        try {
            setSaving(true);
            setSaveError('');
            const res = await BookingApiService.updateSubOrderGarment({
                sub_order_id: activeSubOrder._id,
                garment_details: updatedGarmentDetails,
                unpaid_amount,
            });
            if (res.status) {
                setShowSaveConfirm(false);
                toast({ title: 'Saved', description: `${activeService.service} garment details updated` });
                await fetchData();
            }
        } catch (err: any) {
            setSaveError(err.message || 'Failed to save garment details');
        } finally {
            setSaving(false);
        }
    };

    const handleQcDone = async () => {
        if (!activeSubOrder) return;
        try {
            setQcLoading(true);
            setQcError('');
            const res = await AssignApiService.qualityCheckCompleted(activeSubOrder._id);
            if (res.status) {
                setShowQcConfirm(false);
                toast({ title: 'QC Done', description: `${activeSubOrder.service_name} quality check completed` });
                await fetchData();
                const remaining = orderData?.subOrders.filter(
                    (s) => !s.quality_check && s._id !== activeSubOrder._id
                );
                if (remaining && remaining.length > 0) {
                    setActiveServiceId(parseInt(remaining[0].service_id));
                }
            } else {
                setQcError((res as any).msg || 'Failed to complete quality check');
            }
        } catch (err: any) {
            setQcError(err.message || 'Failed to complete quality check');
        } finally {
            setQcLoading(false);
        }
    };

    // ── Loading / Error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading order details…</p>
            </div>
        );
    }

    if (error || !orderId) {
        return (
            <div className="p-6 space-y-4 max-w-lg">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || 'Order ID missing.'}</AlertDescription>
                </Alert>
                {orderId && (
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry
                    </Button>
                )}
            </div>
        );
    }

    const order = orderData?.order;
    const allQcDone = orderData?.subOrders.every((s) => s.quality_check) ?? false;
    const doneCount = orderData?.subOrders.filter((s) => s.quality_check).length ?? 0;
    const totalCount = orderData?.subOrders.length ?? 0;

    const saveNewTotal = activeService
        ? activeService.category_list.reduce(
              (s, c) => s + (activeEdits[c.category_id] ?? 0) * Number(c.price),
              0
          )
        : 0;
    const saveUnpaid = saveNewTotal - (activeSubOrder?.garment_amount ?? 0);

    const activeMeta = SERVICE_META[resolveServiceKey(activeService?.service ?? '')];

    return (
        <div className="space-y-6 p-4 md:p-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => router.back()}>
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Quality Check</h1>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-muted-foreground">{order?.order_display_no}</span>
                        {allQcDone ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 border">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> All Done
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs">
                                {doneCount}/{totalCount} completed
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Update garment categories and mark quality check for each service
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0 rounded-xl self-start sm:self-center">
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* ── Quick stat chips ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Order No',
                        value: order?.order_display_no,
                        sub: order?.order_type,
                        icon: <Hash className="h-4 w-4 text-primary" />,
                        iconBg: 'bg-primary/10',
                    },
                    {
                        label: 'Booking Date',
                        value: formatDate(order?.booking_date ?? ''),
                        sub: order?.booking_time,
                        icon: <Calendar className="h-4 w-4 text-indigo-600" />,
                        iconBg: 'bg-indigo-100',
                    },
                    {
                        label: 'Payment',
                        value: order?.payment_status,
                        sub: order?.payment_mode,
                        icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
                        iconBg: 'bg-emerald-100',
                    },
                    {
                        label: 'QC Progress',
                        value: `${doneCount} / ${totalCount}`,
                        sub: allQcDone ? 'All done' : 'In progress',
                        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                        iconBg: 'bg-green-100',
                    },
                ].map((stat) => (
                    <Card key={stat.label} className="rounded-2xl shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                {stat.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="font-bold text-sm truncate">{stat.value}</p>
                                {stat.sub && <p className="text-xs text-muted-foreground truncate capitalize">{stat.sub}</p>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Order Details + Billing ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Order Information */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-muted-foreground" />
                            Order Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {[
                            {
                                label: 'Services',
                                value: order?.service_name,
                                icon: <Zap className="h-3.5 w-3.5 text-muted-foreground" />,
                                multiline: true,
                            },
                            {
                                label: 'Booking Date',
                                value: `${formatDate(order?.booking_date ?? '')} at ${order?.booking_time}`,
                                icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                            {
                                label: 'Transaction ID',
                                value: order?.transaction_id || '—',
                                icon: <Hash className="h-3.5 w-3.5 text-muted-foreground" />,
                                mono: true,
                            },
                            {
                                label: 'Offer Code',
                                value: order?.offer_code || '—',
                                icon: <Tag className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                            {
                                label: 'Garments Booked',
                                value: String(order?.garment_qty ?? 0),
                                icon: <Shirt className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                            {
                                label: 'Garments Picked',
                                value: String(order?.no_of_garments_picked ?? 0),
                                icon: <Truck className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                            {
                                label: 'Processed',
                                value: String(order?.no_of_garments_processed ?? 0),
                                icon: <Package className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                            {
                                label: 'Delivered',
                                value: String(order?.no_of_garments_delivered ?? 0),
                                icon: <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />,
                            },
                        ].map((row, i) => (
                            <div
                                key={row.label}
                                className={`flex items-start justify-between gap-4 px-5 py-3 ${i % 2 === 0 ? 'bg-muted/20' : ''} border-b last:border-b-0`}
                            >
                                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                    {row.icon}
                                    {row.label}
                                </div>
                                <p className={`text-xs font-semibold text-right leading-relaxed ${(row as any).mono ? 'font-mono' : ''}`}>
                                    {row.value}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Billing Breakdown */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            Billing Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Garment base */}
                        <div className="px-5 py-3 flex items-center justify-between bg-muted/20">
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <Shirt className="h-3.5 w-3.5" /> Garment Amount
                            </span>
                            <span className="text-xs font-semibold flex items-center gap-0.5">
                                <IndianRupee className="h-3 w-3" />
                                {order?.order_amount?.toLocaleString('en-IN') ?? 0}
                            </span>
                        </div>

                        <div className="px-5 py-1.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Charges</p>
                        </div>

                        {[
                            {
                                label: 'Delivery Charge',
                                icon: <Truck className="h-3.5 w-3.5" />,
                                value: order?.delivery_charge ?? 0,
                                color: '',
                            },
                            {
                                label: 'Handling Charges',
                                icon: <Package className="h-3.5 w-3.5" />,
                                value: order?.handling_charges ?? 0,
                                color: '',
                            },
                            {
                                label: 'Service Charges',
                                icon: <Zap className="h-3.5 w-3.5" />,
                                value: order?.service_charges ?? 0,
                                color: '',
                            },
                            {
                                label: 'Slot Charges',
                                icon: <Clock className="h-3.5 w-3.5" />,
                                value: order?.slot_charges ?? 0,
                                color: '',
                            },
                            {
                                label: 'Tip',
                                icon: <Wallet className="h-3.5 w-3.5" />,
                                value: order?.tip_amount ?? 0,
                                color: '',
                            },
                        ].map((row, i) => (
                            <div
                                key={row.label}
                                className={`px-5 py-2.5 flex items-center justify-between ${i % 2 !== 0 ? 'bg-muted/20' : ''}`}
                            >
                                <span className="text-xs text-muted-foreground flex items-center gap-2">
                                    {row.icon} {row.label}
                                </span>
                                <span className="text-xs font-medium flex items-center gap-0.5">
                                    <IndianRupee className="h-3 w-3" />
                                    {row.value.toLocaleString('en-IN')}
                                </span>
                            </div>
                        ))}

                        {/* Offer discount */}
                        {(order?.offer_amount ?? 0) > 0 && (
                            <div className="px-5 py-2.5 flex items-center justify-between bg-green-50">
                                <span className="text-xs text-green-700 flex items-center gap-2">
                                    <Tag className="h-3.5 w-3.5" />
                                    Offer ({order?.offer_code})
                                </span>
                                <span className="text-xs font-semibold text-green-700 flex items-center gap-0.5">
                                    − <IndianRupee className="h-3 w-3" />
                                    {order?.offer_amount?.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        {/* Total billing */}
                        <div className="px-5 py-3.5 flex items-center justify-between border-t border-t-border bg-primary/5">
                            <span className="text-sm font-bold flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-primary" />
                                Total Billing
                            </span>
                            <span className="text-base font-bold text-primary flex items-center gap-0.5">
                                ₹{order?.total_billing?.toLocaleString('en-IN')}
                            </span>
                        </div>

                        {/* Unpaid */}
                        <div className={`px-5 py-2.5 flex items-center justify-between border-t ${
                            (order?.unpaid_amount ?? 0) > 0
                                ? 'bg-red-50'
                                : 'bg-muted/10'
                        }`}>
                            <span className={`text-xs font-medium flex items-center gap-2 ${
                                (order?.unpaid_amount ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                                <Wallet className="h-3.5 w-3.5" />
                                Unpaid Amount
                            </span>
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${
                                (order?.unpaid_amount ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                                <IndianRupee className="h-3 w-3" />
                                {order?.unpaid_amount?.toLocaleString('en-IN') ?? 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-5 items-start">

                {/* ── Left: Service Panel ── */}
                <Card className="rounded-2xl shadow-sm xl:sticky xl:top-4">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        {orderData?.subOrders.map((sub) => {
                            const sid = parseInt(sub.service_id);
                            const isActive = sid === activeServiceId;
                            const meta = SERVICE_META[resolveServiceKey(sub.service_name)];
                            const edits = garmentEdits[sid] ?? {};
                            const assignedQty = Object.values(edits).reduce((s, q) => s + q, 0);

                            return (
                                <button
                                    key={sid}
                                    onClick={() => {
                                        setActiveServiceId(sid);
                                        setSaveError('');
                                        setQcError('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted/60 text-foreground'
                                    }`}
                                >
                                    <span
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isActive ? 'bg-white/20' : `${meta.bg}`
                                        }`}
                                    >
                                        <span className={isActive ? 'text-white' : meta.color}>
                                            {meta.icon}
                                        </span>
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-foreground' : ''}`}>
                                            {sub.service_name}
                                        </p>
                                        <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {sub.no_of_garments_picked} picked
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {sub.quality_check ? (
                                            <CheckCircle2 className={`h-4 w-4 ${isActive ? 'text-green-300' : 'text-green-500'}`} />
                                        ) : assignedQty > 0 ? (
                                            <span
                                                className={`h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {assignedQty}
                                            </span>
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* ── Right: Category Editor ── */}
                <div className="space-y-4">

                    {/* Active service info */}
                    {activeService && (
                        <Card className={`rounded-2xl shadow-sm border ${activeMeta.border}`}>
                            <CardContent className={`p-4 ${activeMeta.bg} rounded-2xl`}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl ${activeMeta.bg} border ${activeMeta.border} flex items-center justify-center shrink-0`}>
                                        <span className={activeMeta.color}>{activeMeta.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{activeService.description}</p>
                                        <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${activeMeta.color}`}>
                                            <Clock className="h-3.5 w-3.5" />
                                            Duration: {activeService.duration}
                                        </p>
                                    </div>
                                    {activeSubOrder?.quality_check && (
                                        <Badge className="bg-green-100 text-green-700 border-green-200 border shrink-0">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> QC Done
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Category editor card */}
                    {activeService && !activeSubOrder?.quality_check && (
                        <Card className="rounded-2xl shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shirt className="h-4 w-4 text-muted-foreground" />
                                        Garment Categories
                                    </CardTitle>
                                    <div className="flex items-center gap-3">
                                        {/* Quota pill */}
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                                isFull
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}
                                        >
                                            <Shirt className="h-3 w-3" />
                                            {totalActiveQty} / {pickedLimit}
                                            {isFull && <CheckCircle2 className="h-3 w-3" />}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                                            onClick={removeAll}
                                            disabled={totalActiveQty === 0}
                                        >
                                            Reset all
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Column headers */}
                            <div className="hidden sm:grid sm:grid-cols-[1fr_80px_120px_100px] gap-4 px-5 py-2 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                <div>Category</div>
                                <div>Price</div>
                                <div className="text-center">Quantity</div>
                                <div className="text-right">Amount</div>
                            </div>

                            <CardContent className="p-0">
                                {activeService.category_list.map((cat: CategoryItem, idx: number) => {
                                    const qty = activeEdits[cat.category_id] ?? 0;
                                    const isAtLimit = totalActiveQty >= pickedLimit;
                                    const rowAmount = qty * Number(cat.price);

                                    return (
                                        <div
                                            key={cat.category_id}
                                            className={`grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_100px] gap-4 items-center px-5 py-3.5 border-b last:border-b-0 transition-colors ${
                                                qty > 0 ? 'bg-primary/3' : ''
                                            } ${idx % 2 === 0 && qty === 0 ? 'bg-muted/10' : ''}`}
                                        >
                                            {/* Category info */}
                                            <div className="min-w-0">
                                                <p className={`font-semibold text-sm ${qty > 0 ? 'text-foreground' : ''}`}>
                                                    {cat.category}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
                                                    {cat.types_of_Clothes.join(', ')}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <div className="hidden sm:flex items-center gap-0.5 text-sm text-muted-foreground">
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                {cat.price}
                                            </div>

                                            {/* Qty control */}
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg shrink-0"
                                                    disabled={qty === 0}
                                                    onClick={() => adjustQty(cat.category_id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span
                                                    className={`w-8 text-center font-bold text-sm ${
                                                        qty > 0 ? 'text-primary' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {qty}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg shrink-0"
                                                    disabled={isAtLimit}
                                                    onClick={() => adjustQty(cat.category_id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Amount */}
                                            <div className={`hidden sm:flex justify-end font-semibold text-sm ${qty > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {qty > 0 ? (
                                                    <span className="flex items-center gap-0.5">
                                                        <IndianRupee className="h-3.5 w-3.5" />
                                                        {rowAmount.toLocaleString('en-IN')}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Total row */}
                                {totalActiveQty > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_100px] gap-4 items-center px-5 py-3 bg-primary/5 border-t border-primary/20">
                                        <div className="flex items-center gap-2 font-semibold text-sm">
                                            <Shirt className="h-4 w-4 text-primary" />
                                            Total — {totalActiveQty} garment{totalActiveQty !== 1 ? 's' : ''}
                                        </div>
                                        <div className="hidden sm:block" />
                                        <div className="hidden sm:block" />
                                        <div className="hidden sm:flex justify-end font-bold text-sm items-center gap-0.5">
                                            <IndianRupee className="h-3.5 w-3.5" />
                                            {saveNewTotal.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* QC already done for this service */}
                    {activeSubOrder?.quality_check && (
                        <Card className="rounded-2xl shadow-sm border-green-200">
                            <CardContent className="p-5 flex items-center gap-3 bg-green-50 rounded-2xl">
                                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                                <div>
                                    <p className="font-semibold text-green-800 text-sm">Quality Check Completed</p>
                                    <p className="text-xs text-green-600 mt-0.5">
                                        {activeSubOrder.service_name} has been verified and is ready for processing.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action panel */}
                    {activeSubOrder && !activeSubOrder.quality_check && (
                        <Card className="rounded-2xl shadow-sm">
                            <CardContent className="p-4 space-y-3">
                                {(saveError || qcError) && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{saveError || qcError}</AlertDescription>
                                    </Alert>
                                )}

                                {!isFull && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {totalActiveQty < pickedLimit
                                            ? `Assign ${pickedLimit - totalActiveQty} more garment${pickedLimit - totalActiveQty !== 1 ? 's' : ''} to enable actions (${totalActiveQty}/${pickedLimit})`
                                            : `Too many garments — reduce by ${totalActiveQty - pickedLimit}`}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        disabled={!isFull || saving}
                                        onClick={() => setShowSaveConfirm(true)}
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Shirt className="h-4 w-4 mr-2" />
                                        )}
                                        Save Changes
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        disabled={!isFull || qcLoading}
                                        onClick={() => setShowQcConfirm(true)}
                                    >
                                        {qcLoading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Mark QC Done
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── Save Confirm Dialog ── */}
            <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Shirt className="h-5 w-5 text-primary" />
                            Confirm Garment Update
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    Saving garment categories for{' '}
                                    <span className="font-semibold text-foreground">{activeSubOrder?.sub_order_no}</span>.
                                </p>
                                <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Garments</span>
                                        <span className="font-semibold text-foreground">{totalActiveQty}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>New total</span>
                                        <span className="font-semibold text-foreground">
                                            ₹{saveNewTotal.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    {saveUnpaid > 0 && (
                                        <div className="flex justify-between text-xs border-t pt-2">
                                            <span className="text-orange-600">Additional charge</span>
                                            <span className="font-bold text-orange-600">
                                                +₹{saveUnpaid.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                    {saveUnpaid < 0 && (
                                        <div className="flex justify-between text-xs border-t pt-2">
                                            <span className="text-green-600">Refund to wallet</span>
                                            <span className="font-bold text-green-600">
                                                −₹{Math.abs(saveUnpaid).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={saving} onClick={handleSave}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── QC Done Confirm Dialog ── */}
            <AlertDialog open={showQcConfirm} onOpenChange={setShowQcConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirm Quality Check
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    Mark quality check as done for{' '}
                                    <span className="font-semibold text-foreground">{activeSubOrder?.sub_order_no}</span>?
                                </p>
                                <ul className="space-y-1.5">
                                    {[
                                        'Garment quantity matches pickup count',
                                        'Each garment is in the correct category',
                                        'Garment quality has been inspected',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="font-medium text-foreground border-t pt-3">
                                    This moves the sub-order to{' '}
                                    <span className="text-green-700">Processing</span>. Cannot be undone.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={qcLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={qcLoading}
                            onClick={handleQcDone}
                        >
                            {qcLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Yes, Mark Done
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Page export (Suspense required for useSearchParams) ──────────────────────

export default function QCUpdatePage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading…</p>
                </div>
            }
        >
            <QCUpdateContent />
        </Suspense>
    );
}
