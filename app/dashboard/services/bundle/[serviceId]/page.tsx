'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Calendar, Check, Clock, Home, ImagePlus, IndianRupee,
  Loader2, Pencil, Plus, Ruler, Save, Shield, Star, Trash2, Truck, Scissors, type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { appContentImageUrl } from '@/lib/utils';
import { BundleApiService } from '@/lib/api/bundle';
import type { BundleConfig, BundleConfigData, BundleConfigUpdate, BundlePoint } from '@/lib/types/bundle';

// Same names the app draws (BundleIcon in spinovo_app); "curtain" has no
// lucide equivalent, scissors stands in for it here only.
const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  home: { icon: Home, label: 'Home' },
  curtain: { icon: Scissors, label: 'Curtain' },
  ruler: { icon: Ruler, label: 'Ruler / size' },
  rupee: { icon: IndianRupee, label: 'Rupee / price' },
  check: { icon: Check, label: 'Check' },
  clock: { icon: Clock, label: 'Clock' },
  shield: { icon: Shield, label: 'Shield / safe' },
  truck: { icon: Truck, label: 'Truck / pickup' },
  star: { icon: Star, label: 'Star' },
  calendar: { icon: Calendar, label: 'Calendar' },
};

interface Form {
  price: string;
  subtitle: string;
  points: BundlePoint[];
  rules: string[];
  agree_text: string;
  button_text: string;
  max_per_slot: string;
  convert_service_id: string;
}

