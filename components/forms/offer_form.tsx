'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Check, Loader2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OfferApiService } from '@/lib/api/offer';
import { Offer, OfferPayload, OfferService } from '@/lib/types/offer';

export const DEFAULT_USAGE_LIMIT = 10;

// Offers are stored as DD/MM/YYYY; <input type="date"> works in YYYY-MM-DD.
export function toInputDate(ddmmyyyy: string): string {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy || '');
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
function fromInputDate(yyyymmdd: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

const offerSchema = z
    .object({
        title: z.string().trim().min(2, 'Title must be at least 2 characters').max(60),
        short_description: z.string().trim().min(5, 'Description must be at least 5 characters').max(200),
        offer_code: z
            .string()
            .trim()
            .regex(/^[A-Za-z0-9_-]{2,20}$/, 'Code: 2–20 letters/numbers, no spaces'),
        offer_type: z.number(),
        discount_amount: z.number({ invalid_type_error: 'Enter a number' }).int('Whole number only').min(0),
        discount_percentage: z.number({ invalid_type_error: 'Enter a number' }).int('Whole number only').min(0).max(100, 'Max 100%'),
        min_order_amount: z.number({ invalid_type_error: 'Enter a number' }).int('Whole number only').min(0),
        max_discount: z.number({ invalid_type_error: 'Enter a number' }).int('Whole number only').min(0),
        usage_limit: z
            .number({ invalid_type_error: 'Enter a number' })
            .int('Whole number only')
            .min(1, 'At least 1')
            .max(1000),
        start_date: z.string().min(1, 'Start date is required'),
        end_date: z.string().min(1, 'End date is required'),
        status: z.boolean(),
        term_con1: z.string().max(200).optional(),
        term_con2: z.string().max(200).optional(),
        term_con3: z.string().max(200).optional(),
        term_con4: z.string().max(200).optional(),
    })
    .refine((d) => d.end_date >= d.start_date, {
        message: 'End date must be on or after the start date',
        path: ['end_date'],
    })
    .refine((d) => (d.offer_type === 1 ? d.discount_amount > 0 : d.discount_percentage > 0), {
        message: 'Enter the discount',
        path: ['discount_amount'],
    });

type OfferFormData = z.infer<typeof offerSchema>;

const EMPTY_VALUES: OfferFormData = {
    title: '',
    short_description: '',
    offer_code: '',
    offer_type: 0,
    discount_amount: 0,
    discount_percentage: 0,
    min_order_amount: 0,
    max_discount: 0,
    usage_limit: DEFAULT_USAGE_LIMIT,
    start_date: '',
    end_date: '',
    status: true,
    term_con1: '',
    term_con2: '',
    term_con3: '',
    term_con4: '',
};

function valuesFromOffer(o: Offer): OfferFormData {
    return {
        title: o.title || '',
        short_description: o.short_description || '',
        offer_code: o.offer_code || '',
        offer_type: o.offer_type ?? 0,
        discount_amount: o.discount_amount ?? 0,
        discount_percentage: o.discount_percentage ?? 0,
        min_order_amount: o.min_order_amount ?? 0,
        max_discount: o.max_discount ?? 0,
        usage_limit: o.usage_limit || DEFAULT_USAGE_LIMIT,
        start_date: toInputDate(o.start_date),
        end_date: toInputDate(o.end_date),
        status: o.status !== false,
        term_con1: o.term_con1 || '',
        term_con2: o.term_con2 || '',
        term_con3: o.term_con3 || '',
        term_con4: o.term_con4 || '',
    };
}

interface OfferFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    // Present → edit this offer; absent → create a new one.
    offer?: Offer | null;
}

