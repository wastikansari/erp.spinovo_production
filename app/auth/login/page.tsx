'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, AlertCircle, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Step = 'permission' | 'login';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('permission');
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ mobile: '', password: '' });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      // Browser doesn't support notifications — skip straight to login
      setStep('login');
      return;
    }
    const perm = Notification.permission;
    setPermissionState(perm);
    if (perm === 'granted') {
      setStep('login');
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result === 'granted' || result === 'denied') {
        setStep('login');
      }
    } catch {
      setStep('login');
    }
  };

  const handleSkip = () => setStep('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await AuthService.login(formData);

      if (response.status) {
        toast({
          title: 'Login successful',
          description: 'Welcome back to Spinovo Admin Panel',
        });
        router.push('/dashboard');
      } else {
        setError(response.msg || 'Login failed');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Step 1: Notification permission ────────────────────────────────────────
  if (step === 'permission') {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl text-center">Enable Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Allow notifications to receive real-time alerts for new orders, pickups, and deliveries.
          </p>

          {permissionState === 'denied' ? (
            <Alert variant="destructive">
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked. To enable them, click the lock icon in your browser address bar, set Notifications to <strong>Allow</strong>, then refresh.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 pt-2">
            {permissionState !== 'denied' && (
              <Button className="w-full" onClick={handleRequestPermission}>
                <Bell className="mr-2 h-4 w-4" />
                Allow Notifications
              </Button>
            )}
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSkip}>
              {permissionState === 'denied' ? 'Continue without notifications' : 'Skip for now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 2: Login form ──────────────────────────────────────────────────────
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center">Spinovo Admin</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="mobile number"
              value={formData.mobile}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
