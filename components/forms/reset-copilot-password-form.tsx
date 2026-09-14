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
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CopilotApiService } from '@/lib/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetCopilotPasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copilotId: string;
  copilotName: string;
  onSuccess?: () => void;
}

export function ResetCopilotPasswordForm({
  open,
  onOpenChange,
  copilotId,
  copilotName,
  onSuccess,
}: ResetCopilotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      const response = await CopilotApiService.updateCopilot(copilotId, {
        password: data.password,
      });

      if (response.status) {
        toast({
          title: 'Success',
          description: `Password updated for ${copilotName}`,
        });
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: response.msg || 'Failed to update password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium">{copilotName}</span>. They will need to use this new password on their next login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              {...register('password')}
              disabled={loading}
              autoFocus
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
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
