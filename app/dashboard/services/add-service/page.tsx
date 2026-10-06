'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createService, updateServiceSettings, uploadServiceImage } from '@/lib/api/service';
import {
  ServiceForm,
  ServiceFormValues,
  EMPTY_SERVICE_FORM,
  validateServiceForm,
} from '../service-form';

export default function AddServicePage() {
  const router = useRouter();
  const [values, setValues] = useState<ServiceFormValues>(EMPTY_SERVICE_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleCreate() {
    const invalid = validateServiceForm(values);
    if (invalid) {
      setAlert({ type: 'error', message: invalid });
      return;
    }
    setSaving(true);
    setAlert(null);

    const created = await createService({
      service: values.service.trim(),
      service_duration_hours: Number(values.service_duration_hours),
      description: values.description.trim(),
      service_code: values.service_code.trim(),
      home_title: values.home_title.trim(),
      badge_text: values.badge_text.trim(),
    });
    if (!created.success || !created.service) {
      setSaving(false);
      setAlert({ type: 'error', message: created.message || 'Could not create the service.' });
      return;
    }

    const serviceId = created.service.service_id;
    // Created services default to show_on_home = true; only patch when turned off.
    if (!values.show_on_home) {
      await updateServiceSettings(serviceId, { show_on_home: false });
    }
    let imageNote = '';
    if (imageFile) {
      const upload = await uploadServiceImage(serviceId, imageFile);
      if (!upload.success) imageNote = ` Image upload failed (${upload.message}) — add it from Edit Service.`;
    }

    setSaving(false);
    setAlert({
      type: imageNote ? 'error' : 'success',
      message: `Service created as Inactive. Now add its categories & prices, then switch it Active.${imageNote}`,
    });
    setTimeout(() => router.push('/dashboard/services'), imageNote ? 3500 : 1800);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Button>

      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-indigo-500" />
          Add Service
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          New services start <strong>Inactive</strong> — customers won&apos;t see it until you add
          categories with prices and switch it Active.
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={
            alert.type === 'success'
              ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300'
              : ''
          }
        >
          {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <ServiceForm
        values={values}
        onChange={setValues}
        imageFile={imageFile}
        onImageChange={(file, error) => {
          setImageFile(file);
          setAlert(error ? { type: 'error', message: error } : null);
        }}
      />

      <div className="flex gap-3 pb-8">
        <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Service'
          )}
        </Button>
      </div>
    </div>
  );
}