export function OfferForm({ open, onOpenChange, onSuccess, offer }: OfferFormProps) {
    const isEdit = Boolean(offer);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<OfferService[]>([]);
    const [servicesError, setServicesError] = useState('');
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [serviceError, setServiceError] = useState<string>('');
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
    } = useForm<OfferFormData>({
        resolver: zodResolver(offerSchema),
        defaultValues: EMPTY_VALUES,
    });

    const offerType = watch('offer_type');

    useEffect(() => {
        if (!open) return;
        reset(offer ? valuesFromOffer(offer) : EMPTY_VALUES);
        setSelectedServices(offer ? [...offer.service_for_offer] : []);
        setServiceError('');
        OfferApiService.getServices()
            .then((res) => {
                if (res.status && res.data) {
                    const list = res.data.services.filter((s) => s.is_active);
                    setServices(list);
                    setServicesError('');
                    // New offer: pre-select every coupon-applicable service.
                    if (!offer)
                        setSelectedServices(list.filter((s) => s.coupon_applicable).map((s) => s.service_id));
                } else {
                    setServicesError(res.msg || 'Could not load services');
                }
            })
            .catch(() => setServicesError('Could not load services'));
    }, [open, offer, reset]);

    const toggleService = (serviceId: number) => {
        setServiceError('');
        setSelectedServices((prev) =>
            prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
        );
    };

    const handleClose = () => {
        if (loading) return;
        onOpenChange(false);
    };

    const onSubmit = async (data: OfferFormData) => {
        const usable = selectedServices.filter(
            (id) => services.find((s) => s.service_id === id)?.coupon_applicable
        );
        if (usable.length === 0) {
            setServiceError('Select at least one service where coupons apply');
            return;
        }

        const payload: OfferPayload = {
            ...data,
            offer_code: data.offer_code.trim().toUpperCase(),
            title: data.title.trim(),
            short_description: data.short_description.trim(),
            // Only the field for the chosen type carries a value.
            discount_amount: data.offer_type === 1 ? data.discount_amount : 0,
            discount_percentage: data.offer_type === 0 ? data.discount_percentage : 0,
            max_discount: data.offer_type === 1 ? data.discount_amount : data.max_discount,
            start_date: fromInputDate(data.start_date),
            end_date: fromInputDate(data.end_date),
            service_for_offer: usable.sort((a, b) => a - b),
            term_con1: data.term_con1?.trim() || '',
            term_con2: data.term_con2?.trim() || '',
            term_con3: data.term_con3?.trim() || '',
            term_con4: data.term_con4?.trim() || '',
        };

        try {
            setLoading(true);
            const response = offer
                ? await OfferApiService.updateOffer(offer._id, payload)
                : await OfferApiService.createOffer(payload);

            if (response.status) {
                toast({
                    title: 'Success',
                    description: offer ? 'Offer updated' : 'Offer created',
                });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: response.msg || 'Failed to save offer',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save offer',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        {isEdit ? `Edit Offer — ${offer?.offer_code}` : 'Create New Offer'}
                    </DialogTitle>
                    <DialogDescription>Fields marked * are required.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Services */}
                    <div className="space-y-2">
                        <Label>Applicable services *</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                            {services.map((s) => {
                                const selected = selectedServices.includes(s.service_id);
                                const blocked = !s.coupon_applicable;
                                return (
                                    <button
                                        key={s.service_id}
                                        type="button"
                                        onClick={() => !blocked && toggleService(s.service_id)}
                                        disabled={loading || blocked}
                                        title={
                                            blocked
                                                ? 'Coupons are switched off for this service (ERP → Services)'
                                                : undefined
                                        }
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors
                                            ${blocked
                                                ? 'bg-muted text-muted-foreground border-dashed cursor-not-allowed line-through'
                                                : selected
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background text-foreground border-border hover:bg-accent'
                                            }`}
                                    >
                                        {selected && !blocked && <Check className="h-3 w-3" />}
                                        {s.service}
                                    </button>
                                );
                            })}
                            {!services.length && !servicesError && (
                                <span className="text-sm text-muted-foreground">Loading services…</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Crossed-out services have coupons switched off in Services and are never
                            discounted. In a mixed cart the discount is calculated only on the selected
                            services.
                        </p>
                        {servicesError && <p className="text-sm text-destructive">{servicesError}</p>}
                        {serviceError && <p className="text-sm text-destructive">{serviceError}</p>}
                    </div>

                    {/* Title / description / code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" placeholder="e.g. Flat ₹50 OFF" {...register('title')} disabled={loading} />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="offer_code">Coupon code *</Label>
                            <Input
                                id="offer_code"
                                placeholder="e.g. SAVE50"
                                className="uppercase font-mono"
                                {...register('offer_code')}
                                disabled={loading}
                            />
                            {errors.offer_code && (
                                <p className="text-sm text-destructive">{errors.offer_code.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="short_description">Short description *</Label>
                        <Input
                            id="short_description"
                            placeholder="e.g. Get ₹50 off on orders above ₹200"
                            {...register('short_description')}
                            disabled={loading}
                        />
                        {errors.short_description && (
                            <p className="text-sm text-destructive">{errors.short_description.message}</p>
                        )}
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Discount type *</Label>
                            <Controller
                                name="offer_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={String(field.value)}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                        disabled={loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Percentage</SelectItem>
                                            <SelectItem value="1">Flat amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        {offerType === 0 ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="discount_percentage">Discount % *</Label>
                                    <Input
                                        id="discount_percentage"
                                        type="number"
                                        min={0}
                                        max={100}
                                        {...register('discount_percentage', { valueAsNumber: true })}
                                        disabled={loading}
                                    />
                                    {errors.discount_percentage && (
                                        <p className="text-sm text-destructive">{errors.discount_percentage.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_discount">Max discount (₹)</Label>
                                    <Input
                                        id="max_discount"
                                        type="number"
                                        min={0}
                                        {...register('max_discount', { valueAsNumber: true })}
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-muted-foreground">0 = no cap</p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="discount_amount">Discount (₹) *</Label>
                                <Input
                                    id="discount_amount"
                                    type="number"
                                    min={0}
                                    {...register('discount_amount', { valueAsNumber: true })}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>
                    {errors.discount_amount && (
                        <p className="text-sm text-destructive">{errors.discount_amount.message}</p>
                    )}

                    {/* Limits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_order_amount">Min order amount (₹)</Label>
                            <Input
                                id="min_order_amount"
                                type="number"
                                min={0}
                                {...register('min_order_amount', { valueAsNumber: true })}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Counted on the applicable services only.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usage_limit">Uses per customer *</Label>
                            <Input
                                id="usage_limit"
                                type="number"
                                min={1}
                                {...register('usage_limit', { valueAsNumber: true })}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Each customer can use this coupon on this many orders. After that it is
                                hidden for them in the app.
                            </p>
                            {errors.usage_limit && (
                                <p className="text-sm text-destructive">{errors.usage_limit.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start date *</Label>
                            <Input id="start_date" type="date" {...register('start_date')} disabled={loading} />
                            {errors.start_date && (
                                <p className="text-sm text-destructive">{errors.start_date.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End date * (last valid day)</Label>
                            <Input id="end_date" type="date" {...register('end_date')} disabled={loading} />
                            {errors.end_date && (
                                <p className="text-sm text-destructive">{errors.end_date.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">Active</p>
                                    <p className="text-xs text-muted-foreground">
                                        Off = hidden from the app and can&apos;t be applied.
                                    </p>
                                </div>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                            </div>
                        )}
                    />

                    {/* Terms */}
                    <div className="space-y-2">
                        <Label>Terms & conditions (shown in the app)</Label>
                        <Input placeholder="Term 1" {...register('term_con1')} disabled={loading} />
                        <Input placeholder="Term 2" {...register('term_con2')} disabled={loading} />
                        <Input placeholder="Term 3" {...register('term_con3')} disabled={loading} />
                        <Input placeholder="Term 4" {...register('term_con4')} disabled={loading} />
                    </div>

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
                                    <Tag className="mr-2 h-4 w-4" />
                                    {isEdit ? 'Save Changes' : 'Create Offer'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
