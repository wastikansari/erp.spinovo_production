'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Package,
    Shirt,
    UserCheck,
    Loader2,
    AlertCircle,
    IndianRupee,
    RefreshCw,
    Truck,
    Settings,
    Home,
    CheckCircle2,
    Circle,
    Flame,
    Droplets,
    Wind,
    Footprints,
    Sparkles,
    BaggageClaim,
    Hash,
    ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingApiService, SubOrderDetailsData } from '@/lib/api';
import { GarmentSegregationTable, getSegregatedCategories } from '@/components/bookings/garment-segregation';
import { CustomerTag } from '@/components/bookings/customer-tag';

// ─── Service Color System ─────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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


// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="text-sm font-semibold text-foreground">{value}</div>
        </div>
    );
}

// function AssignmentCard({
//     title,
//     icon,
//     iconBg,
//     iconColor,
//     assignment,
//     emptyLabel,
//     fields,
// }: {
//     title: string;
//     icon: React.ReactNode;
//     iconBg: string;
//     iconColor: string;
//     assignment: any;
//     emptyLabel: string;
//     fields?: { label: string; key: string }[];
// }) {
//     return (
//         <Card className="rounded-2xl shadow-sm">
//             <CardHeader className="pb-3">
//                 <CardTitle className="flex items-center gap-2 text-base">
//                     <div className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center`}>
//                         <span className={iconColor}>{icon}</span>
//                     </div>
//                     {title}
//                 </CardTitle>
//             </CardHeader>
//             <CardContent>
//                 {assignment ? (
//                     <div className="space-y-3">
//                         <div className="flex items-center gap-2">
//                             <CheckCircle2 className="h-4 w-4 text-green-500" />
//                             <span className="text-sm font-medium text-green-700">Assigned</span>
//                         </div>
//                         {fields?.map((f) => (
//                             <div key={f.key} className="flex justify-between text-sm">
//                                 <span className="text-muted-foreground">{f.label}</span>
//                                 <span className="font-medium">{assignment[f.key] ?? '—'}</span>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="flex items-center gap-2 py-1">
//                         <Circle className="h-4 w-4 text-muted-foreground" />
//                         <span className="text-sm text-muted-foreground">{emptyLabel}</span>
//                     </div>
//                 )}
//             </CardContent>
//         </Card>
//     );
// }
// Date + time in IST, e.g. "14 Oct 2026, 05:12 pm"
function formatToIST(value?: string | null) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return value;
    }
}

const COPILOT_STATUS: Record<number, string> = {
    0: 'Cancelled', 1: 'Assigned', 2: 'Started', 3: 'Completed', 4: 'Attempted',
};
const VENDOR_STATUS: Record<number, string> = {
    0: 'Rejected', 1: 'Assigned', 2: 'Accepted', 3: 'Picked up', 4: 'Processing',
    5: 'Completed (inward pending)', 6: 'Inward done',
};

type TimeRow = {
    label: string;
    value?: string | null;     // ISO date — shown as IST date + time
    text?: React.ReactNode;    // plain value instead of a date
    estimated?: boolean;       // filled from old data, not recorded live
};

