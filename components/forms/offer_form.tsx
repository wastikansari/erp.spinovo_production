'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Tag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OfferApiService } from '@/lib/api/offer';

// Service options 0-6
const SERVICE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const offerSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    short_description: z.string().min(5, 'Description must be at least 5 characters'),
    offer_code: z.string().min(2, 'Offer code must be at least 2 characters'),
    offer_type: z.number({ required_error: 'Offer type is required' }),
    discount_amount: z.number().min(0, 'Discount amount must be >= 0'),
    discount_percentage: z.number().min(0).max(100, 'Percentage must be between 0-100'),
    min_order_amount: z.number().min(0, 'Min order amount must be >= 0'),
    max_discount: z.number().min(0, 'Max discount must be >= 0'),
    usage_limit: z.number().min(1, 'Usage limit must be at least 1'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    status: z.boolean(),
    term_con1: z.string().optional(),
    term_con2: z.string().optional(),
    term_con3: z.string().optional(),
    term_con4: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function OfferForm({ open, onOpenChange, onSuccess }: OfferFormProps) {
    const [loading, setLoading] = useState(false);
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
        defaultValues: {
            offer_type: 0,
            discount_amount: 0,
            discount_percentage: 0,
            min_order_amount: 0,
            max_discount: 0,
            usage_limit: 1,
            status: true,
        },
    });

    const offerType = watch('offer_type');

    const toggleService = (service: number) => {
        setServiceError('');
        setSelectedServices((prev) =>
            prev.includes(service)
                ? prev.filter((s) => s !== service)
                : [...prev, service]
        );
    };

    const handleClose = () => {
        reset();
        setSelectedServices([]);
        setServiceError('');
        onOpenChange(false);
    };

    const onSubmit = async (data: OfferFormData) => {
        if (selectedServices.length === 0) {
            setServiceError('Please select at least one service');
            return;
        }

        try {
            setLoading(true);
            console.log('Creating offer:', data);

            const response = await OfferApiService.createOffer({
                'service_for_offer[]': selectedServices,
                ...data,
            });

            if (response.status) {
                toast({
                    title: 'Success',
                    description: 'Offer created successfully',
                });
                handleClose();
                onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: response.msg || 'Failed to create offer',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error creating offer:', error);
            toast({
                title: 'Error',
                description: 'Failed to create offer. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Create New Offer
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new offer. Fields marked * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Service For Offer */}
                    <div className="space-y-2">
                        <Label>Services * (select one or more)</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                            {SERVICE_OPTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleService(s)}
                                    disabled={loading}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors
                    ${selectedServices.includes(s)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-foreground border-border hover:bg-accent'
                                        }`}
                                >
                                    Service {s}
                                    {selectedServices.includes(s) && <X className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>
                        {selectedServices.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Selected: {selectedServices.sort((a, b) => a - b).map((s) => `Service ${s}`).join(', ')}
                            </p>
                        )}
                        {serviceError && (
                            <p className="text-sm text-destructive">{serviceError}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Summer Offer"
                            {...register('title')}
                            disabled={loading}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="short_description">Short Description *</Label>
                        <Input
                            id="short_description"
                            placeholder="e.g. Get 25% discount on your order"
                            {...register('short_description')}
                            disabled={loading}
                        />
                        {errors.short_description && (
                            <p className="text-sm text-destructive">{errors.short_description.message}</p>
                        )}
                    </div>

                    {/* Offer Code */}
                    <div className="space-y-2">
                        <Label htmlFor="offer_code">Offer Code *</Label>
                        <Input
                            id="offer_code"
                            placeholder="e.g. SUMMER25"
                            {...register('offer_code')}
                            disabled={loading}
                        />
                        {errors.offer_code && (
                            <p className="text-sm text-destructive">{errors.offer_code.message}</p>
                        )}
                    </div>

                    {/* Offer Type */}
                    <div className="space-y-2">
                        <Label>Offer Type *</Label>
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
                                        <SelectValue placeholder="Select offer type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Percentage</SelectItem>
                                        <SelectItem value="1">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.offer_type && (
                            <p className="text-sm text-destructive">{errors.offer_type.message}</p>
                        )}
                    </div>

                    {/* Conditional discount fields */}
                    <div className="grid grid-cols-2 gap-4">
                        {offerType === 0 ? (
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
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="discount_amount">Discount Amount (₹) *</Label>
                                <Input
                                    id="discount_amount"
                                    type="number"
                                    min={0}
                                    {...register('discount_amount', { valueAsNumber: true })}
                                    disabled={loading}
                                />
                                {errors.discount_amount && (
                                    <p className="text-sm text-destructive">{errors.discount_amount.message}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="max_discount">Max Discount (₹) *</Label>
                            <Input
                                id="max_discount"
                                type="number"
                                min={0}
                                {...register('max_discount', { valueAsNumber: true })}
                                disabled={loading}
                            />
                            {errors.max_discount && (
                                <p className="text-sm text-destructive">{errors.max_discount.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_order_amount">Min Order Amount (₹) *</Label>
                            <Input
                                id="min_order_amount"
                                type="number"
                                min={0}
                                {...register('min_order_amount', { valueAsNumber: true })}
                                disabled={loading}
                            />
                            {errors.min_order_amount && (
                                <p className="text-sm text-destructive">{errors.min_order_amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="usage_limit">Usage Limit *</Label>
                            <Input
                                id="usage_limit"
                                type="number"
                                min={1}
                                {...register('usage_limit', { valueAsNumber: true })}
                                disabled={loading}
                            />
                            {errors.usage_limit && (
                                <p className="text-sm text-destructive">{errors.usage_limit.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date * (DD/MM/YYYY)</Label>
                            <Input
                                id="start_date"
                                placeholder="04/05/2026"
                                {...register('start_date')}
                                disabled={loading}
                            />
                            {errors.start_date && (
                                <p className="text-sm text-destructive">{errors.start_date.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date * (DD/MM/YYYY)</Label>
                            <Input
                                id="end_date"
                                placeholder="04/06/2026"
                                {...register('end_date')}
                                disabled={loading}
                            />
                            {errors.end_date && (
                                <p className="text-sm text-destructive">{errors.end_date.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label>Status *</Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={String(field.value)}
                                    onValueChange={(v) => field.onChange(v === 'true')}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    {/* Terms (optional) */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Terms & Conditions (optional)</Label>
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Tag className="mr-2 h-4 w-4" />
                                    Create Offer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}