function toForm(c: BundleConfig): Form {
  return {
    price: String(c.price),
    subtitle: c.subtitle,
    points: c.points.map((p) => ({ ...p })),
    rules: [...c.rules],
    agree_text: c.agree_text,
    button_text: c.button_text,
    max_per_slot: String(c.max_per_slot || 0),
    convert_service_id: c.convert_service_id ? String(c.convert_service_id) : '',
  };
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function BundleSettingsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<BundleConfigData | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmRules, setConfirmRules] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await BundleApiService.getConfig(serviceId);
      if (res.data) {
        setData(res.data);
        setForm(toForm(res.data.config));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bundle settings');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!data || !form) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Bundle service not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const cfg = data.config;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
  const rulesChanged = JSON.stringify(form.rules.map((r) => r.trim())) !== JSON.stringify(cfg.rules);

  function buildPayload(f: Form): BundleConfigUpdate | string {
    const price = Number(f.price);
    if (!Number.isInteger(price) || price < 1) return 'Enter the price in whole rupees.';
    const maxPerSlot = Number(f.max_per_slot || 0);
    if (!Number.isInteger(maxPerSlot) || maxPerSlot < 0) return 'Max visits per slot must be 0 or more.';
    if (f.points.some((p) => !p.text.trim())) return 'Every "What you get" point needs text (or remove it).';
    if (f.rules.some((r) => !r.trim())) return 'Every rule needs text (or remove it).';
    if (f.agree_text.trim().length < 3) return 'Enter the agree checkbox text.';
    const payload: BundleConfigUpdate = {};
    if (price !== cfg.price) payload.price = price;
    if (f.subtitle.trim() !== cfg.subtitle) payload.subtitle = f.subtitle.trim();
    const points = f.points.map((p) => ({ icon: p.icon, text: p.text.trim() }));
    if (JSON.stringify(points) !== JSON.stringify(cfg.points)) payload.points = points;
    const rules = f.rules.map((r) => r.trim());
    if (JSON.stringify(rules) !== JSON.stringify(cfg.rules)) payload.rules = rules;
    if (f.agree_text.trim() !== cfg.agree_text) payload.agree_text = f.agree_text.trim();
    if (f.button_text.trim() !== cfg.button_text) payload.button_text = f.button_text.trim();
    if (maxPerSlot !== (cfg.max_per_slot || 0)) payload.max_per_slot = maxPerSlot;
    const convertId = f.convert_service_id ? Number(f.convert_service_id) : null;
    if (convertId !== cfg.convert_service_id) payload.convert_service_id = convertId;
    return payload;
  }

  async function save() {
    if (!form) return;
    const payload = buildPayload(form);
    if (typeof payload === 'string') {
      toast({ title: 'Check the form', description: payload, variant: 'destructive' });
      return;
    }
    if (!Object.keys(payload).length) {
      toast({ title: 'Nothing changed' });
      return;
    }
    setSaving(true);
    try {
      const res = await BundleApiService.updateConfig(serviceId, payload);
      toast({ title: 'Bundle settings saved', description: res.data?.changes?.join(' · ') });
      setConfirmRules(false);
      await load();
    } catch (err: any) {
      toast({ title: 'Not saved', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadBanner(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size > 10 * 1024 * 1024) {
      toast({ title: 'Image must be PNG, JPG or WEBP, under 10 MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await BundleApiService.uploadBanner(serviceId, file);
      toast({ title: 'Popup banner updated' });
      await load();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  const bannerUrl = appContentImageUrl(cfg.banner_url);
  const priceText = form.price || '0';

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/services"><ArrowLeft className="h-4 w-4 mr-2" />Services</Link>
          </Button>
          <h1 className="text-2xl font-bold">Bundle settings — {data.service.service}</h1>
          <p className="text-sm text-muted-foreground">
            Everything the customer sees in the app popup comes from here. No coupon, discount, delivery, platform,
            handling or slot charge is ever added to this booking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/dashboard/services/edit-service/${data.service.service_id}`}><Pencil className="h-4 w-4" />Name, tile &amp; icon</Link>
          </Button>
          <Button onClick={() => (rulesChanged ? setConfirmRules(true) : save())} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      {!data.service.is_active && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This bundle is <strong>Inactive</strong>. Set the price and the &quot;Convert to order&quot; service, then switch it Active on the Services page.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Price &amp; booking</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" inputMode="numeric" value={form.price} onChange={(e) => set('price', e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Max visits per slot</Label>
                <Input id="max" inputMode="numeric" value={form.max_per_slot} onChange={(e) => set('max_per_slot', e.target.value.replace(/[^0-9]/g, ''))} />
                <p className="text-xs text-muted-foreground">0 = no limit. A full slot is greyed out in the app.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Convert to order — service</Label>
                <Select value={form.convert_service_id || undefined} onValueChange={(v) => set('convert_service_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose the service whose categories & prices are used" /></SelectTrigger>
                  <SelectContent>
                    {data.convert_services.map((s) => (
                      <SelectItem key={s.service_id} value={String(s.service_id)}>
                        {s.service}{s.is_active ? '' : ' (inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  &quot;Completed — Convert&quot; on a booking creates an order of this service, with the bundle price already paid.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Popup text</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-24 w-48 shrink-0 rounded-lg border border-dashed bg-gray-50 dark:bg-gray-900 overflow-hidden flex items-center justify-center">
                  {bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerUrl} alt="Popup banner" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => { uploadBanner(e.target.files?.[0]); e.target.value = ''; }} />
                  <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImagePlus className="h-4 w-4 mr-2" />}
                    {bannerUrl ? 'Change banner' : 'Upload banner'}
                  </Button>
                  <p className="text-xs text-muted-foreground">Wide image (2:1). Saved right away. Optional.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" value={form.subtitle} maxLength={120} onChange={(e) => set('subtitle', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agree">Agree checkbox text</Label>
                  <Input id="agree" value={form.agree_text} maxLength={120} onChange={(e) => set('agree_text', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button">Book button text</Label>
                  <Input id="button" value={form.button_text} maxLength={40} placeholder={`Book Now · ₹${priceText}`} onChange={(e) => set('button_text', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">&quot;What you get&quot; points</CardTitle>
              <Button size="sm" variant="outline" className="gap-1" disabled={form.points.length >= 12}
                onClick={() => set('points', [...form.points, { icon: 'check', text: '' }])}>
                <Plus className="h-3.5 w-3.5" />Add point
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.points.map((p, i) => (
                <div key={i} className="grid grid-cols-[150px_1fr_auto] gap-2 items-center">
                  <Select value={p.icon} onValueChange={(v) => set('points', form.points.map((x, j) => (j === i ? { ...x, icon: v } : x)))}>
                    <SelectTrigger aria-label="Icon"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.icons.map((name) => {
                        const Icon = ICONS[name]?.icon || Check;
                        return (
                          <SelectItem key={name} value={name}>
                            <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{ICONS[name]?.label || name}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input value={p.text} maxLength={120} aria-label={`Point ${i + 1}`}
                    onChange={(e) => set('points', form.points.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                  <div className="flex">
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move up" onClick={() => set('points', move(form.points, i, i - 1))}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move down" onClick={() => set('points', move(form.points, i, i + 1))}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" aria-label="Remove point" onClick={() => set('points', form.points.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Rules &amp; Terms</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Current T&amp;C version {cfg.terms_version}. Changing a rule creates version {cfg.terms_version + 1} — customers must agree again.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1" disabled={form.rules.length >= 20}
                onClick={() => set('rules', [...form.rules, ''])}>
                <Plus className="h-3.5 w-3.5" />Add rule
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {form.rules.map((r, i) => (
                <div key={i} className="grid grid-cols-[24px_1fr_auto] gap-2 items-start">
                  <span className="pt-2 text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                  <Textarea rows={2} value={r} maxLength={400} aria-label={`Rule ${i + 1}`}
                    onChange={(e) => set('rules', form.rules.map((x, j) => (j === i ? e.target.value : x)))} />
                  <div className="flex">
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move up" onClick={() => set('rules', move(form.rules, i, i - 1))}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move down" onClick={() => set('rules', move(form.rules, i, i + 1))}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" aria-label="Remove rule" onClick={() => set('rules', form.rules.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Change history</CardTitle></CardHeader>
            <CardContent>
              {data.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No changes yet.</p>
              ) : (
                <div className="divide-y">
                  {data.history.map((h) => (
                    <div key={h._id} className="py-2 text-sm grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1">
                      <span className="text-muted-foreground">{format(new Date(h.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                      <span>
                        <span className="font-medium">{h.admin_name || h.admin_email || 'Admin'}</span>
                        <span className="text-muted-foreground"> ({h.admin_role}) · {h.changes.join(' · ')}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live preview of the app popup */}
        <div className="lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">APP POPUP PREVIEW</p>
          <div className="rounded-[28px] border-4 border-gray-800 bg-gray-700 p-0 overflow-hidden">
            <div className="bg-white text-[#101840] rounded-t-2xl mt-16 p-4 space-y-3">
              <div className="h-20 rounded-xl bg-[#E6F2EB] overflow-hidden flex items-center justify-center text-xs text-gray-500">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  'Banner'
                )}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="font-bold">{data.service.home_title || data.service.service}</p>
                  <p className="text-xs text-gray-600">{form.subtitle}</p>
                </div>
                <p className="text-xl font-bold text-[#007F36]">₹{priceText}</p>
              </div>
              <p className="text-[11px] font-bold tracking-wide text-gray-600">WHAT YOU GET</p>
              {form.points.map((p, i) => {
                const Icon = ICONS[p.icon]?.icon || Check;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="h-7 w-7 shrink-0 rounded-md bg-[#E6F2EB] flex items-center justify-center"><Icon className="h-4 w-4 text-[#007F36]" /></span>
                    {p.text || '…'}
                  </div>
                );
              })}
              <div className="rounded-lg bg-[#F5F6FB] p-2 space-y-1">
                <p className="text-[11px] font-bold tracking-wide text-gray-600">RULES &amp; TERMS</p>
                {form.rules.map((r, i) => <p key={i} className="text-[11px] leading-snug">{i + 1}. {r || '…'}</p>)}
              </div>
              <p className="flex items-center gap-2 text-xs"><span className="h-4 w-4 rounded border border-gray-400" />{form.agree_text}</p>
              <div className="rounded-xl bg-[#007F36] text-white text-center text-sm font-semibold py-2.5">
                {form.button_text || `Book Now · ₹${priceText}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmRules} onOpenChange={(o) => !saving && setConfirmRules(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save new Terms version {cfg.terms_version + 1}?</AlertDialogTitle>
            <AlertDialogDescription>
              You changed the rules. Customers who open the popup will see and agree to the new rules. Existing bookings keep
              the rules they agreed to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Back</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); save(); }}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
