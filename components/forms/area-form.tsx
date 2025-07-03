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
import { LocationApiService, CreateAreaRequest } from '@/lib/api';
import { Area } from '@/lib/types/location';

const areaSchema = z.object({
  areaName: z.string().min(2, 'Area name must be at least 2 characters'),
  areaId: z.string().min(2, 'Area ID must be at least 2 characters').max(5, 'Area ID must be at most 5 characters'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters').max(6, 'Pincode must be exactly 6 characters'),
  status: z.boolean(),
});

type AreaFormData = z.infer<typeof areaSchema>;

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stateId: string;
  cityId: string;
  area?: Area | null;
}

export function AreaForm({ open, onOpenChange, onSuccess, stateId, cityId, area }: AreaFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!area;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      areaName: area?.areaName || '',
      areaId: area?.areaId || '',
      pincode: area?.pincode || '',
      status: area?.status ?? true,
    },
  });

  const statusValue = watch('status');

  const onSubmit = async (data: AreaFormData) => {
    try {
      setLoading(true);
      console.log(`${isEditing ? 'Updating' : 'Creating'} area:`, data);

      const response = isEditing 
        ? await LocationApiService.updateArea(stateId, cityId, data)
        : await LocationApiService.createArea(stateId, cityId, data);

      if (response.status) {
        toast({
          title: 'Success',
          description: `Area ${isEditing ? 'updated' : 'created'} successfully`,
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: response.msg || `Failed to ${isEditing ? 'update' : 'create'} area`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} area:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} area. Please try again.`,
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
            {isEditing ? 'Edit Area' : 'Create New Area'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the area information.' : 'Add a new area to the city.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="areaName">Area Name</Label>
            <Input
              id="areaName"
              placeholder="Enter area name"
              {...register('areaName')}
              disabled={loading}
            />
            {errors.areaName && (
              <p className="text-sm text-destructive">{errors.areaName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaId">Area ID</Label>
            <Input
              id="areaId"
              placeholder="Enter area ID (e.g., BPL)"
              {...register('areaId')}
              disabled={loading}
            />
            {errors.areaId && (
              <p className="text-sm text-destructive">{errors.areaId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              placeholder="Enter pincode"
              {...register('pincode')}
              disabled={loading}
            />
            {errors.pincode && (
              <p className="text-sm text-destructive">{errors.pincode.message}</p>
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
                  {isEditing ? 'Update Area' : 'Create Area'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}