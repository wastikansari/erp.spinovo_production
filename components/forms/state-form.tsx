'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationApiService, CreateStateRequest } from '@/lib/api';
import { State } from '@/lib/types/location';

const stateSchema = z.object({
  stateName: z.string().min(2, 'State name must be at least 2 characters'),
  stateId: z.string().min(2, 'State ID must be at least 2 characters').max(5, 'State ID must be at most 5 characters'),
  status: z.boolean(),
});

type StateFormData = z.infer<typeof stateSchema>;

interface StateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  state?: State | null;
}

export function StateForm({ open, onOpenChange, onSuccess, state }: StateFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!state;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      stateName: state?.stateName || '',
      stateId: state?.stateId || '',
      status: state?.status ?? true,
    },
  });

  const statusValue = watch('status');

  const onSubmit = async (data: StateFormData) => {
    try {
      setLoading(true);
      console.log(`${isEditing ? 'Updating' : 'Creating'} state:`, data);

      const response = isEditing 
        ? await LocationApiService.updateState(state._id, data)
        : await LocationApiService.createState(data);

      if (response.status) {
        toast({
          title: 'Success',
          description: `State ${isEditing ? 'updated' : 'created'} successfully`,
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: response.msg || `Failed to ${isEditing ? 'update' : 'create'} state`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} state:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} state. Please try again.`,
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
            <MapPin className="h-5 w-5" />
            {isEditing ? 'Edit State' : 'Create New State'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the state information.' : 'Add a new state to the system.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stateName">State Name</Label>
            <Input
              id="stateName"
              placeholder="Enter state name"
              {...register('stateName')}
              disabled={loading}
            />
            {errors.stateName && (
              <p className="text-sm text-destructive">{errors.stateName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateId">State ID</Label>
            <Input
              id="stateId"
              placeholder="Enter state ID (e.g., GJ)"
              {...register('stateId')}
              disabled={loading}
            />
            {errors.stateId && (
              <p className="text-sm text-destructive">{errors.stateId.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={statusValue}
              onCheckedChange={(checked) => setValue('status', checked)}
              disabled={loading}
            />
            <Label htmlFor="status">Active Status</Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update State' : 'Create State'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}