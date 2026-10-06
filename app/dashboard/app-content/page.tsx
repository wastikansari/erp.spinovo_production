'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, Loader2, Link2, Shirt, Ban } from 'lucide-react';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn, appContentImageUrl } from '@/lib/utils';
import { getServiceCategories } from '@/lib/api/service';
import { FullServiceCategory } from '@/lib/types/booking';
import {
  AppBanner,
  AppPopup,
  AppContentFields,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  listPopups,
  createPopup,
  updatePopup,
  deletePopup,
  scheduleStatus,
} from '@/lib/api/appContent';
import { ContentFormDialog, BANNER_RATIO, POPUP_RATIO, toLocalInput } from './content-form-dialog';

type Item = AppBanner | AppPopup;

const STATUS_STYLE: Record<ReturnType<typeof scheduleStatus>, { label: string; className: string }> = {
  live: { label: 'Live in app', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
  ended: { label: 'Ended', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  off: { label: 'Off', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

function formValues(item: Item): AppContentFields & { image_url: string } {
  return {
    title: item.title,
    action_type: item.action_type,
    service_id: item.service_id ? String(item.service_id) : '',
    link_url: item.link_url || '',
    is_active: item.is_active,
    start_at: toLocalInput(item.start_at),
    end_at: toLocalInput(item.end_at),
    button_text: 'button_text' in item ? item.button_text : '',
    image_url: item.image_url,
  };
}

function ActionLabel({ item, services }: { item: Item; services: FullServiceCategory[] }) {
  if (item.action_type === 'service') {
    const svc = services.find((s) => s.service_id === item.service_id);
    return (
      <span className="flex items-center gap-1">
        <Shirt className="h-3.5 w-3.5" /> Opens {svc?.service ?? `service #${item.service_id}`}
        {svc && !svc.is_active ? ' (inactive — tap does nothing)' : ''}
      </span>
    );
  }
  if (item.action_type === 'link')
    return (
      <span className="flex items-center gap-1 truncate">
        <Link2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{item.link_url}</span>
      </span>
    );
  return (
    <span className="flex items-center gap-1">
      <Ban className="h-3.5 w-3.5" /> No tap action
    </span>
  );
}

function scheduleText(item: Item): string | null {
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  if (item.start_at && item.end_at) return `${fmt(item.start_at)} → ${fmt(item.end_at)}`;
  if (item.start_at) return `From ${fmt(item.start_at)}`;
  if (item.end_at) return `Until ${fmt(item.end_at)}`;
  return null;
}

export default function AppContentPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('banners');
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [popups, setPopups] = useState<AppPopup[]>([]);
  const [services, setServices] = useState<FullServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ kind: 'banner' | 'popup'; item: Item | null } | null>(null);
  const [toDelete, setToDelete] = useState<{ kind: 'banner' | 'popup'; item: Item } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, p] = await Promise.all([listBanners(), listPopups()]);
    if (b.success && b.data) setBanners(b.data.banners);
    if (p.success && p.data) setPopups(p.data.popups);
    if (!b.success || !p.success)
      toast({ title: 'Could not load', description: (!b.success ? b : p).message, variant: 'destructive' });
    try {
      setServices(await getServiceCategories());
    } catch {
      // Service names are only used for labels/dropdown.
    }
    setOrderDirty(false);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(fields: AppContentFields, image: File | null): Promise<string | null> {
    if (!dialog) return null;
    const { kind, item } = dialog;
    const result =
      kind === 'banner'
        ? item
          ? await updateBanner(item._id, fields, image)
          : await createBanner(fields, image as File)
        : item
          ? await updatePopup(item._id, fields, image)
          : await createPopup(fields, image as File);
    if (!result.success) return result.message;
    toast({ title: `${kind === 'banner' ? 'Banner' : 'Popup'} saved` });
    await load();
    return null;
  }

  async function toggleActive(kind: 'banner' | 'popup', item: Item, value: boolean) {
    setBusyId(item._id);
    const result =
      kind === 'banner'
        ? await updateBanner(item._id, { is_active: value })
        : await updatePopup(item._id, { is_active: value });
    setBusyId(null);
    if (!result.success) {
      toast({ title: 'Not updated', description: result.message, variant: 'destructive' });
      return;
    }
    if (kind === 'popup' && value)
      toast({ title: 'Popup is on', description: 'Any other popup was switched off.' });
    await load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const { kind, item } = toDelete;
    const result = kind === 'banner' ? await deleteBanner(item._id) : await deletePopup(item._id);
    setToDelete(null);
    if (!result.success) {
      toast({ title: 'Not deleted', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: `${kind === 'banner' ? 'Banner' : 'Popup'} deleted` });
    await load();
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
    setOrderDirty(true);
  }

  async function saveOrder() {
    setSavingOrder(true);
    const result = await reorderBanners(banners.map((b) => b._id));
    setSavingOrder(false);
    if (!result.success) {
      toast({ title: 'Order not saved', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Banner order saved — the app shows this order' });
    setOrderDirty(false);
  }

  function renderRow(kind: 'banner' | 'popup', item: Item, index: number, total: number) {
    const status = STATUS_STYLE[scheduleStatus(item)];
    const schedule = scheduleText(item);
    const imageUrl = appContentImageUrl(item.image_url);
    return (
      <div
        key={item._id}
        className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
      >
        <div
          className="shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          style={{
            aspectRatio: String(kind === 'banner' ? BANNER_RATIO : POPUP_RATIO),
            width: kind === 'banner' ? 240 : 96,
          }}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {kind === 'banner' && <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>}
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', status.className)}>
              {status.label}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <ActionLabel item={item} services={services} />
          </div>
          {'button_text' in item && item.button_text && item.action_type !== 'none' && (
            <p className="text-sm text-muted-foreground">Button: “{item.button_text}”</p>
          )}
          {schedule && <p className="text-xs text-muted-foreground">{schedule}</p>}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            Active
            <Switch
              checked={item.is_active}
              disabled={busyId === item._id}
              onCheckedChange={(v) => toggleActive(kind, item, v)}
            />
          </label>
          <div className="flex gap-1">
            {kind === 'banner' && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={index === total - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setDialog({ kind, item })}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={() => setToDelete({ kind, item })}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderSection title="App Banners & Popup" handleRefresh={load} loading={loading} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="banners">Home Banners ({banners.length})</TabsTrigger>
          <TabsTrigger value="popup">App Popup ({popups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Home Banners</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Slides at the top of the app&apos;s Home screen, in this order. Use ↑ ↓ then Save Order.
                  </p>
                </div>
                <div className="flex gap-2">
                  {orderDirty && (
                    <Button size="sm" variant="outline" onClick={saveOrder} disabled={savingOrder}>
                      {savingOrder && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Order
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setDialog({ kind: 'banner', item: null })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : banners.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No banners yet — the app shows its built-in banner until you add one.
                </p>
              ) : (
                banners.map((b, i) => renderRow('banner', b, i, banners.length))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popup">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>App Popup</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Shown on the Home screen every time a customer opens the app. Only one popup can be active.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setDialog({ kind: 'popup', item: null })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Popup
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : popups.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No popups yet.</p>
              ) : (
                popups.map((p, i) => renderRow('popup', p, i, popups.length))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ContentFormDialog
        kind={dialog?.kind ?? 'banner'}
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        initial={dialog?.item ? formValues(dialog.item) : null}
        services={services}
        onSubmit={submit}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {toDelete?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.item.title}” and its image will be removed from the app. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
