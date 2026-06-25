'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Package,
    Shirt,
    Loader2,
    AlertCircle,
    IndianRupee,
    RefreshCw,
    Flame,
    Droplets,
    Wind,
    Footprints,
    Sparkles,
    BaggageClaim,
    Hash,
    X,
    Plus,
    Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { BookingApiService, AssignApiService, SubOrderDetailsData, CategoryItem, UpdateGarmentRequest } from '@/lib/api';

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
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
    label: string;
}

const SERVICE_THEMES: Record<ServiceColorKey, ServiceTheme> = {
    'quick-ironing': {
        border: 'border-orange-300',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        icon: <Flame className="h-5 w-5" />,
        label: 'Quick Ironing',
    },
    ironing: {
        border: 'border-yellow-300',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        bg: 'bg-yellow-50',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        icon: <Shirt className="h-5 w-5" />,
        label: 'Ironing',
    },
    'wash-ironing': {
        border: 'border-purple-300',
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        icon: <Sparkles className="h-5 w-5" />,
        label: 'Wash + Ironing',
    },
    wash: {
        border: 'border-blue-300',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: <Droplets className="h-5 w-5" />,
        label: 'Wash',
    },
    'dry-cleaning': {
        border: 'border-teal-300',
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
        bg: 'bg-teal-50',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        icon: <Wind className="h-5 w-5" />,
        label: 'Dry Cleaning',
    },
    'shoes-cleaning': {
        border: 'border-stone-300',
        badge: 'bg-stone-100 text-stone-700 border-stone-200',
        bg: 'bg-stone-50',
        iconBg: 'bg-stone-100',
        iconColor: 'text-stone-600',
        icon: <Footprints className="h-5 w-5" />,
        label: 'Shoes Cleaning',
    },
    default: {
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        bg: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        icon: <Package className="h-5 w-5" />,
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
        case 'pickup assigned':
            return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'picked up':
            return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case 'delivery assigned':
            return 'bg-violet-100 text-violet-700 border-violet-200';
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

function formatDateTime(dateString: string) {
    if (!dateString) return '—';
    try {
        return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
    } catch {
        return dateString;
    }
}

function parseGarmentDetails(raw: string) {
    if (!raw) return null;
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
        return null;
    }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="text-sm font-semibold text-foreground">{value}</div>
        </div>
    );
}


