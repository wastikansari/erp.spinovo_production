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
import { Loader2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssignApiService, VendorApiService, Vendor } from '@/lib/api';

const assignSchema = z.object({
    vendor_id: z.string().min(1, 'Please select a vendor'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface ProcessAssignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string | null;
    subOrderId: string | null;
    onSuccess: () => void;
}

export function ProcessAssignForm({ open, onOpenChange, orderId, subOrderId, onSuccess }: ProcessAssignFormProps) {
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
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

    const selectedVendorId = watch('vendor_id');

    useEffect(() => {
        if (open) {
            fetchVendors();
        }
    }, [open]);

    const fetchVendors = async () => {
        try {
            setLoadingVendors(true);
            const response = await VendorApiService.getVendors(1, 100); // Get all vendor

            if (response.status && response.data) {
                // Filter only active vendor
                const activeVendors = response.data.vendorList.filter(vendor => vendor.accountIsActive === true);
                setVendors(activeVendors);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to load vendors',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            toast({
                title: 'Error',
                description: 'Failed to load vendors',
                variant: 'destructive',
            });
        } finally {
            setLoadingVendors(false);
        }
    };

    const onSubmit = async (data: AssignFormData) => {
        if (!orderId || !subOrderId) return;

        try {
            setLoading(true);

            const response = await AssignApiService.processAssign({
                order_id: orderId,
                sub_order_id: subOrderId,
                vendor_id: data.vendor_id,
            });

            if (response.status) {
                toast({
                    title: 'Success',
                    description: 'Process assigned successfully',
                });
                reset();
                onOpenChange(false);
                onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: response.msg || 'Failed to assign booking',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error assigning booking:', error);
            toast({
                title: 'Error',
                description: 'Failed to assign booking. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Assign Process
                    </DialogTitle>
                    <DialogDescription>
                        Assign this sub-order to a vendor for processing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vendor_id">Select Vendor</Label>
                        {loadingVendors ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Loading vendors...</span>
                            </div>
                        ) : (
                            <Select
                                value={selectedVendorId}
                                onValueChange={(value) => setValue('vendor_id', value)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((vendor) => (
                                        <SelectItem key={vendor._id} value={vendor._id}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{vendor.name}</span>
                                                <span className="text-muted-foreground">({vendor.mobile})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.vendor_id && (
                            <p className="text-sm text-destructive">{errors.vendor_id.message}</p>
                        )}
                    </div>

                    {/* {subOrderId && (
                        <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                            <p><span className="font-medium">Sub-Order ID:</span> <span className="font-mono text-xs">{subOrderId}</span></p>
                        </div>
                    )} */}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || loadingVendors}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Assign Process
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}