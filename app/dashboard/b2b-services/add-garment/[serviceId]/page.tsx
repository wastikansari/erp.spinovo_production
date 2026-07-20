'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Shirt, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addB2BGarment } from '@/lib/api/b2bService';

export default function AddB2BGarmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = params.serviceId as string;
  const serviceName = searchParams.get('serviceName') ?? '';

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Garment name is required.' });
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setAlert({ type: 'error', message: 'Enter a valid price.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    const result = await addB2BGarment(serviceId, {
      name: name.trim(),
      price: price.trim(),
    });

    setSaving(false);
    if (result.success) {
      setAlert({ type: 'success', message: 'Garment added successfully!' });
      setTimeout(() => router.push('/dashboard/b2b-services'), 1500);
    } else {
      setAlert({ type: 'error', message: result.message || 'Failed to add garment. Please try again.' });
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
          <Shirt className="h-5 w-5 text-indigo-500" />
          Add New Garment
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

      {/* FORM CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Garment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          <div className="space-y-2">
            <Label htmlFor="name">Garment Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. T-shirt, Pant"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9"
                placeholder="0.00"
                disabled={saving}
              />
            </div>
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
            'Add Garment'
          )}
        </Button>
      </div>
    </div>
  );
}