function TimeRows({ rows }: { rows: TimeRow[] }) {
    return (
        <div className="space-y-2">
            {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0">{r.label}</span>
                    <span className="font-medium text-right">
                        {r.text ?? formatToIST(r.value)}
                        {r.estimated && r.value && (
                            <span className="ml-1 text-xs font-normal text-amber-600" title="Estimated from old records">(approx)</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StageCard({
    title, icon, iconBg, iconColor, empty, emptyLabel, children,
}: {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    empty: boolean;
    emptyLabel: string;
    children?: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center`}>
                        <span className={iconColor}>{icon}</span>
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {empty ? (
                    <div className="flex items-center gap-2 py-1">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{emptyLabel}</span>
                    </div>
                ) : (
                    <div className="space-y-4">{children}</div>
                )}
            </CardContent>
        </Card>
    );
}

function PersonLink({ name, mobile, onClick }: { name?: string; mobile?: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/70 transition-colors cursor-pointer text-right"
        >
            {name || 'View'}{mobile ? ` · ${mobile}` : ''} <span className="text-xs">↗</span>
        </button>
    );
}

function SubList({ title, items }: { title: string; items: React.ReactNode[] }) {
    if (!items.length) return null;
    return (
        <div className="border-t pt-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {items.map((item, i) => (
                <div key={i} className="text-xs text-muted-foreground">{item}</div>
            ))}
        </div>
    );
}

function attemptItems(assignment: any) {
    return (assignment?.order_attempt ?? []).map((a: any) => (
        <span key={a._id ?? a.attempt_no}>
            <span className="font-medium text-foreground">#{a.attempt_no} {a.reason_text}</span>
            {a.message ? ` — ${a.message}` : ''} · {formatToIST(a.createdAt)}
        </span>
    ));
}

function previousCopilotItems(assignment: any) {
    return (assignment?.previous_copilots ?? []).map((p: any, i: number) => (
        <span key={i}>
            <span className="font-medium text-foreground">{p.copilot_name || p.copilot_id}</span>
            {' '}· {formatToIST(p.assigned_at)} → removed {formatToIST(p.removed_at)}
            {p.removed_by ? ` by ${p.removed_by}` : ''}
        </span>
    ));
}

const isEstimated = (doc: any, field: string) => (doc?.estimated_fields ?? []).includes(field);

// ─── Order Stage Timeline ─────────────────────────────────────────────────────

type TimelineStep = {
    label: string;
    icon: React.ReactNode;
    at?: string | null;   // real time of the step, when recorded
    reached: boolean;     // step happened (even if old data has no time)
};

function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
    const currentIndex = steps.findIndex((s) => !s.reached);
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {steps.map((step, i) => {
                        const done = step.reached;
                        const active = i === currentIndex;
                        return (
                            <div key={step.label} className="flex items-start gap-3 relative">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div
                                        className={`absolute left-[13px] top-7 w-0.5 h-full ${done ? 'bg-primary' : 'bg-border'}`}
                                    />
                                )}
                                {/* Dot */}
                                <div
                                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors relative ${done
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : active
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-muted border-border text-muted-foreground'
                                        }`}
                                >
                                    {step.icon}
                                </div>
                                <div className="pb-5">
                                    <p
                                        className={`text-sm font-medium leading-tight ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                    {done && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {step.at ? formatToIST(step.at) : 'Time not recorded'}
                                        </p>
                                    )}
                                    {active && (
                                        <p className="text-xs text-primary mt-0.5">Next stage</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<SubOrderDetailsData | null>(null);

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
    const segregated = getSegregatedCategories(subOrder?.garment_segregated);
    const theme = SERVICE_THEMES[resolveServiceKey(subOrder?.service_name ?? '')];
    const pickup: any = data?.pickupAssignment;
    const process: any = data?.processAssignment;
    const delivery: any = data?.deliveryAssignment;
    const stageId = subOrder?.order_stage_id ?? 1;

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
                        <CustomerTag
                            orderNo={data?.customerRank?.customer_order_no}
                            total={data?.customerRank?.customer_total_orders}
                        />
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── LEFT (2/3) ── */}
                <div className="xl:col-span-2 space-y-5">

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
                            <InfoRow label="Bags Outward" value={subOrder?.no_of_bag_outward ?? 0} />
                            <InfoRow label="Bags Return" value={subOrder?.no_of_bag_return ?? 0} />
                            <InfoRow
                                label="Created At"
                                value={formatDateTime(subOrder?.createdAt ?? '')}
                            />
                        </CardContent>
                    </Card>

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
                            {/* {(subOrder?.extra_garments_amount ?? 0) > 0 && garment?.categorys?.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-600">
                                    <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                                        <Shirt className="h-4 w-4 text-red-600" />
                                        Extra — {(subOrder?.garment_qty ?? 0) - (subOrder?.no_of_garments_picked ?? 0)} garments pickup. <div className='text-white'>( Please check and update the correct category for extra garments.)</div>
                                    </div>
                                    <div className="font-bold flex items-center gap-0.5 text-red-700">
                                        <IndianRupee className="h-4 w-4" />
                                        {(subOrder?.extra_garments_amount ?? 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            )} */}
                            {/* Garment total summary */}
                            {/* {(subOrder?.extra_garments_amount ?? 0) > 0 && garment?.categorys?.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-600">
                                    <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                                        <Shirt className="h-4 w-4 text-red-600" />
                                        Total — {(subOrder?.no_of_garments_picked ?? 0)} garments pickup
                                    </div>
                                    <div className="font-bold flex items-center gap-0.5 text-red-700">
                                        <IndianRupee className="h-4 w-4" />
                                        {((subOrder?.garment_amount ?? 0) + (subOrder?.extra_garments_amount ?? 0)).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            )} */}

                            {/* {(subOrder?.extra_garments_amount ?? 0) > 0 && garment?.categorys?.length > 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full border-red-600 text-red-600 hover:bg-red-800 hover:text-red-100 bg-red-600 text-white"
                                    onClick={() => { }}
                                >
                                    <Shirt className="h-4 w-4 mr-2" />
                                    Update Garment
                                </Button>
                            )} */}



                        </CardContent>
                    </Card>

                    {/* Garment Segregation (saved at QC) */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListChecks className="h-4 w-4 text-muted-foreground" />
                                Garment Segregation
                                {subOrder?.quality_check && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold bg-green-100 text-green-700 border-green-200">
                                        <CheckCircle2 className="h-3 w-3" /> QC Done
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {segregated.length > 0 ? (
                                <GarmentSegregationTable categories={segregated} />
                            ) : (
                                <div className="text-center py-8 border rounded-xl bg-muted/10">
                                    <ListChecks className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Garment segregation not done yet</p>
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
                            <div className="flex gap-4">
                                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{address?.address_type}</p>
                                        {address?.isPrimary && (
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {address?.format_address}
                                    </p>
                                    <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                                        <span>Pincode: <span className="font-semibold text-foreground">{address?.pincode}</span></span>
                                        <span>City: <span className="font-semibold text-foreground">{address?.city}</span></span>
                                        <span>State: <span className="font-semibold text-foreground">{address?.state}</span></span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT (1/3) ── */}
                <div className="space-y-5">

                    {/* Order Progress */}
                    <OrderTimeline
                        steps={[
                            { label: 'Order Placed', icon: <Package className="h-4 w-4" />, at: subOrder?.createdAt, reached: true },
                            { label: 'Pickup Assigned', icon: <Truck className="h-4 w-4" />, at: pickup?.assigned_at ?? pickup?.createdAt, reached: !!pickup || stageId >= 2 },
                            { label: 'Picked Up', icon: <BaggageClaim className="h-4 w-4" />, at: subOrder?.picked_up_at ?? pickup?.completed_at, reached: stageId >= 4 },
                            { label: 'Quality Check', icon: <ListChecks className="h-4 w-4" />, at: subOrder?.qc_completed_at, reached: !!subOrder?.quality_check },
                            { label: 'Processing Assigned', icon: <Settings className="h-4 w-4" />, at: process?.createdAt, reached: !!process || stageId >= 5 },
                            { label: 'Processing Completed', icon: <Sparkles className="h-4 w-4" />, at: process?.processing_completed_at, reached: !!process?.processing_completed_at || stageId >= 7 },
                            { label: 'Delivery Assigned', icon: <UserCheck className="h-4 w-4" />, at: delivery?.assigned_at ?? delivery?.createdAt, reached: !!delivery || stageId >= 8 },
                            { label: 'Out for Delivery', icon: <Truck className="h-4 w-4" />, at: delivery?.started_at, reached: stageId >= 9 },
                            { label: 'Delivered', icon: <Home className="h-4 w-4" />, at: delivery?.completed_at, reached: stageId >= 10 },
                        ]}
                    />

                    {/* Pickup */}
                    <StageCard
                        title="Pickup"
                        icon={<Truck className="h-4 w-4" />}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                        empty={!pickup}
                        emptyLabel="Not yet assigned"
                    >
                        <TimeRows
                            rows={[
                                {
                                    label: 'Copilot',
                                    text: <PersonLink name={pickup?.copilot_name} mobile={pickup?.copilot_mobile} onClick={() => router.push(`/dashboard/copilots/${pickup?.copilot_id}`)} />,
                                },
                                { label: 'Status', text: COPILOT_STATUS[pickup?.status] ?? '—' },
                                { label: 'Assigned At', value: pickup?.assigned_at ?? pickup?.createdAt },
                                ...(pickup?.assigned_by ? [{ label: 'Assigned By', text: pickup.assigned_by }] : []),
                                { label: 'Started At', value: pickup?.started_at },
                                {
                                    label: 'Picked Up At',
                                    value: subOrder?.picked_up_at ?? pickup?.completed_at,
                                    estimated: subOrder?.picked_up_at ? isEstimated(subOrder, 'picked_up_at') : isEstimated(pickup, 'completed_at'),
                                },
                            ]}
                        />
                        <SubList title="Attempts" items={attemptItems(pickup)} />
                        <SubList title="Earlier copilots" items={previousCopilotItems(pickup)} />
                    </StageCard>

                    {/* Quality Check */}
                    <StageCard
                        title="Quality Check"
                        icon={<ListChecks className="h-4 w-4" />}
                        iconBg="bg-amber-100"
                        iconColor="text-amber-600"
                        empty={!subOrder?.quality_check && !subOrder?.cancelled_at}
                        emptyLabel="Not yet checked"
                    >
                        <TimeRows
                            rows={[
                                { label: 'QC Done At', value: subOrder?.qc_completed_at },
                                ...(subOrder?.qc_completed_by ? [{ label: 'QC By', text: subOrder.qc_completed_by }] : []),
                                ...(subOrder?.ord_status === 'Cancelled'
                                    ? [
                                        { label: 'Cancelled At', value: subOrder?.cancelled_at, estimated: isEstimated(subOrder, 'cancelled_at') },
                                        ...(subOrder?.cancelled_by ? [{ label: 'Cancelled By', text: subOrder.cancelled_by }] : []),
                                    ]
                                    : []),
                            ]}
                        />
                    </StageCard>

                    {/* Processing */}
                    <StageCard
                        title="Processing"
                        icon={<Settings className="h-4 w-4" />}
                        iconBg="bg-purple-100"
                        iconColor="text-purple-600"
                        empty={!process}
                        emptyLabel="Not yet assigned"
                    >
                        <TimeRows
                            rows={[
                                {
                                    label: 'Vendor',
                                    text: <PersonLink name={process?.vendor_name} mobile={process?.vendor_mobile} onClick={() => router.push(`/dashboard/vendor/${process?.vendor_id}`)} />,
                                },
                                { label: 'Status', text: VENDOR_STATUS[process?.status] ?? '—' },
                                { label: 'Assigned At', value: process?.createdAt },
                                ...(process?.assigned_by ? [{ label: 'Assigned By', text: process.assigned_by }] : []),
                                { label: 'Accepted At', value: process?.accepted_at },
                                { label: 'Picked from Warehouse', value: process?.picked_up_at },
                                { label: 'Processing Started', value: process?.processing_started_at },
                                { label: 'Processing Completed', value: process?.processing_completed_at },
                                { label: 'Inward Verified', value: process?.inward_verified_at },
                                ...(process?.service_deadline ? [{ label: 'Deadline', value: process.service_deadline }] : []),
                                ...(subOrder?.ironing_started_at ? [{ label: 'Ironing Started', value: subOrder.ironing_started_at }] : []),
                                ...(subOrder?.ironing_completed_at ? [{ label: 'Ironing Completed', value: subOrder.ironing_completed_at }] : []),
                            ]}
                        />
                        <SubList
                            title="Rejected vendors"
                            items={(data?.processHistory ?? [])
                                .filter((p: any) => p._id !== process?._id && p.status === 0)
                                .map((p: any) => (
                                    <span key={p._id}>
                                        <span className="font-medium text-foreground">{p.vendor_name || p.vendor_id}</span>
                                        {' '}· assigned {formatToIST(p.createdAt)}
                                        {p.rejected_at ? ` → rejected ${formatToIST(p.rejected_at)}` : ''}
                                        {p.reject_reason ? ` (${p.reject_reason === 'auto_expired' ? 'not accepted in time' : p.reject_reason})` : ''}
                                    </span>
                                ))}
                        />
                    </StageCard>

                    {/* Delivery */}
                    <StageCard
                        title="Delivery"
                        icon={<UserCheck className="h-4 w-4" />}
                        iconBg="bg-green-100"
                        iconColor="text-green-600"
                        empty={!delivery}
                        emptyLabel="Not yet assigned"
                    >
                        <TimeRows
                            rows={[
                                {
                                    label: 'Copilot',
                                    text: <PersonLink name={delivery?.copilot_name} mobile={delivery?.copilot_mobile} onClick={() => router.push(`/dashboard/copilots/${delivery?.copilot_id}`)} />,
                                },
                                { label: 'Status', text: COPILOT_STATUS[delivery?.status] ?? '—' },
                                { label: 'Assigned At', value: delivery?.assigned_at ?? delivery?.createdAt },
                                ...(delivery?.assigned_by ? [{ label: 'Assigned By', text: delivery.assigned_by }] : []),
                                { label: 'Out for Delivery At', value: delivery?.started_at },
                                { label: 'Delivered At', value: delivery?.completed_at, estimated: isEstimated(delivery, 'completed_at') },
                            ]}
                        />
                        <SubList title="Attempts" items={attemptItems(delivery)} />
                        <SubList title="Earlier copilots" items={previousCopilotItems(delivery)} />
                    </StageCard>

                    {/* Pickup Assignment */}
                    {/* <AssignmentCard
                        title="Pickup Assignment"
                        icon={<Truck className="h-4 w-4" />}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                        assignment={data?.pickupAssignment}
                        emptyLabel="Not yet assigned"
                        fields={[
                            { label: 'Vendor', key: 'vendor' },
                            { label: 'Status', key: 'status' },
                            { label: 'Assigned At', key: 'createdAt' },
                            { label: 'Picked Up At', key: 'updatedAt' },
                        ]}
                    /> */}

                    {/* Process Assignment */}
                    {/* <AssignmentCard
                        title="Processing Assignment"
                        icon={<Settings className="h-4 w-4" />}
                        iconBg="bg-purple-100"
                        iconColor="text-purple-600"
                        assignment={data?.processAssignment}
                        emptyLabel="Not yet assigned"
                        fields={[
                            { label: 'Partner', key: 'partner_name' },
                            { label: 'Status', key: 'status' },
                            { label: 'Assigned At', key: 'createdAt' },
                            { label: 'Processed At', key: 'updatedAt' },
                        ]}
                    /> */}

                    {/* Delivery Assignment */}
                    {/* <AssignmentCard
                        title="Delivery Assignment"
                        icon={<UserCheck className="h-4 w-4" />}
                        iconBg="bg-green-100"
                        iconColor="text-green-600"
                        assignment={data?.deliveryAssignment}
                        emptyLabel="Not yet assigned"
                        fields={[
                            { label: 'Partner', key: 'partner_name' },
                            { label: 'Status', key: 'status' },
                            { label: 'Assigned At', key: 'createdAt' },
                            { label: 'Delivered At', key: 'updatedAt' },
                        ]}
                    /> */}

                    {/* Quick Actions */}
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {/* <Button className="w-full rounded-xl justify-start" size="sm">
                                <Truck className="mr-2 h-4 w-4" />
                                Assign Pickup Partner
                            </Button>
                            <Button variant="outline" className="w-full rounded-xl justify-start" size="sm">
                                <Settings className="mr-2 h-4 w-4" />
                                Assign Processing
                            </Button>
                            <Button variant="outline" className="w-full rounded-xl justify-start" size="sm">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign Delivery Partner
                            </Button> */}
                            <Button
                                variant="ghost"
                                className="w-full rounded-xl justify-start text-muted-foreground"
                                size="sm"
                                onClick={() => router.push(`/dashboard/bookings/${subOrder?.order_id}`)}
                            >
                                <Package className="mr-2 h-4 w-4" />
                                View Main Order
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
