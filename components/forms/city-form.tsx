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
import { Loader2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationApiService, CreateCityRequest } from '@/lib/api';
import { City } from '@/lib/types/location';

const citySchema = z.object({
  cityName: z.string().min(2, 'City name must be at least 2 characters'),
  cityId: z.string().min(2, 'City ID must be at least 2 characters').max(5, 'City ID must be at most 5 characters'),
  handlingCharge: z.number().min(0, 'Handling charge must be 0 or greater'),
  platformCharge: z.number().min(0, 'Platform charge must be 0 or greater'),
  status: z.boolean(),
});

type CityFormData = z.infer<typeof citySchema>;

interface CityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stateId: string;
  city?: City | null;
}

export function CityForm({ open, onOpenChange, onSuccess, stateId, city }: CityFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!city;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      cityName: city?.cityName || '',
      cityId: city?.cityId || '',
      handlingCharge: city?.handlingCharge || 0,
      platformCharge: city?.platformCharge || 0,
      status: city?.status ?? true,
    },
  });

  const statusValue = watch('status');

  const onSubmit = async (data: CityFormData) => {
    try {
      setLoading(true);
      console.log(`${isEditing ? 'Updating' : 'Creating'} city:`, data);

      const response = isEditing 
        ? await LocationApiService.updateCity(stateId, data)
        : await LocationApiService.createCity(stateId, data);

      if (response.status) {
        toast({
          title: 'Success',
          description: `City ${isEditing ? 'updated' : 'created'} successfully`,
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: response.msg || `Failed to ${isEditing ? 'update' : 'create'} city`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} city:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} city. Please try again.`,
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
            <Building className="h-5 w-5" />
            {isEditing ? 'Edit City' : 'Create New City'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the city information.' : 'Add a new city to the state.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cityName">City Name</Label>
            <Input
              id="cityName"
              placeholder="Enter city name"
              {...register('cityName')}
              disabled={loading}
            />
            {errors.cityName && (
              <p className="text-sm text-destructive">{errors.cityName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityId">City ID</Label>
            <Input
              id="cityId"
              placeholder="Enter city ID (e.g., AHD)"
              {...register('cityId')}
              disabled={loading}
            />
            {errors.cityId && (
              <p className="text-sm text-destructive">{errors.cityId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handlingCharge">Handling Charge</Label>
              <Input
                id="handlingCharge"
                type="number"
                placeholder="0"
                {...register('handlingCharge', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.handlingCharge && (
                <p className="text-sm text-destructive">{errors.handlingCharge.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="platformCharge">Platform Charge</Label>
              <Input
                id="platformCharge"
                type="number"
                placeholder="0"
                {...register('platformCharge', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.platformCharge && (
                <p className="text-sm text-destructive">{errors.platformCharge.message}</p>
              )}
            </div>
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
                  <Building className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update City' : 'Create City'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}