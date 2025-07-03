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
import { AssignApiService, CopilotApiService, Copilot, Booking } from '@/lib/api';

const assignSchema = z.object({
  copilot_id: z.string().min(1, 'Please select a copilot'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess: () => void;
}

export function AssignBookingForm({ open, onOpenChange, booking, onSuccess }: AssignBookingFormProps) {
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
      fetchCopilots();
    }
  }, [open]);

  const fetchCopilots = async () => {
    try {
      setLoadingCopilots(true);
      const response = await CopilotApiService.getCopilots(1, 100); // Get all copilots
      
      if (response.status && response.data) {
        // Filter only active copilots
        const activeCopilots = response.data.copilotList.filter(copilot => copilot.status === 1);
        setCopilots(activeCopilots);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load copilots',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching copilots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load copilots',
        variant: 'destructive',
      });
    } finally {
      setLoadingCopilots(false);
    }
  };

  const onSubmit = async (data: AssignFormData) => {
    if (!booking) return;

    try {
      setLoading(true);
      console.log('Assigning booking:', { booking_id: booking._id, copilot_id: data.copilot_id });

      const response = await AssignApiService.assignBooking({
        booking_id: booking._id,
        copilot_id: data.copilot_id,
      });

      if (response.status) {
        toast({
          title: 'Success',
          description: 'Booking assigned successfully',
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
            Assign Booking
          </DialogTitle>
          <DialogDescription>
            Assign booking {booking?.order_display_no} to a copilot.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copilot_id">Select Copilot</Label>
            {loadingCopilots ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading copilots...</span>
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
                  {copilots.map((copilot) => (
                    <SelectItem key={copilot._id} value={copilot._id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{copilot.name}</span>
                        <span className="text-muted-foreground">({copilot.mobile})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.copilot_id && (
              <p className="text-sm text-destructive">{errors.copilot_id.message}</p>
            )}
          </div>

          {booking && (
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
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingCopilots}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Assign Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}