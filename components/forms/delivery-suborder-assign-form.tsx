'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Loader2, UserCheck, Shirt, Calendar, Clock, MapPin, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssignApiService, CopilotApiService, Copilot } from '@/lib/api';
import { DeliveryPendingSubOrder, CancelPendingSubOrder } from '@/lib/types/delivery-assign';

const assignSchema = z.object({
    copilot_id: z.string().min(1, 'Please select a copilot'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface DeliverySubOrderAssignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subOrder: DeliveryPendingSubOrder | CancelPendingSubOrder | null;
    onSuccess: () => void;
}

export function DeliverySubOrderAssignForm({ open, onOpenChange, subOrder, onSuccess }: DeliverySubOrderAssignFormProps) {
    const [loading, setLoading] = useState(false);
    const [copilots, setCopilots] = useState<Copilot[]>([]);
    const [loadingCopilots, setLoadingCopilots] = useState(false);
    const { toast } = useToast();

    const {
        setValue,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema),
    });

    const selectedCopilotId = watch('copilot_id');

    useEffect(() => {
        if (open) {
            reset();
            fetchCopilots();
        }
    }, [open]);

    const fetchCopilots = async () => {
        try {
            setLoadingCopilots(true);
            const response = await CopilotApiService.getCopilots(1, 100);
            if (response.status && response.data) {
                setCopilots(response.data.copilotList.filter(c => c.status === 1));
            } else {
                toast({ title: 'Error', description: 'Failed to load copilots', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to load copilots', variant: 'destructive' });
        } finally {
            setLoadingCopilots(false);
        }
    };

    const onSubmit = async (data: AssignFormData) => {
        if (!subOrder) return;
        try {
            setLoading(true);
            const response = await AssignApiService.deliveryAssign({
                order_id: subOrder.order_id,
                sub_order_id: subOrder._id,
                copilot_id: data.copilot_id,
            });
            if (response.status) {
                toast({ title: 'Success', description: 'Delivery assigned successfully' });
                reset();
                onOpenChange(false);
                onSuccess();
            } else {
                toast({ title: 'Error', description: response.msg || 'Failed to assign delivery', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to assign delivery. Please try again.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Assign Delivery
                    </DialogTitle>
                    <DialogDescription>
                        Assign a copilot to deliver this sub-order.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Sub-order summary */}
                    {subOrder && (
                        <div className="bg-muted/50 rounded-xl border p-3.5 space-y-2.5 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{subOrder.sub_order_no}</span>
                                <span className="text-xs text-muted-foreground font-mono">{subOrder.order_no}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Shirt className="h-3 w-3" />
                                    {subOrder.service_name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Shirt className="h-3 w-3" />
                                    {subOrder.garment_qty} garment{subOrder.garment_qty !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    {subOrder.garment_amount?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {subOrder.expected_delivery_date}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {subOrder.expected_delivery_time}
                                </span>
                            </div>
                            {subOrder.address_details?.format_address && (
                                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                    <span>{subOrder.address_details.format_address}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Copilot selector */}
                    <div className="space-y-2">
                        <Label>Select Copilot</Label>
                        {loadingCopilots ? (
                            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading copilots…
                            </div>
                        ) : (
                            <Select
                                value={selectedCopilotId}
                                onValueChange={(value) => setValue('copilot_id', value)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a copilot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {copilots.length === 0 ? (
                                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">No active copilots found</div>
                                    ) : (
                                        copilots.map((copilot) => (
                                            <SelectItem key={copilot._id} value={copilot._id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{copilot.name}</span>
                                                    <span className="text-muted-foreground text-xs">({copilot.mobile})</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.copilot_id && (
                            <p className="text-sm text-destructive">{errors.copilot_id.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || loadingCopilots}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning…
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Assign Delivery
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
