'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateB2BService } from '@/lib/api/b2bService';

export default function EditB2BServicePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = params.serviceId as string;
  const serviceName = searchParams.get('serviceName') ?? '';
  const initialDuration = Number(searchParams.get('duration') ?? 0);

  const [durationHours, setDurationHours] = useState(String(initialDuration));
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSave() {
    const val = Number(durationHours);
    if (!durationHours || isNaN(val) || val <= 0) {
      setAlert({ type: 'error', message: 'Enter a valid duration in hours (must be > 0).' });
      return;
    }
    setSaving(true);
    setAlert(null);

    const result = await updateB2BService(serviceId, { service_duration_hours: val });

    setSaving(false);
    if (result.success) {
      setAlert({ type: 'success', message: 'Service updated successfully!' });
      setTimeout(() => router.push('/dashboard/b2b-services'), 1500);
    } else {
      setAlert({ type: 'error', message: result.message || 'Update failed. Please try again.' });
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 p-6">
      {/* BACK */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to B2B Services
      </Button>

      {/* TITLE */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">{serviceName}</p>
        <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
          <Clock className="h-5 w-5 text-indigo-500" />
          Edit Service
        </h1>
      </div>

      {/* ALERT */}
      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={alert.type === 'success' ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' : ''}
        >
          {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* FORM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Duration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="duration"
                type="number"
                min={1}
                step={1}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="pl-9"
                placeholder="e.g. 24"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              How many hours this service takes to complete.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex gap-3 pb-8">
        <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
