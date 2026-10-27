'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appContentImageUrl } from '@/lib/utils';
import { CatalogService, DurationMode, ItemFields, ShowcaseItem, priceNumber } from '@/lib/api/appShowcase';
import { RATIO } from './showcase-preview';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BADGES = ['NEW', 'HOT', 'BESTSELLER', '8 HRS'];

const EMPTY: ItemFields = {
  service_id: '',
  category_id: '',
  custom_name: '',
  mrp: '',
  duration_mode: 'service',
  duration_text: '',
  extra_text: '',
  badge_text: '',
  is_active: true,
};

function fromItem(item: ShowcaseItem): ItemFields {
  return {
    service_id: String(item.service_id),
    category_id: String(item.category_id),
    custom_name: item.custom_name,
    mrp: item.mrp == null ? '' : String(item.mrp),
    duration_mode: item.duration_mode,
    duration_text: item.duration_text,
    extra_text: item.extra_text,
    badge_text: item.badge_text,
    is_active: item.is_active,
  };
}

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShowcaseItem | null; // null = add
  catalog: CatalogService[];
  imageRatio: keyof typeof RATIO;
  onSubmit: (fields: ItemFields, image: File | null) => Promise<string | null>;
}

export function CardDialog({ open, onOpenChange, item, catalog, imageRatio, onSubmit }: CardDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ItemFields>(EMPTY);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(item ? fromItem(item) : EMPTY);
    setImage(null);
    setError(null);
  }, [open, item]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const set = <K extends keyof ItemFields>(key: K, value: ItemFields[K]) => setValues((v) => ({ ...v, [key]: value }));

  const service = catalog.find((s) => String(s.service_id) === values.service_id);
  const category = service?.categories.find((c) => String(c.category_id) === values.category_id);
  const price = priceNumber(category?.price);
  const mrp = values.mrp ? Number(values.mrp) : null;
  const off = useMemo(
    () => (mrp && Number.isFinite(price) && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
    [mrp, price]
  );
  const shownImage = preview || appContentImageUrl(item?.image_url);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return setError('Image must be PNG, JPG or WEBP.');
    if (file.size > MAX_IMAGE_BYTES) return setError('Image must be under 10 MB.');
    setError(null);
    setImage(file);
  }

  async function save() {
    if (!service) return setError('Choose the service.');
    if (!category) return setError('Choose the category.');
    if (!item && !image) return setError('Upload the card image.');
    if (values.mrp && (!Number.isFinite(mrp) || (mrp as number) <= price))
      return setError(`MRP must be more than the selling price (₹${price}), or leave it empty.`);
    if (values.duration_mode === 'custom' && !values.duration_text.trim())
      return setError('Enter the duration text, or show the service time instead.');

    setSaving(true);
    setError(null);
    const failure = await onSubmit(
      {
        ...values,
        custom_name: values.custom_name.trim(),
        duration_text: values.duration_text.trim(),
        extra_text: values.extra_text.trim(),
        badge_text: values.badge_text.trim().toUpperCase(),
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
          <DialogTitle>{item ? 'Edit card' : 'Add card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* SERVICE → CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={values.service_id}
                onValueChange={(v) => {
                  // A bundle has just its one virtual category — pick it.
                  const picked = catalog.find((s) => String(s.service_id) === v);
                  const only = picked?.is_bundle ? picked.categories[0] : undefined;
                  setValues((x) => ({ ...x, service_id: v, category_id: only ? String(only.category_id) : '' }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((s) => (
                    <SelectItem key={s.service_id} value={String(s.service_id)}>
                      {s.service}
                      {s.is_active ? '' : ' (inactive)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={values.category_id} onValueChange={(v) => set('category_id', v)} disabled={!service}>
                <SelectTrigger>
                  <SelectValue placeholder={service ? 'Choose a category' : 'Choose a service first'} />
                </SelectTrigger>
                <SelectContent>
                  {service?.categories.map((c) => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>
                      {c.category} — ₹{c.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {service && !service.is_active && (
            <p className="text-xs text-amber-600">This service is inactive — the card stays hidden until it is switched on.</p>
          )}
          {category && service?.is_bundle && (
            <p className="text-xs text-muted-foreground">
              Price <b>₹{category.price}</b> comes live from the bundle settings. Tapping the card or its button opens the
              bundle popup in the app (nothing goes in the cart).
            </p>
          )}
          {category && !service?.is_bundle && (
            <p className="text-xs text-muted-foreground">
              Selling price <b>₹{category.price}</b> comes live from ERP → Services. Tapping ADD puts 1 in the cart and
              opens this category.
            </p>
          )}

          {/* IMAGE */}
          <div className="space-y-2">
            <Label>Card image</Label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="block overflow-hidden rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              style={{ aspectRatio: String(RATIO[imageRatio]), width: 220 }}
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
              This section uses {imageRatio} images (e.g. {imageRatio === '1:1' ? '800×800' : imageRatio === '4:3' ? '800×600' : '600×800'}).
              Up to 10 MB — auto-compressed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sc-name">Card name (optional)</Label>
            <Input
              id="sc-name"
              value={values.custom_name}
              maxLength={40}
              onChange={(e) => set('custom_name', e.target.value)}
              placeholder={category?.category ?? 'Category name'}
            />
            <p className="text-xs text-muted-foreground">Empty = the category name.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sc-mrp">MRP — crossed-out price (optional)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="sc-mrp"
                type="number"
                min={1}
                inputMode="numeric"
                className="w-40"
                value={values.mrp}
                onChange={(e) => set('mrp', e.target.value)}
                placeholder="e.g. 249"
              />
              {off > 0 && (
                <span className="text-sm">
                  ₹{category?.price} <s className="text-muted-foreground">₹{mrp}</s>{' '}
                  <span className="font-semibold text-green-600">{off}% OFF</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Display only — the customer always pays the selling price.</p>
          </div>

          <div className="space-y-2">
            <Label>Duration line</Label>
            <Select value={values.duration_mode} onValueChange={(v) => set('duration_mode', v as DurationMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service time{service?.duration ? ` (${service.duration})` : ''}</SelectItem>
                <SelectItem value="custom">Custom text</SelectItem>
                <SelectItem value="hide">Don&apos;t show</SelectItem>
              </SelectContent>
            </Select>
            {values.duration_mode === 'custom' && (
              <Input
                value={values.duration_text}
                maxLength={30}
                onChange={(e) => set('duration_text', e.target.value)}
                placeholder="e.g. Ready same day"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sc-extra">Extra text (optional)</Label>
            <Input
              id="sc-extra"
              value={values.extra_text}
              maxLength={40}
              onChange={(e) => set('extra_text', e.target.value)}
              placeholder="e.g. Includes free fold & pack"
            />
            <p className="text-xs text-muted-foreground">Shown only if the section&apos;s “Extra text” line is on.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sc-badge">Badge (optional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="sc-badge"
                className="w-36"
                value={values.badge_text}
                maxLength={12}
                onChange={(e) => set('badge_text', e.target.value)}
                placeholder="NEW"
              />
              {BADGES.map((b) => (
                <Button key={b} type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => set('badge_text', b)}>
                  {b}
                </Button>
              ))}
              {values.badge_text && (
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => set('badge_text', '')}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Show this card</p>
              <p className="text-xs text-muted-foreground">Off = kept here but hidden in the app.</p>
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