export default function SubOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<SubOrderDetailsData | null>(null);

    const [showUpdatePanel, setShowUpdatePanel] = useState(false);
    const [catLoading, setCatLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [garmentEdits, setGarmentEdits] = useState<Record<number, number>>({});
    const [qualityCheckLoading, setQualityCheckLoading] = useState(false);
    const [qualityCheckError, setQualityCheckError] = useState('');
    const [showQCConfirm, setShowQCConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState('');

    const subOrderId = params?.id as string;

    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await BookingApiService.getSubOrderDetails(subOrderId);
            if (response.status && response.data) {
                setData(response.data);
            } else {
                setError(response.msg || 'Failed to fetch sub order details');
            }
        } catch (err) {
            console.error(err);
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subOrderId) fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subOrderId]);

    const openUpdatePanel = async () => {
        setShowUpdatePanel(true);
        if (categories.length > 0) return;
        setCatLoading(true);
        try {
            const res = await BookingApiService.getCategoryList(data?.subOrder?.service_id ?? '');
            if (res.status && res.data) {
                const cats = res.data.service.category_list;
                setCategories(cats);
                const currentGarment = parseGarmentDetails(data?.subOrder?.garment_details ?? '');
                const edits: Record<number, number> = {};
                if (currentGarment?.categorys?.length > 0) {
                    cats.forEach((cat) => {
                        const existing = currentGarment.categorys.find(
                            (c: any) => c.category === cat.category
                        );
                        if (existing) edits[cat.category_id] = Number(existing.items);
                    });
                }
                setGarmentEdits(edits);
            }
        } catch {
            // silently fail — panel shows empty state
        } finally {
            setCatLoading(false);
        }
    };

    const handleQualityCheckDone = async () => {
        try {
            setQualityCheckLoading(true);
            setQualityCheckError('');
            const res = await AssignApiService.qualityCheckCompleted(subOrderId);
            if (res.status) {
                router.push('/dashboard/orders/quality-check');
            } else {
                setQualityCheckError(res.msg || 'Failed to complete quality check');
            }
        } catch (err: any) {
            setQualityCheckError(err?.message || 'Failed to complete quality check');
        } finally {
            setQualityCheckLoading(false);
        }
    };

    const handleSaveGarmentUpdate = async () => {
        const subOrder = data?.subOrder;
        const garment = parseGarmentDetails(subOrder?.garment_details ?? '');
        const updatedCategorys = categories
            .filter((cat) => (garmentEdits[cat.category_id] ?? 0) > 0)
            .map((cat) => ({
                category_id: cat.category_id,
                category: cat.category,
                types_of_Clothes: cat.types_of_Clothes,
                category_prices: cat.price,
                items: garmentEdits[cat.category_id],
            }));
        const updatedGarmentDetails = JSON.stringify({
            service_id: garment?.service_id,
            service: garment?.service,
            duration: garment?.duration,
            description: garment?.description,
            categorys: updatedCategorys,
        });
        const newTotal = categories.reduce(
            (s, c) => s + (garmentEdits[c.category_id] ?? 0) * Number(c.price),
            0
        );
        // negative = wallet credit back to customer, positive = customer owes more
        const unpaid_amount = newTotal - (subOrder?.garment_amount ?? 0);
        try {
            setSaveLoading(true);
            setSaveError('');
            const res = await BookingApiService.updateSubOrderGarment({
                sub_order_id: subOrderId,
                garment_details: updatedGarmentDetails,
                unpaid_amount,
            });
            if (res.status) {
                setShowSaveConfirm(false);
                setShowUpdatePanel(false);
                setCategories([]);
                setGarmentEdits({});
                await fetchDetails();
            }
        } catch (err: any) {
            setSaveError(err?.message || 'Failed to update garment details');
        } finally {
            setSaveLoading(false);
        }
    };

    const adjustQty = (categoryId: number, delta: number) => {
        const pickedLimit = subOrder?.no_of_garments_picked ?? 0;
        setGarmentEdits((prev) => {
            const currentCatQty = prev[categoryId] ?? 0;
            const newCatQty = Math.max(0, currentCatQty + delta);
            const currentTotal = Object.values(prev).reduce((s, q) => s + q, 0);
            const newTotal = currentTotal - currentCatQty + newCatQty;
            if (newTotal > pickedLimit) return prev;
            return { ...prev, [categoryId]: newCatQty };
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading sub order details…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 space-y-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={fetchDetails} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                </Button>
            </div>
        );
    }

    const subOrder = data?.subOrder;
    const address = data?.address;
    const garment = parseGarmentDetails(subOrder?.garment_details ?? '');
    const theme = SERVICE_THEMES[resolveServiceKey(subOrder?.service_name ?? '')];

    return (
        <div className="space-y-5 p-4 md:p-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => router.back()}>
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {subOrder?.sub_order_no}
                        </h1>
                        <span className="text-sm text-muted-foreground font-mono">
                            ← {subOrder?.order_no}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(subOrder?.ord_status ?? '')}`}
                        >
                            {subOrder?.ord_status}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sub-order details, garment breakdown and assignments
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDetails} className="shrink-0 rounded-xl">
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                            <span className={theme.iconColor}>{theme.icon}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Service</p>
                            <p className="text-sm font-bold mt-0.5 truncate">{subOrder?.service_name}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Shirt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Order Garments</p>
                            <p className="text-2xl font-bold mt-0.5">{subOrder?.garment_qty}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Shirt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Pickup Garments</p>
                            <p className="text-2xl font-bold mt-0.5">{subOrder?.no_of_garments_picked}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                            <IndianRupee className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="text-2xl font-bold mt-0.5">
                                ₹{subOrder?.garment_amount?.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-2xl font-bold mt-0.5">
                                {subOrder?.service_duration_hours ?? '—'}
                                <span className="text-sm font-normal ml-1">hrs</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="xl:col-span-2 space-y-5">


                {/* ── UPDATE GARMENT PANEL ── */}
                {showUpdatePanel && (
                    <Card className="rounded-2xl shadow-sm border-primary/40">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span className="flex items-center gap-2">
                                    <Shirt className="h-4 w-4 text-primary" />
                                    Update Garment Categories
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setShowUpdatePanel(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {catLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading categories…</p>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No categories available.
                                </div>
                            ) : (
                                <>
                                    {/* Quota indicator */}
                                    {(() => {
                                        const pickedLimit = subOrder?.no_of_garments_picked ?? 0;
                                        const totalQty = Object.values(garmentEdits).reduce((s, q) => s + q, 0);
                                        const remaining = pickedLimit - totalQty;
                                        const isFull = remaining <= 0;
                                        return (
                                            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium ${isFull ? 'bg-green-50 border-green-300 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <Shirt className="h-4 w-4" />
                                                    Garments assigned: <span className="font-bold">{totalQty}</span> / <span className="font-bold">{pickedLimit}</span>
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isFull ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {isFull ? 'Quota full' : `${remaining} remaining`}
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    <div className="space-y-3">
                                        {categories.map((cat) => {
                                            const qty = garmentEdits[cat.category_id] ?? 0;
                                            const pickedLimit = subOrder?.no_of_garments_picked ?? 0;
                                            const totalQty = Object.values(garmentEdits).reduce((s, q) => s + q, 0);
                                            const isAtLimit = totalQty >= pickedLimit;
                                            return (
                                                <div
                                                    key={cat._id}
                                                    className={`border rounded-xl overflow-hidden transition-colors ${qty > 0 ? 'border-primary' : 'border-border'}`}
                                                >
                                                    <div className="p-3 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-sm">{cat.category}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-0.5">
                                                                <IndianRupee className="h-3 w-3" />{cat.price}/item
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7 rounded-lg"
                                                                disabled={qty === 0}
                                                                onClick={() => adjustQty(cat.category_id, -1)}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="w-8 text-center font-bold text-sm">{qty}</span>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7 rounded-lg"
                                                                disabled={isAtLimit}
                                                                title={isAtLimit ? `Maximum ${pickedLimit} garments allowed (matches pickup count)` : undefined}
                                                                onClick={() => adjustQty(cat.category_id, 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                                                        {cat.types_of_Clothes.map((cloth) => (
                                                            <span
                                                                key={cloth}
                                                                className="px-2.5 py-0.5 rounded-full bg-muted text-xs border"
                                                            >
                                                                {cloth}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Running total */}
                                    {(() => {
                                        const totalQty = Object.values(garmentEdits).reduce((s, q) => s + q, 0);
                                        const totalAmt = categories.reduce(
                                            (s, c) => s + (garmentEdits[c.category_id] ?? 0) * Number(c.price),
                                            0
                                        );
                                        if (totalQty === 0) return null;
                                        return (
                                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Shirt className="h-4 w-4 text-primary" />
                                                    Total — {totalQty} garments
                                                </div>
                                                <div className="font-bold flex items-center gap-0.5">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {totalAmt.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Actions */}
                                    {saveError && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{saveError}</AlertDescription>
                                        </Alert>
                                    )}
                                    {(() => {
                                        const pickedLimit = subOrder?.no_of_garments_picked ?? 0;
                                        const totalQty = Object.values(garmentEdits).reduce((s, q) => s + q, 0);
                                        if (totalQty > pickedLimit) {
                                            return (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Total garments ({totalQty}) exceeds the number of garments picked up ({pickedLimit}). Please reduce quantities before saving.
                                                    </AlertDescription>
                                                </Alert>
                                            );
                                        } else if (totalQty < pickedLimit) {
                                            return (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Total garments ({totalQty}) is less than the number of garments picked up ({pickedLimit}). Please increase quantities before saving.
                                                    </AlertDescription>
                                                </Alert>
                                            );
                                        }

                                        return null;
                                    })()}
                                    <div className="flex gap-3 pt-1">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            disabled={false}
                                            onClick={() => setShowUpdatePanel(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            disabled={Object.values(garmentEdits).reduce((s, q) => s + q, 0) != (subOrder?.no_of_garments_picked ?? 0)}
                                            //saveLoading || Object.values(garmentEdits).reduce((s, q) => s + q, 0) != (subOrder?.no_of_garments_picked ?? 0)} 
                                            onClick={() => setShowSaveConfirm(true)}
                                        >
                                            <Shirt className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </div>

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
                                                            You are about to save updated garment categories for sub-order{' '}
                                                            <span className="font-semibold text-foreground">{data?.subOrder?.sub_order_no}</span>.
                                                        </p>
                                                        {(() => {
                                                            const totalQty = Object.values(garmentEdits).reduce((s, q) => s + q, 0);
                                                            const totalAmt = categories.reduce(
                                                                (s, c) => s + (garmentEdits[c.category_id] ?? 0) * Number(c.price),
                                                                0
                                                            );
                                                            const unpaid = totalAmt - (data?.subOrder?.garment_amount ?? 0);
                                                            return (
                                                                <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-1.5">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span>Total garments</span>
                                                                        <span className="font-semibold text-foreground">{totalQty}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs">
                                                                        <span>Total amount</span>
                                                                        <span className="font-semibold text-foreground">₹{totalAmt.toLocaleString('en-IN')}</span>
                                                                    </div>
                                                                    {unpaid > 0 && (
                                                                        <div className="flex justify-between text-xs border-t pt-1.5">
                                                                            <span className="text-orange-600">Additional unpaid amount</span>
                                                                            <span className="font-bold text-orange-600">₹{unpaid.toLocaleString('en-IN')}</span>
                                                                        </div>
                                                                    )}
                                                                    {unpaid < 0 && (
                                                                        <div className="flex justify-between text-xs border-t pt-1.5">
                                                                            <span className="text-green-600 font-medium">Wallet credit (refund)</span>
                                                                            <span className="font-bold text-green-600">₹{Math.abs(unpaid).toLocaleString('en-IN')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                        <p className="font-medium text-foreground">
                                                            Please verify the category breakdown is correct before saving.
                                                        </p>
                                                    </div>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={saveLoading}>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    disabled={saveLoading}
                                                    onClick={handleSaveGarmentUpdate}
                                                >
                                                    {saveLoading ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Shirt className="h-4 w-4 mr-2" />
                                                    )}
                                                    Yes, Save Changes
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Garment Details */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className={`h-6 w-6 rounded-lg ${theme.iconBg} flex items-center justify-center`}>
                                <span className={`${theme.iconColor} [&>svg]:h-3.5 [&>svg]:w-3.5`}>{theme.icon}</span>
                            </div>
                            Garment Details
                            {garment?.service && (
                                <span className="text-sm font-normal text-muted-foreground">
                                    — {garment.service}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {garment?.description && (
                            <div className={`${theme.bg} border ${theme.border} rounded-xl px-4 py-3`}>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {garment.description}
                                    {garment.duration && (
                                        <span className="ml-1 font-medium text-foreground">
                                            ({garment.duration})
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {garment?.categorys?.length > 0 ? (
                            garment.categorys.map((cat: any, ci: number) => (
                                <div key={ci} className="border rounded-xl overflow-hidden">
                                    {/* Category header */}
                                    <div className={`${theme.bg} px-4 py-3 flex items-center justify-between border-b`}>
                                        <div>
                                            <p className="font-semibold text-sm">{cat.category}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {cat.items} item{cat.items !== 1 ? 's' : ''} selected
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full border text-sm font-bold ${theme.badge}`}>
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                {cat.category_prices}
                                                <span className="text-xs font-normal">/item</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Clothes list */}
                                    <div className="px-4 py-3">
                                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                                            Includes
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {cat.types_of_Clothes?.map((cloth: string, ci2: number) => (
                                                <span
                                                    key={ci2}
                                                    className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium border"
                                                >
                                                    {cloth}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer total */}
                                    <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{cat.items} × ₹{cat.category_prices}</span>
                                        <span className="font-semibold text-foreground">
                                            = ₹{(Number(cat.items) * Number(cat.category_prices)).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border rounded-xl bg-muted/10">
                                <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No garment details available</p>
                            </div>
                        )}

                        {/* Total summary */}
                        {garment?.categorys?.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Shirt className="h-4 w-4 text-primary" />
                                    Total — {subOrder?.garment_qty} garments
                                </div>
                                <div className="font-bold flex items-center gap-0.5">
                                    <IndianRupee className="h-4 w-4" />
                                    {subOrder?.garment_amount?.toLocaleString('en-IN')}
                                </div>
                            </div>
                        )}
                        {/* Extra garment pickup summary */}
                        {(subOrder?.no_of_garments_picked ?? 0) - (subOrder?.garment_qty ?? 0) > 0 && (
                            <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-red-50 border border-red-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                                        <Shirt className="h-4 w-4 text-red-600" />
                                        Extra — {(subOrder?.no_of_garments_picked ?? 0) - (subOrder?.garment_qty ?? 0)} garments pickup
                                    </div>
                                    <div className="font-bold flex items-center gap-0.5 text-red-700">
                                        <IndianRupee className="h-4 w-4" />
                                        {/* {(subOrder?.extra_garments_amount ?? 0).toLocaleString('en-IN')} */}
                                    </div>
                                </div>
                                <p className="text-xs text-red-500">Please check and update the correct category for extra garments.</p>
                            </div>
                        )}
                        {/* Garment total summary */}
                        {(subOrder?.no_of_garments_picked ?? 0) - (subOrder?.garment_qty ?? 0) > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-600">
                                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                                    <Shirt className="h-4 w-4 text-red-600" />
                                    Total — {(subOrder?.no_of_garments_picked ?? 0)} garments pickup
                                </div>
                                <div className="font-bold flex items-center gap-0.5 text-red-700">
                                    <IndianRupee className="h-4 w-4" />
                                    {/* {((subOrder?.garment_amount ?? 0) + (subOrder?.extra_garments_amount ?? 0)).toLocaleString('en-IN')} */}
                                </div>
                            </div>
                        )}

                        {(subOrder?.no_of_garments_picked ?? 0) - (subOrder?.garment_qty ?? 0) > 0 && (
                            <Button
                                className="w-full bg-red-600 text-white hover:bg-red-700 border border-red-600"
                                onClick={openUpdatePanel}
                            >
                                <Shirt className="h-4 w-4 mr-2" />
                                Update Garment
                            </Button>
                        )}
                        {garment?.categorys?.length > 0 && (
                            <>
                                {qualityCheckError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{qualityCheckError}</AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    className="w-full bg-green-600 text-white hover:bg-green-700 border border-green-600"
                                    onClick={() => setShowQCConfirm(true)}
                                    disabled={qualityCheckLoading}
                                >
                                    {qualityCheckLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Shirt className="h-4 w-4 mr-2" />
                                    )}
                                    Garment Check Done
                                </Button>

                                <AlertDialog open={showQCConfirm} onOpenChange={setShowQCConfirm}>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                                <Shirt className="h-5 w-5 text-green-600" />
                                                Confirm Quality Check Completion
                                            </AlertDialogTitle>
                                            <AlertDialogDescription asChild>
                                                <div className="space-y-3 text-sm text-muted-foreground">
                                                    <p>
                                                        Please confirm you have thoroughly verified the following before marking this sub-order as quality checked:
                                                    </p>
                                                    <ul className="space-y-1.5 pl-1">
                                                        <li className="flex items-start gap-2">
                                                            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                                                            <span>Garment <strong>quantity</strong> matches the pickup count</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                                                            <span>Garment <strong>quality</strong> has been inspected for damage or stains</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                                                            <span><strong>Category breakdown</strong> is correctly updated</span>
                                                        </li>
                                                    </ul>
                                                    <p className="font-medium text-foreground border-t pt-3">
                                                        Once confirmed, this order will move to <span className="text-green-700">Processing</span> and cannot be reverted.
                                                    </p>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={qualityCheckLoading}>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                disabled={qualityCheckLoading}
                                                onClick={handleQualityCheckDone}
                                            >
                                                {qualityCheckLoading ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Shirt className="h-4 w-4 mr-2" />
                                                )}
                                                Yes, Quality Check Done
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}

                    </CardContent>
                </Card>
                {/* Order Info */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            Order Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <InfoRow label="Sub Order No" value={subOrder?.sub_order_no} />
                        <InfoRow label="Main Order No" value={subOrder?.order_no} />
                        <InfoRow
                            label="Service"
                            value={
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${theme.badge}`}>
                                    {theme.icon}
                                    {subOrder?.service_name}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Pickup Date"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {formatDate(subOrder?.booking_date ?? '')}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Pickup Time"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    {subOrder?.booking_time}
                                </span>
                            }
                        />
                        <InfoRow label="Service Duration" value={`${subOrder?.service_duration_hours ?? '—'} hours`} />
                        <InfoRow
                            label="Expected Delivery"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {formatDate(subOrder?.expected_delivery_date ?? '')}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Delivery Time"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    {subOrder?.expected_delivery_time}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Bags"
                            value={
                                <span className="flex items-center gap-1.5">
                                    <BaggageClaim className="h-3.5 w-3.5 text-muted-foreground" />
                                    {subOrder?.no_of_bag ?? 0} bags
                                </span>
                            }
                        />
                        {/* <InfoRow label="Bags Outward" value={subOrder?.no_of_bag_outward ?? 0} /> */}
                        {/* <InfoRow label="Bags Return" value={subOrder?.no_of_bag_return ?? 0} /> */}
                        <InfoRow
                            label="Created At"
                            value={formatDateTime(subOrder?.createdAt ?? '')}
                        />
                    </CardContent>
                </Card>



            </div>
        </div>
    );
}
