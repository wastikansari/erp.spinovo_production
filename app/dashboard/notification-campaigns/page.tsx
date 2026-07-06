'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    RefreshCw,
    AlertCircle,
    Send,
    Plus,
    MoreHorizontal,
    Eye,
    Pencil,
    Copy,
    Trash2,
    XCircle,
    RotateCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { NotificationCampaignApiService } from '@/lib/api/notification-campaign';
import { CampaignStatus, NotificationCampaign } from '@/lib/types/notification-campaign';
import { NotificationCampaignForm } from '@/components/forms/notification_campaign_form';

const STATUS_COLORS: Record<CampaignStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    sending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    sent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const AUDIENCE_LABELS: Record<string, string> = {
    all: 'All Customers',
    specific: 'Specific Customers',
    filtered: 'Filtered Segment',
};

export default function NotificationCampaignsPage() {
    const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<NotificationCampaign | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NotificationCampaign | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchCampaigns = useCallback(async (page: number, status: string) => {
        try {
            setLoading(true);
            setError('');
            const response = await NotificationCampaignApiService.getCampaigns(
                page,
                10,
                status === 'all' ? undefined : status,
            );
            if (response.status && response.data) {
                setCampaigns(response.data.campaigns || []);
                setTotalPages(response.data.total_pages || 1);
                setCurrentPage(response.data.page || 1);
                setTotal(response.data.total || 0);
            } else {
                setError(response.msg || 'Failed to fetch campaigns');
                setCampaigns([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error occurred');
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns(currentPage, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, statusFilter]);

    const handleAction = async (action: () => Promise<{ status: boolean; msg: string }>, successMsg: string) => {
        try {
            const res = await action();
            if (res.status) {
                toast({ title: 'Success', description: successMsg });
                fetchCampaigns(currentPage, statusFilter);
            } else {
                toast({ title: 'Error', description: res.msg, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await handleAction(
            () => NotificationCampaignApiService.deleteCampaign(deleteTarget._id),
            'Campaign deleted successfully',
        );
        setDeleteTarget(null);
    };

    const columns = [
        {
            key: 'title',
            header: 'Title',
            render: (c: NotificationCampaign) => (
                <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{c.title}</span>
                </div>
            ),
        },
        {
            key: 'message',
            header: 'Message',
            render: (c: NotificationCampaign) => (
                <span className="line-clamp-1 max-w-[220px] text-sm text-muted-foreground">{c.message}</span>
            ),
        },
        {
            key: 'audience_type',
            header: 'Target Audience',
            render: (c: NotificationCampaign) => <span className="text-sm">{AUDIENCE_LABELS[c.audience_type]}</span>,
            searchable: false,
        },
        {
            key: 'filters',
            header: 'Applied Filters',
            render: (c: NotificationCampaign) => (
                <div className="flex flex-wrap gap-1">
                    {c.filters?.length ? (
                        c.filters.map((f) => (
                            <Badge key={f.key} variant="outline" className="text-xs">
                                {f.key}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
            searchable: false,
        },
        {
            key: 'scheduled_at',
            header: 'Schedule Time',
            render: (c: NotificationCampaign) => (
                <span className="text-sm">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</span>
            ),
            searchable: false,
        },
        {
            key: 'sent_at',
            header: 'Sent Time',
            render: (c: NotificationCampaign) => (
                <span className="text-sm">{c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}</span>
            ),
            searchable: false,
        },
        {
            key: 'status',
            header: 'Delivery Status',
            render: (c: NotificationCampaign) => <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>,
            searchable: false,
        },
        {
            key: 'created_by',
            header: 'Created By',
            render: (c: NotificationCampaign) => <span className="text-sm">{c.created_by?.name || '—'}</span>,
            searchable: false,
        },
        {
            key: 'createdAt',
            header: 'Created Date',
            render: (c: NotificationCampaign) => (
                <span className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</span>
            ),
            searchable: false,
        },
    ];

    const renderActions = (c: NotificationCampaign) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/notification-campaigns/${c._id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                {['draft', 'scheduled'].includes(c.status) && (
                    <DropdownMenuItem onClick={() => setEditingCampaign(c)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onClick={() =>
                        handleAction(() => NotificationCampaignApiService.duplicateCampaign(c._id), 'Campaign duplicated')
                    }
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                </DropdownMenuItem>
                {c.status === 'scheduled' && (
                    <DropdownMenuItem
                        onClick={() =>
                            handleAction(() => NotificationCampaignApiService.cancelScheduled(c._id), 'Campaign cancelled')
                        }
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Schedule
                    </DropdownMenuItem>
                )}
                {c.status === 'failed' && (
                    <DropdownMenuItem
                        onClick={() =>
                            handleAction(() => NotificationCampaignApiService.retryFailed(c._id), 'Retry started')
                        }
                    >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Retry Failed
                    </DropdownMenuItem>
                )}
                {c.status !== 'sending' && (
                    <DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Notification Campaigns</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => fetchCampaigns(currentPage, statusFilter)} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowForm(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Campaign Management
                        </CardTitle>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="sending">Sending</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">Total Campaigns: {total}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DataTable
                        data={campaigns}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Search campaigns..."
                        emptyMessage={error ? 'Failed to load campaigns.' : 'No campaigns found.'}
                        actions={renderActions}
                    />

                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} />
                </CardContent>
            </Card>

            <NotificationCampaignForm
                open={showForm || !!editingCampaign}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowForm(false);
                        setEditingCampaign(null);
                    }
                }}
                campaign={editingCampaign}
                onSuccess={() => fetchCampaigns(currentPage, statusFilter)}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
