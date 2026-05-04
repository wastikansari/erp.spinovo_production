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
import { AssignApiService, VendorApiService, Vendor, Booking } from '@/lib/api';

const assignSchema = z.object({
    vendor_id: z.string().min(1, 'Please select a vendor'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface ProcessAssignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    processId: string | null;
    onSuccess: () => void;
}

export function ProcessCompletedForm({ open, onOpenChange, processId, onSuccess }: ProcessAssignFormProps) {
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




    const onSubmit = async (data: AssignFormData) => {
        if (!processId) return;

        try {
            setLoading(true);
            console.log('Process Assigning orders:', { process_id: processId, vendor_id: data.vendor_id });

            const response = await AssignApiService.processAssignCompleted(processId);

            if (response.status) {
                toast({
                    title: 'Success',
                    description: 'order process complited',
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
                        Process Status Order
                    </DialogTitle>
                    <DialogDescription>
                        Process Status {processId} to a vendor.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="copilot_id">Select Vendor For Process Completed</Label>
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
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>

                                    <SelectItem key="1" value="1" >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Completed</span>
                                            <span className="text-muted-foreground">(Order process completed)</span>
                                        </div>
                                    </SelectItem>

                                </SelectContent>
                            </Select>
                        )}
                        {errors.vendor_id && (
                            <p className="text-sm text-destructive">{errors.vendor_id.message}</p>
                        )}
                    </div>

                    {/* {booking && (
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                            <h4 className="font-medium">Booking Details</h4>
                            <div className="text-sm space-y-1">
                                <p><span className="font-medium">Order ID:</span> {booking.order_display_no}</p>
                                <p><span className="font-medium">Service:</span> {booking.service_name}</p>
                                <p><span className="font-medium">Amount:</span> ₹{booking.order_amount}</p>
                                <p><span className="font-medium">Date:</span> {booking.booking_date}</p>
                                <p><span className="font-medium">Time:</span> {booking.booking_time}</p>
                            </div>
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
                                    Process Status updating...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />

                                    Process Completed
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}