'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { Loader2, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { NotificationCampaignApiService } from '@/lib/api/notification-campaign';
import {
    AudienceType,
    CampaignCustomer,
    CampaignFilterValue,
    FilterDefinition,
    NotificationCampaign,
} from '@/lib/types/notification-campaign';

const campaignSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    message: z.string().min(2, 'Message must be at least 2 characters'),
    action_url: z.string().optional(),
    send_type: z.enum(['immediate', 'scheduled']),
    scheduled_at: z.string().optional(),
}).refine((data) => data.send_type !== 'scheduled' || !!data.scheduled_at, {
    message: 'Please choose a date and time to schedule this campaign',
    path: ['scheduled_at'],
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface NotificationCampaignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    campaign?: NotificationCampaign | null;
}

export function NotificationCampaignForm({ open, onOpenChange, onSuccess, campaign }: NotificationCampaignFormProps) {
    const [loading, setLoading] = useState(false);
    const [audienceType, setAudienceType] = useState<AudienceType>('all');
    const [availableFilters, setAvailableFilters] = useState<FilterDefinition[]>([]);
    const [selectedFilters, setSelectedFilters] = useState<CampaignFilterValue[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<CampaignCustomer[]>([]);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<CampaignCustomer[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const { toast } = useToast();
    const isEdit = !!campaign;
    const debouncedQuery = useDebounce(customerQuery, 400);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
    } = useForm<CampaignFormData>({
        resolver: zodResolver(campaignSchema),
        defaultValues: { send_type: 'immediate' },
    });

    const sendType = watch('send_type');

    useEffect(() => {
        if (!open) return;
        NotificationCampaignApiService.getAvailableFilters()
            .then((res) => setAvailableFilters(res.data.filters))
            .catch(() => setAvailableFilters([]));
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (campaign) {
            reset({
                title: campaign.title,
                message: campaign.message,
                action_url: campaign.action_url || '',
                send_type: campaign.send_type,
                scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : '',
            });
            setAudienceType(campaign.audience_type);
            setSelectedFilters(campaign.filters || []);
        } else {
            reset({ send_type: 'immediate', title: '', message: '', action_url: '', scheduled_at: '' });
            setAudienceType('all');
            setSelectedFilters([]);
            setSelectedCustomers([]);
            setImageFile(null);
        }
        setAudienceCount(null);
    }, [open, campaign, reset]);

    useEffect(() => {
        if (!debouncedQuery.trim() || audienceType !== 'specific') {
            setCustomerResults([]);
            return;
        }
        NotificationCampaignApiService.searchCustomers(debouncedQuery)
            .then((res) => setCustomerResults(res.data.customers))
            .catch(() => setCustomerResults([]));
    }, [debouncedQuery, audienceType]);

    const addCustomer = (customer: CampaignCustomer) => {
        if (!selectedCustomers.some((c) => c._id === customer._id)) {
            setSelectedCustomers((prev) => [...prev, customer]);
        }
        setCustomerQuery('');
        setCustomerResults([]);
    };

    const removeCustomer = (id: string) => {
        setSelectedCustomers((prev) => prev.filter((c) => c._id !== id));
    };

    const filterOptions = availableFilters.map((f) => ({ value: f.key, label: f.label }));

    const toggleFilters = (keys: string[]) => {
        setSelectedFilters((prev) => {
            const kept = prev.filter((f) => keys.includes(f.key));
            const added = keys
                .filter((k) => !prev.some((f) => f.key === k))
                .map((k) => ({ key: k, value: availableFilters.find((f) => f.key === k)?.defaultValue ?? null }));
            return [...kept, ...added];
        });
    };

    const updateFilterValue = (key: string, value: number) => {
        setSelectedFilters((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
    };

    const handlePreview = async () => {
        try {
            setPreviewing(true);
            const res = await NotificationCampaignApiService.previewAudience(
                audienceType,
                selectedCustomers.map((c) => c._id),
                selectedFilters,
            );
            setAudienceCount(res.data.count);
        } catch (error) {
            console.error('Error previewing audience:', error);
            toast({ title: 'Error', description: 'Failed to preview audience', variant: 'destructive' });
        } finally {
            setPreviewing(false);
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const onSubmit = async (data: CampaignFormData) => {
        if (audienceType === 'specific' && selectedCustomers.length === 0) {
            toast({ title: 'Error', description: 'Please select at least one customer', variant: 'destructive' });
            return;
        }
        if (audienceType === 'filtered' && selectedFilters.length === 0) {
            toast({ title: 'Error', description: 'Please select at least one filter', variant: 'destructive' });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                title: data.title,
                message: data.message,
                action_url: data.action_url,
                audience_type: audienceType,
                customer_ids: selectedCustomers.map((c) => c._id),
                filters: selectedFilters,
                send_type: data.send_type,
                scheduled_at: data.send_type === 'scheduled' ? new Date(data.scheduled_at!).toISOString() : undefined,
                image: imageFile,
            };

            const response = isEdit
                ? await NotificationCampaignApiService.updateCampaign(campaign!._id, payload)
                : await NotificationCampaignApiService.createCampaign(payload);

            if (response.status) {
                toast({ title: 'Success', description: `Campaign ${isEdit ? 'updated' : 'created'} successfully` });
                handleClose();
                onSuccess();
            } else {
                toast({ title: 'Error', description: response.msg || 'Failed to save campaign', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error saving campaign:', error);
            toast({ title: 'Error', description: 'Failed to save campaign. Please try again.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {isEdit ? 'Edit Campaign' : 'Create Notification Campaign'}
                    </DialogTitle>
                    <DialogDescription>
                        Compose a push notification and choose who should receive it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" placeholder="e.g. Weekend Special Offer" {...register('title')} disabled={loading} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea id="message" placeholder="e.g. Get 20% off on all orders this weekend!" {...register('message')} disabled={loading} />
                        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="action_url">Deep Link / Action URL (optional)</Label>
                        <Input id="action_url" placeholder="e.g. spinovo://offers/summer25" {...register('action_url')} disabled={loading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image (optional)</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            disabled={loading}
                        />
                        {campaign?.image && !imageFile && (
                            <p className="text-xs text-muted-foreground">Current image will be kept unless you choose a new one.</p>
                        )}
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-2 rounded-md border p-3">
                        <Label>Target Audience *</Label>
                        <Select value={audienceType} onValueChange={(v) => setAudienceType(v as AudienceType)} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                <SelectItem value="specific">Specific Customers</SelectItem>
                                <SelectItem value="filtered">Customer Filters</SelectItem>
                            </SelectContent>
                        </Select>

                        {audienceType === 'specific' && (
                            <div className="space-y-2 pt-2">
                                <Input
                                    placeholder="Search customers by name or mobile..."
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    disabled={loading}
                                />
                                {customerResults.length > 0 && (
                                    <div className="rounded-md border bg-background shadow-sm">
                                        {customerResults.map((c) => (
                                            <button
                                                key={c._id}
                                                type="button"
                                                onClick={() => addCustomer(c)}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                                            >
                                                <span>{c.name || 'Unnamed'}</span>
                                                <span className="text-muted-foreground">{c.mobile}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {selectedCustomers.map((c) => (
                                        <Badge key={c._id} variant="secondary" className="gap-1">
                                            {c.name || c.mobile}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeCustomer(c._id)} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {audienceType === 'filtered' && (
                            <div className="space-y-2 pt-2">
                                <MultiSelect
                                    options={filterOptions}
                                    selected={selectedFilters.map((f) => f.key)}
                                    onChange={toggleFilters}
                                    placeholder="Select filters..."
                                />
                                {selectedFilters.map((f) => {
                                    const def = availableFilters.find((d) => d.key === f.key);
                                    if (def?.valueType !== 'number') return null;
                                    return (
                                        <div key={f.key} className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">{def.label} — within last</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="w-20"
                                                value={Number(f.value ?? def.defaultValue ?? 0)}
                                                onChange={(e) => updateFilterValue(f.key, Number(e.target.value))}
                                                disabled={loading}
                                            />
                                            <span className="text-muted-foreground">days</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewing || loading}>
                                {previewing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                Preview Audience Count
                            </Button>
                            {audienceCount !== null && (
                                <span className="text-sm text-muted-foreground">{audienceCount} matched customers</span>
                            )}
                        </div>
                    </div>

                    {/* Send Type */}
                    <div className="space-y-2">
                        <Label>Send *</Label>
                        <Controller
                            name="send_type"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select send option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Send Immediately</SelectItem>
                                        <SelectItem value="scheduled">Schedule for later</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {sendType === 'scheduled' && (
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_at">Schedule Date & Time *</Label>
                            <Input id="scheduled_at" type="datetime-local" {...register('scheduled_at')} disabled={loading} />
                            {errors.scheduled_at && <p className="text-sm text-destructive">{errors.scheduled_at.message}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    {isEdit ? 'Save Changes' : sendType === 'scheduled' ? 'Schedule Campaign' : 'Send Campaign'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
