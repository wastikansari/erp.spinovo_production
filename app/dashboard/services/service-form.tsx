'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn, serviceImageUrl } from '@/lib/utils';

export const DURATION_PRESETS = [4, 8, 12, 24, 48];
// The API resizes uploads to 512×512 and compresses them, so big photos are fine.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface ServiceFormValues {
  service: string;
  service_duration_hours: string;
  description: string;
  service_code: string;
  home_title: string;
  badge_text: string;
  show_on_home: boolean;
}

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  service: '',
  service_duration_hours: '',
  description: '',
  service_code: '',
  home_title: '',
  badge_text: '',
  show_on_home: true,
};

// Mirrors deriveServiceCode() in spinovo_api/utils/serviceMeta.js so the
// admin sees the code the API will assign when the field is left blank.
export function deriveServiceCode(name: string): string {
  return (
    name
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 5) || 'GEN'
  );
}

// Returns an error message, or null when the form can be submitted.
export function validateServiceForm(v: ServiceFormValues): string | null {
  if (v.service.trim().length < 2) return 'Enter a service name (at least 2 characters).';
  const hours = Number(v.service_duration_hours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 240)
    return 'Enter the duration in whole hours (1–240).';
  if (v.service_code && !/^[A-Za-z0-9]{1,5}$/.test(v.service_code))
    return 'Service code: letters/numbers only, up to 5 characters.';
  return null;
}

interface ServiceFormProps {
  values: ServiceFormValues;
  onChange: (values: ServiceFormValues) => void;
  imageFile: File | null;
  onImageChange: (file: File | null, error?: string) => void;
  currentImageUrl?: string;
  // Core services (1–6) keep their name and code — order/invoice lookups use them.
  lockNameAndCode?: boolean;
}

export function ServiceForm({
  values,
  onChange,
  imageFile,
  onImageChange,
  currentImageUrl,
  lockNameAndCode = false,
}: ServiceFormProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    onChange({ ...values, [key]: value });

  const isPreset = DURATION_PRESETS.includes(Number(values.service_duration_hours));
  const shownImage = preview || serviceImageUrl(currentImageUrl);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type))
      return onImageChange(null, 'Image must be PNG, JPG or WEBP.');
    if (file.size > MAX_IMAGE_BYTES) return onImageChange(null, 'Image must be under 10 MB.');
    onImageChange(file);
  }

  return (
    <div className="space-y-6">
      {/* BASICS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service name</Label>
            <Input
              id="service"
              value={values.service}
              maxLength={40}
              disabled={lockNameAndCode}
              onChange={(e) => set('service', e.target.value)}
              placeholder="e.g. Quick Dry Cleaning"
            />
            {lockNameAndCode && (
              <p className="text-xs text-muted-foreground">
                Core service — name and code can&apos;t be changed.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Turnaround time (hours)</Label>
            <div className="flex flex-wrap items-center gap-2">
              {DURATION_PRESETS.map((h) => (
                <Button
                  key={h}
                  type="button"
                  size="sm"
                  variant={Number(values.service_duration_hours) === h ? 'default' : 'outline'}
                  className={cn(
                    'h-8',
                    Number(values.service_duration_hours) === h &&
                      'bg-indigo-600 hover:bg-indigo-700 text-white'
                  )}
                  onClick={() => set('service_duration_hours', String(h))}
                >
                  {h}h
                </Button>
              ))}
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  value={isPreset ? '' : values.service_duration_hours}
                  onChange={(e) => set('service_duration_hours', e.target.value)}
                  className="pl-9 h-8"
                  placeholder="Custom"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery is auto-calculated as pickup slot end + these hours.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (shown in the app)</Label>
            <Textarea
              id="description"
              value={values.description}
              maxLength={200}
              rows={2}
              onChange={(e) => set('description', e.target.value)}
              placeholder={
                values.service && values.service_duration_hours
                  ? `${values.service} needs at least ${values.service_duration_hours} hours for delivery`
                  : 'Leave blank to auto-generate'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Order code</Label>
            <Input
              id="code"
              value={values.service_code}
              maxLength={5}
              disabled={lockNameAndCode}
              onChange={(e) => set('service_code', e.target.value.toUpperCase())}
              placeholder={values.service ? deriveServiceCode(values.service) : 'e.g. QDC'}
              className="w-32 uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Sub-order number suffix, e.g. ORD1234-
              {values.service_code || (values.service ? deriveServiceCode(values.service) : 'QDC')}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* APP HOME TILE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">App Home tile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 shrink-0 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImage} alt="Service" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-7 w-7 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-2" />
                {shownImage ? 'Change image' : 'Upload image'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Square image, transparent PNG looks best. Up to 10 MB — it&apos;s
                automatically resized to 512×512 and compressed for the app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home_title">Tile text</Label>
              <Input
                id="home_title"
                value={values.home_title}
                maxLength={30}
                onChange={(e) => set('home_title', e.target.value)}
                placeholder={values.service || 'Same as service name'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge_text">Badge (optional)</Label>
              <Input
                id="badge_text"
                value={values.badge_text}
                maxLength={12}
                onChange={(e) => set('badge_text', e.target.value)}
                placeholder='e.g. "NEW" or "8 Hrs"'
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Show on app Home screen</p>
              <p className="text-xs text-muted-foreground">
                Off = only listed inside the service screen tabs.
              </p>
            </div>
            <Switch checked={values.show_on_home} onCheckedChange={(v) => set('show_on_home', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
