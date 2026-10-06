'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FullServiceCategory } from '@/lib/types/booking';
import { AppActionType, AppContentFields } from '@/lib/api/appContent';
import { appContentImageUrl } from '@/lib/utils';

// Same artwork ratio as the app's original hardcoded banner (2410×1024).
// Must match _bannerAspectRatio in the app's home_screen_v2.dart.
export const BANNER_RATIO = 2410 / 1024;
export const POPUP_RATIO = 4 / 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// ISO → value for <input type="datetime-local"> in the admin's timezone.
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ContentFormDialogProps {
  kind: 'banner' | 'popup';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null = create
  initial: (AppContentFields & { image_url: string }) | null;
  services: FullServiceCategory[];
  onSubmit: (fields: AppContentFields, image: File | null) => Promise<string | null>;
}

const EMPTY: AppContentFields = {
  title: '',
  action_type: 'none',
  service_id: '',
  link_url: '',
  is_active: true,
  start_at: '',
  end_at: '',
  button_text: '',
};

export function ContentFormDialog({
  kind,
  open,
  onOpenChange,
  initial,
  services,
  onSubmit,
}: ContentFormDialogProps) {
  const isPopup = kind === 'popup';
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<AppContentFields>(EMPTY);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initial ? { ...EMPTY, ...initial } : { ...EMPTY, button_text: isPopup ? 'Book Now' : '' });
    setImage(null);
    setError(null);
  }, [open, initial, isPopup]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const set = <K extends keyof AppContentFields>(key: K, value: AppContentFields[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const shownImage = preview || appContentImageUrl(initial?.image_url);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return setError('Image must be PNG, JPG or WEBP.');
    if (file.size > MAX_IMAGE_BYTES) return setError('Image must be under 10 MB.');
    setError(null);
    setImage(file);
  }

  async function save() {
    if (values.title.trim().length < 2) return setError('Enter a name (only you see it in ERP).');
    if (!initial && !image) return setError(`Upload the ${kind} image.`);
    if (values.action_type === 'service' && !values.service_id) return setError('Choose the service to open.');
    if (values.action_type === 'link' && !/^(https?|whatsapp|tel|mailto):/i.test(values.link_url.trim()))
      return setError('Enter a full link starting with https:// (or whatsapp:, tel:).');
    if (values.start_at && values.end_at && values.end_at < values.start_at)
      return setError('End date must be after the start date.');

    setSaving(true);
    setError(null);
    const failure = await onSubmit(
      {
        ...values,
        title: values.title.trim(),
        link_url: values.link_url.trim(),
        button_text: isPopup ? (values.button_text || '').trim() : undefined,
      },
      image
    );
    setSaving(false);
    if (failure) setError(failure);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Edit' : 'Add'} {isPopup ? 'popup' : 'banner'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* IMAGE */}
          <div className="space-y-2">
            <Label>Image</Label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="block w-full overflow-hidden rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              style={{ aspectRatio: String(isPopup ? POPUP_RATIO : BANNER_RATIO), maxWidth: isPopup ? 240 : undefined }}
            >
              {shownImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImage} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  Click to upload
                </span>
              )}
            </button>
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
            <p className="text-xs text-muted-foreground">
              {isPopup
                ? 'Portrait flyer, 1080×1350 (4:5). Up to 10 MB — auto-compressed.'
                : 'Same size as the current banner: 2410×1024 (wide). Up to 10 MB — auto-compressed.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ac-title">Name (ERP only)</Label>
            <Input
              id="ac-title"
              value={values.title}
              maxLength={60}
              onChange={(e) => set('title', e.target.value)}
              placeholder={isPopup ? 'e.g. Navratri launch flyer' : 'e.g. Navratri Quick Dry Cleaning'}
            />
          </div>

          {/* TAP ACTION */}
          <div className="space-y-2">
            <Label>{isPopup ? 'Button opens' : 'When tapped'}</Label>
            <Select value={values.action_type} onValueChange={(v) => set('action_type', v as AppActionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isPopup ? 'Nothing — button just closes' : 'Nothing'}</SelectItem>
                <SelectItem value="service">A service (opens its tab on the service screen)</SelectItem>
                <SelectItem value="link">A link (website / WhatsApp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {values.action_type === 'service' && (
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={values.service_id} onValueChange={(v) => set('service_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.service_id} value={String(s.service_id)}>
                      {s.service}
                      {s.is_active ? '' : ' (inactive)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If the service is inactive, the app shows the image but tapping does nothing.
              </p>
            </div>
          )}

          {values.action_type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="ac-link">Link</Label>
              <Input
                id="ac-link"
                value={values.link_url}
                onChange={(e) => set('link_url', e.target.value)}
                placeholder="https://wa.me/91XXXXXXXXXX"
              />
            </div>
          )}

          {isPopup && values.action_type !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="ac-btn">Button text</Label>
              <Input
                id="ac-btn"
                value={values.button_text}
                maxLength={24}
                onChange={(e) => set('button_text', e.target.value)}
                placeholder="Book Now"
              />
              <p className="text-xs text-muted-foreground">Leave empty to make the whole image tappable instead.</p>
            </div>
          )}

          {/* SCHEDULE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ac-start">Show from (optional)</Label>
              <Input
                id="ac-start"
                type="datetime-local"
                value={values.start_at}
                onChange={(e) => set('start_at', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-end">Show until (optional)</Label>
              <Input
                id="ac-end"
                type="datetime-local"
                value={values.end_at}
                onChange={(e) => set('end_at', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                {isPopup
                  ? 'Shown every time a customer opens the app. Turning this on switches off any other popup.'
                  : 'Shown in the app Home carousel.'}
              </p>
            </div>
            <Switch checked={values.is_active} onCheckedChange={(v) => set('is_active', v)} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
