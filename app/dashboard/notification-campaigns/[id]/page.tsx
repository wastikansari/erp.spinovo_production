'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Send,
    Calendar,
    Users,
    Loader2,
    RefreshCw,
    AlertCircle,
    Info,
    Settings,
    RotateCw,
} from 'lucide-react';
import Link from 'next/link';
import { NotificationCampaignApiService } from '@/lib/api/notification-campaign';
import { CampaignStatus, DeliveryStatusData, NotificationCampaign } from '@/lib/types/notification-campaign';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_COLORS: Record<CampaignStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    sending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    sent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function CampaignDetailsPage() {
    const params = useParams();
    const campaignId = params.id as string;
    const { toast } = useToast();

    const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);
    const [delivery, setDelivery] = useState<DeliveryStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const [campaignRes, deliveryRes] = await Promise.all([
                NotificationCampaignApiService.getCampaign(campaignId),
                NotificationCampaignApiService.getDeliveryStatus(campaignId),
            ]);
            if (campaignRes.status && campaignRes.data) {
                setCampaign(campaignRes.data.campaign);
            } else {
                setError(campaignRes.msg || 'Failed to fetch campaign details');
            }
            if (deliveryRes.status && deliveryRes.data) {
                setDelivery(deliveryRes.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (campaignId) fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const handleRetry = async () => {
        try {
            const res = await NotificationCampaignApiService.retryFailed(campaignId);
            if (res.status) {
                toast({ title: 'Success', description: 'Retry started for failed recipients' });
                fetchDetails();
            } else {
                toast({ title: 'Error', description: res.msg, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to retry campaign', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/notification-campaigns">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Campaigns
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Details</h1>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-10">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                        <span>Loading campaign details...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/notification-campaigns">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Campaigns
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Details</h1>
                </div>
                <Card>
                    <CardContent className="py-10">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || 'Campaign not found'}
                                <div className="mt-2">
                                    <Button onClick={fetchDetails} variant="outline" size="sm">
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/notification-campaigns">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Campaigns
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Campaign Details</h1>
                <Button onClick={fetchDetails} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
                {campaign.status === 'failed' && (
                    <Button onClick={handleRetry} variant="outline" size="sm">
                        <RotateCw className="mr-2 h-4 w-4" />
                        Retry Failed
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Campaign Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Title</p>
                                <p className="font-medium">{campaign.title}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Message</p>
                                    <p className="font-medium">{campaign.message}</p>
                                </div>
                            </div>
                            {campaign.image && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Image</p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={campaign.image} alt={campaign.title} className="mt-1 h-24 rounded-md border object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge className={STATUS_COLORS[campaign.status]}>{campaign.status}</Badge>
                            </div>
                            <div className="flex items-start gap-2">
                                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Target Audience</p>
                                    <p className="font-medium capitalize">{campaign.audience_type}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Applied Filters</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {campaign.filters?.length ? (
                                        campaign.filters.map((f) => (
                                            <Badge key={f.key} variant="outline">
                                                {f.key}
                                                {f.value !== null && f.value !== undefined ? `: ${f.value}` : ''}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Schedule Time</p>
                                    <p className="font-medium">
                                        {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Sent Time</p>
                                    <p className="font-medium">{campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : '—'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created By</p>
                                <p className="font-medium">{campaign.created_by?.name || '—'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Delivery Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-md border p-4">
                            <p className="text-sm text-muted-foreground">Total Recipients</p>
                            <p className="text-2xl font-semibold">{delivery?.total_recipients ?? campaign.total_recipients}</p>
                        </div>
                        <div className="rounded-md border p-4">
                            <p className="text-sm text-muted-foreground">Sent</p>
                            <p className="text-2xl font-semibold text-green-600">
                                {delivery?.sent_count ?? campaign.sent_count}
                            </p>
                        </div>
                        <div className="rounded-md border p-4">
                            <p className="text-sm text-muted-foreground">Failed</p>
                            <p className="text-2xl font-semibold text-red-600">{delivery?.failed_count ?? campaign.failed_count}</p>
                        </div>
                        <div className="rounded-md border p-4">
                            <p className="text-sm text-muted-foreground">Queued</p>
                            <p className="text-2xl font-semibold">{delivery?.status_counts?.queued ?? 0}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Campaign ID</p>
                            <code className="break-all rounded bg-muted px-2 py-1 font-mono text-sm">{campaign._id}</code>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium">{new Date(campaign.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
