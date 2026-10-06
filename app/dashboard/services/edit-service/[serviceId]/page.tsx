'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getServiceCategories, updateServiceSettings, uploadServiceImage } from '@/lib/api/service';
import { FullServiceCategory } from '@/lib/types/booking';
import { ServiceForm, ServiceFormValues, validateServiceForm } from '../../service-form';

// Core services 1–6 are matched by name in order code / ERP order pages.
const CORE_SERVICE_IDS = [1, 2, 3, 4, 5, 6];

function toFormValues(s: FullServiceCategory): ServiceFormValues {
  return {
    service: s.service,
    service_duration_hours: String(s.service_duration_hours ?? ''),
    description: s.description ?? '',
    service_code: s.service_code ?? '',
    home_title: s.home_title ?? '',
    badge_text: s.badge_text ?? '',
    show_on_home: s.show_on_home !== false,
  };
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = Number(params.serviceId);
  const isCore = CORE_SERVICE_IDS.includes(serviceId);

  const [service, setService] = useState<FullServiceCategory | null>(null);
  const [values, setValues] = useState<ServiceFormValues | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getServiceCategories()
      .then((list) => {
        const found = list.find((s) => s.service_id === serviceId) ?? null;
        setService(found);
        if (found) setValues(toFormValues(found));
      })
      .catch((err) =>
        setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load service' })
      )
      .finally(() => setLoading(false));
  }, [serviceId]);

  async function handleSave() {
    if (!values || !service) return;
    const invalid = validateServiceForm(values);
    if (invalid) {
      setAlert({ type: 'error', message: invalid });
      return;
    }
    setSaving(true);
    setAlert(null);

    const result = await updateServiceSettings(serviceId, {
      ...(isCore
        ? {}
        : { service: values.service.trim(), service_code: values.service_code.trim() }),
      service_duration_hours: Number(values.service_duration_hours),
      description: values.description.trim(),
      home_title: values.home_title.trim(),
      badge_text: values.badge_text.trim(),
      show_on_home: values.show_on_home,
    });
    if (!result.success) {
      setSaving(false);
      setAlert({ type: 'error', message: result.message || 'Update failed. Please try again.' });
      return;
    }

    if (imageFile) {
      const upload = await uploadServiceImage(serviceId, imageFile);
      if (!upload.success) {
        setSaving(false);
        setAlert({ type: 'error', message: `Details saved, but image upload failed: ${upload.message}` });
        return;
      }
    }

    setSaving(false);
    setAlert({ type: 'success', message: 'Service updated successfully!' });
    setTimeout(() => router.push('/dashboard/services'), 1500);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Button>

      <div>
        <p className="text-sm text-muted-foreground capitalize">{service?.service}</p>
        <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
          <Pencil className="h-5 w-5 text-indigo-500" />
          Edit Service
        </h1>
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

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading service...</div>
      ) : !service || !values ? (
        <div className="text-muted-foreground">Service not found.</div>
      ) : (
        <>
          <ServiceForm
            values={values}
            onChange={setValues}
            imageFile={imageFile}
            onImageChange={(file, error) => {
              setImageFile(file);
              setAlert(error ? { type: 'error', message: error } : null);
            }}
            currentImageUrl={service.image_url}
            lockNameAndCode={isCore}
          />

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
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
