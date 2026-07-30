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
import { Loader2, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CopilotApiService, Copilot } from '@/lib/api';
import { ApiResponse } from '@/lib/types';

const reassignSchema = z.object({
  new_copilot_id: z.string().min(1, 'Please select a copilot'),
});

type ReassignFormData = z.infer<typeof reassignSchema>;

interface ReassignCopilotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  currentCopilotId: string | null;
  currentCopilotName?: string;
  onReassign: (newCopilotId: string) => Promise<ApiResponse<unknown>>;
  onSuccess: () => void;
}

export function ReassignCopilotForm({
  open,
  onOpenChange,
  entityLabel,
  currentCopilotId,
  currentCopilotName,
  onReassign,
  onSuccess,
}: ReassignCopilotFormProps) {
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
  } = useForm<ReassignFormData>({
    resolver: zodResolver(reassignSchema),
  });

  const selectedCopilotId = watch('new_copilot_id');

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
        const activeCopilots = response.data.copilotList.filter(
          (copilot) => copilot.status === 1 && copilot._id !== currentCopilotId,
        );
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

  const onSubmit = async (data: ReassignFormData) => {
    try {
      setLoading(true);
      const response = await onReassign(data.new_copilot_id);

      if (response.status) {
        toast({
          title: 'Success',
          description: response.msg || 'Reassigned successfully',
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: response.msg || 'Failed to reassign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reassigning:', error);
      toast({
        title: 'Error',
        description: 'Failed to reassign. Please try again.',
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
            <Repeat className="h-5 w-5" />
            Reassign Copilot
          </DialogTitle>
          <DialogDescription>
            Reassign {entityLabel}
            {currentCopilotName ? ` from ${currentCopilotName}` : ''} to another copilot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_copilot_id">Select New Copilot</Label>
            {loadingCopilots ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading copilots...</span>
              </div>
            ) : (
              <Select
                value={selectedCopilotId}
                onValueChange={(value) => setValue('new_copilot_id', value)}
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
            {errors.new_copilot_id && (
              <p className="text-sm text-destructive">{errors.new_copilot_id.message}</p>
            )}
          </div>

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
                  Reassigning...
                </>
              ) : (
                <>
                  <Repeat className="mr-2 h-4 w-4" />
                  Reassign
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
