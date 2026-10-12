'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Tag,
    Calendar,
    Percent,
    Hash,
    ShoppingCart,
    Users,
    Loader2,
    RefreshCw,
    AlertCircle,
    Info,
    Settings,
    Pencil,
    Power,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { OfferApiService } from '@/lib/api/offer';
import { Offer, OfferService, OfferUsageData } from '@/lib/types/offer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { OfferForm } from '@/components/forms/offer_form';

export default function OfferDetailsPage() {
    const params = useParams();
    const offerId = params.id as string;
    const { toast } = useToast();

    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [services, setServices] = useState<OfferService[]>([]);
    const [usage, setUsage] = useState<OfferUsageData | null>(null);
    const [editing, setEditing] = useState(false);

    const fetchOfferDetails = async () => {
        try {
            setLoading(true);
            setError('');

            if (!offerId) {
                setError('Offer ID is missing');
                return;
            }

            const response = await OfferApiService.getOfferDetails(offerId);

            if (response.status && response.data) {
                setOffer(response.data.offer);
                OfferApiService.getServices()
                    .then((r) => r.status && r.data && setServices(r.data.services))
                    .catch(() => undefined);
                OfferApiService.getOfferUsage(offerId)
                    .then((r) => r.status && r.data && setUsage(r.data))
                    .catch(() => undefined);
            } else {
                const errorMsg = response.msg || 'Failed to fetch offer details';
                setError(errorMsg);
                toast({
                    title: 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: 'Failed to load offer details. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (offerId && offerId !== 'undefined') {
            fetchOfferDetails();
        } else {
            setError('Invalid offer ID');
            setLoading(false);
        }
    }, [offerId]);

    const getStatusColor = (status: boolean) => {
        return status
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    };

    const toggleStatus = async () => {
        if (!offer) return;
        try {
            const response = await OfferApiService.setOfferStatus(offer._id, !offer.status);
            if (!response.status) throw new Error(response.msg || 'Failed to update status');
            toast({ title: offer.status ? 'Offer deactivated' : 'Offer activated' });
            fetchOfferDetails();
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    const LIVE_LABEL: Record<string, string> = {
        active: 'Active',
        scheduled: 'Scheduled (not started)',
        expired: 'Expired',
        inactive: 'Inactive',
    };

    const getOfferTypeText = (type: number) =>
        type === 0 ? 'Percentage' : 'Fixed Amount';

    const getOfferTypeColor = (type: number) =>
        type === 0
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/offers">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Offers
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Offer Details</h1>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading offer details...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/offers">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Offers
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Offer Details</h1>
                </div>
                <Card>
                    <CardContent className="py-10">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || 'Offer not found'}
                                <div className="mt-2">
                                    <Button onClick={fetchOfferDetails} variant="outline" size="sm">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const termConditions = [
        offer.term_con1,
        offer.term_con2,
        offer.term_con3,
        offer.term_con4,
    ].filter(Boolean);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/offers">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Offers
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Offer Details</h1>
                <Button onClick={fetchOfferDetails} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button onClick={toggleStatus} variant="outline" size="sm">
                    <Power className="mr-2 h-4 w-4" />
                    {offer.status ? 'Deactivate' : 'Activate'}
                </Button>
            </div>

            <OfferForm
                open={editing}
                offer={offer}
                onOpenChange={setEditing}
                onSuccess={fetchOfferDetails}
            />

            {/* Basic Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Offer Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Title</p>
                                    <p className="font-medium">{offer.title}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Description</p>
                                    <p className="font-medium">{offer.short_description}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Offer Code</p>
                                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                        {offer.offer_code}
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Offer Type</p>
                                <Badge className={getOfferTypeColor(offer.offer_type)}>
                                    {getOfferTypeText(offer.offer_type)}
                                </Badge>
                            </div>
                            <div className="flex items-start gap-2">
                                <Percent className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Discount</p>
                                    <p className="font-medium">
                                        {offer.offer_type === 0
                                            ? `${offer.discount_percentage}%`
                                            : `₹${offer.discount_amount}`}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge className={getStatusColor(offer.live_state ? offer.live_state === 'active' : offer.status)}>
                                    {LIVE_LABEL[offer.live_state || (offer.status ? 'active' : 'inactive')]}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Start Date</p>
                                    <p className="font-medium">{offer.start_date}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">End Date</p>
                                    <p className="font-medium">{offer.end_date}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Services Applicable</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {offer.service_for_offer.map((id) => {
                                        const svc = services.find((x) => x.service_id === id);
                                        const off = svc && !svc.coupon_applicable;
                                        return (
                                            <Badge
                                                key={id}
                                                variant="outline"
                                                className={off ? 'line-through text-muted-foreground' : ''}
                                                title={off ? 'Coupons are switched off for this service' : undefined}
                                            >
                                                {svc?.service || `Service ${id}`}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Discount Limits Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Order & Discount Limits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Minimum Order Amount</p>
                            <p className="font-medium text-lg">₹{offer.min_order_amount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Maximum Discount</p>
                            <p className="font-medium text-lg">₹{offer.max_discount}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Uses per customer</p>
                                <p className="font-medium text-lg">{offer.usage_limit} orders</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Terms & Conditions Card */}
            {termConditions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Terms & Conditions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2">
                            {termConditions.map((term, idx) => (
                                <li key={idx} className="text-sm">
                                    {term}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Usage */}
            {usage && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Customer usage ({usage.customers.length} customers)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {usage.customers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Not used yet.</p>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>Used</TableHead>
                                            <TableHead>Remaining</TableHead>
                                            <TableHead>Total discount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usage.customers.map((c) => (
                                            <TableRow key={c.customer_id}>
                                                <TableCell>{c.customer_name || '—'}</TableCell>
                                                <TableCell>{c.customer_mobile || '—'}</TableCell>
                                                <TableCell>
                                                    {c.uses} / {usage.usage_limit}
                                                </TableCell>
                                                <TableCell>
                                                    {c.remaining === 0 ? (
                                                        <Badge variant="outline">Limit reached</Badge>
                                                    ) : (
                                                        c.remaining
                                                    )}
                                                </TableCell>
                                                <TableCell>₹{c.total_discount}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">
                            Cancelled orders don&apos;t count towards the limit.
                        </p>
                    </CardContent>
                </Card>
            )}

            {usage && usage.orders.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Orders with this coupon ({usage.orders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Check</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usage.orders.map((o) => (
                                        <TableRow key={o._id}>
                                            <TableCell className="font-mono text-xs">{o.order_display_no}</TableCell>
                                            <TableCell>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell>{o.customer_name || o.customer_mobile || '—'}</TableCell>
                                            <TableCell>₹{o.offer_amount}</TableCell>
                                            <TableCell>{o.ord_status}</TableCell>
                                            <TableCell>
                                                {o.offer_check === 'mismatch' ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"
                                                        title={o.offer_check_note}
                                                    >
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        {o.offer_check_note || 'Mismatch'}
                                                    </span>
                                                ) : o.offer_check === 'ok' ? (
                                                    <span className="text-xs text-green-700 dark:text-green-400">OK</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            &quot;Check&quot; is the server&apos;s re-check when the order was saved. A warning means the
                            app gave a discount the coupon rules don&apos;t allow (e.g. an old app version applying
                            it on a quick service). Orders before this update show —.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* System Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Offer ID</p>
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all">
                                    {offer._id}
                                </code>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created At</p>
                                <p className="font-medium">{new Date(offer.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Last Updated</p>
                                <p className="font-medium">{new Date(offer.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                    <h4 className="font-semibold mb-2">Debug Info:</h4>
                    <p>Offer ID: {offerId}</p>
                    <p>Loading: {loading.toString()}</p>
                    <p>Error: {error || 'None'}</p>
                    <p>Offer Data: {offer ? 'Loaded' : 'Not loaded'}</p>
                </div>
            )}
        </div>
    );
}