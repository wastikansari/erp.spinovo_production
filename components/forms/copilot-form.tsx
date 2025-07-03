'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CopilotApiService, CreateCopilotRequest } from '@/lib/api';

const copilotSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CopilotFormData = z.infer<typeof copilotSchema>;

interface CopilotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CopilotForm({ open, onOpenChange, onSuccess }: CopilotFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CopilotFormData>({
    resolver: zodResolver(copilotSchema),
  });

  const onSubmit = async (data: CopilotFormData) => {
    try {
      setLoading(true);
      console.log('Creating copilot with data:', { ...data, password: '[HIDDEN]' });

      const response = await CopilotApiService.createCopilot(data);

      if (response.status) {
        toast({
          title: 'Success',
          description: 'Copilot created successfully',
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: response.msg || 'Failed to create copilot',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating copilot:', error);
      toast({
        title: 'Error',
        description: 'Failed to create copilot. Please try again.',
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
            <UserPlus className="h-5 w-5" />
            Create New Copilot
          </DialogTitle>
          <DialogDescription>
            Add a new copilot to the system. All fields are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="Enter mobile number"
              {...register('mobile')}
              disabled={loading}
            />
            {errors.mobile && (
              <p className="text-sm text-destructive">{errors.mobile.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register('password')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Copilot
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}