'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2, Pencil, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  POSITION_LABELS,
  ShowcasePosition,
  ShowcaseSection,
  createSection,
  deleteSection,
  duplicateSection,
  listSections,
  sectionStatus,
  updateSection,
} from '@/lib/api/appShowcase';
import { HomeLayoutCard } from './home-layout';

const STATUS_STYLE: Record<ReturnType<typeof sectionStatus>, { label: string; className: string }> = {
  live: { label: 'Live in app', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
  ended: { label: 'Ended', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  off: { label: 'Off', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

const POSITIONS = Object.keys(POSITION_LABELS) as ShowcasePosition[];

function scheduleText(s: ShowcaseSection): string | null {
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  if (s.start_at && s.end_at) return `${fmt(s.start_at)} → ${fmt(s.end_at)}`;
  if (s.start_at) return `From ${fmt(s.start_at)}`;
  if (s.end_at) return `Until ${fmt(s.end_at)}`;
  return null;
}

export default function AppShowcasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [sections, setSections] = useState<ShowcaseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Bumped when sections are added/removed/switched here, so Home Layout reloads.
  const [layoutKey, setLayoutKey] = useState(0);
  const [toDelete, setToDelete] = useState<ShowcaseSection | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState<ShowcasePosition>('after_banner');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await listSections();
    if (r.success && r.data) setSections(r.data.sections);
    else toast({ title: 'Could not load', description: r.message, variant: 'destructive' });
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (newName.trim().length < 2) return;
    setSaving(true);
    const r = await createSection({
      name: newName.trim(),
      position: newPosition,
      heading: { title: newName.trim() },
    });
    setSaving(false);
    if (!r.success || !r.data) {
      toast({ title: 'Not created', description: r.message, variant: 'destructive' });
      return;
    }
    setCreating(false);
    setNewName('');
    router.push(`/dashboard/app-showcase/${r.data.section._id}`);
  }

  async function toggleActive(s: ShowcaseSection, value: boolean) {
    setBusyId(s._id);
    const r = await updateSection(s._id, { is_active: value });
    setBusyId(null);
    if (!r.success) {
      toast({ title: 'Not updated', description: r.message, variant: 'destructive' });
      return;
    }
    if (value && !s.items.some((i) => i.is_active && !i.warning))
      toast({ title: 'Section is on', description: 'It has no visible cards yet, so the app still hides it.' });
    await load();
    setLayoutKey((k) => k + 1);
  }

  async function duplicate(s: ShowcaseSection) {
    setBusyId(s._id);
    const r = await duplicateSection(s._id);
    setBusyId(null);
    if (!r.success) {
      toast({ title: 'Not copied', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Section copied', description: 'The copy is switched off until you turn it on.' });
    await load();
    setLayoutKey((k) => k + 1);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const r = await deleteSection(toDelete._id);
    setToDelete(null);
    if (!r.success) {
      toast({ title: 'Not deleted', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Section deleted' });
    await load();
    setLayoutKey((k) => k + 1);
  }

  function renderRow(s: ShowcaseSection, index: number) {
    const status = STATUS_STYLE[sectionStatus(s)];
    const schedule = scheduleText(s);
    const activeCards = s.items.filter((i) => i.is_active && !i.warning);
    const hidden = s.items.filter((i) => i.warning).length;
    return (
      <div
        key={s._id}
        className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
      >
        <div className="flex shrink-0 gap-1.5">
          {s.items.slice(0, 4).map((i) => {
            const url = appContentImageUrl(i.image_url);
            return (
              <div
                key={i._id}
                className={cn(
                  'h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
                  (!i.is_active || i.warning) && 'opacity-40'
                )}
              >
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={i.category_name} className="h-full w-full object-cover" />
                )}
              </div>
            );
          })}
          {s.items.length === 0 && (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              No cards
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</h3>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {s.heading.show_title && s.heading.title ? `“${s.heading.title}” · ` : ''}
            {activeCards.length} card{activeCards.length === 1 ? '' : 's'} shown
            {s.items.length > activeCards.length ? ` of ${s.items.length}` : ''} ·{' '}
            {s.layout.style === 'grid' ? '2-column grid' : 'Side scroll'}
          </p>
          {hidden > 0 && (
            <p className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {hidden} card{hidden === 1 ? '' : 's'} hidden — service off or
              category deleted
            </p>
          )}
          {schedule && <p className="text-xs text-muted-foreground">{schedule}</p>}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            Active
            <Switch checked={s.is_active} disabled={busyId === s._id} onCheckedChange={(v) => toggleActive(s, v)} />
          </label>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => router.push(`/dashboard/app-showcase/${s._id}`)}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={busyId === s._id}
              onClick={() => duplicate(s)}
              aria-label="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={() => setToDelete(s)}
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
      <HeaderSection
        title="Home Showcase"
        handleRefresh={() => {
          load();
          setLayoutKey((k) => k + 1);
        }}
        loading={loading}
      />

      <HomeLayoutCard reloadKey={layoutKey} onSectionsChanged={load} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Home Showcase sections</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rows of category cards on the app&apos;s Home screen (app 1.0.17+). Each section has its own look, cards
                and schedule. Where it sits on Home is set in Home Layout above.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Section
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : sections.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No sections yet. Create one, add cards, then switch it on.
            </p>
          ) : (
            <div className="space-y-3">{sections.map((s, i) => renderRow(s, i))}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={creating} onOpenChange={(o) => !saving && setCreating(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sc-name">Name</Label>
              <Input
                id="sc-name"
                value={newName}
                maxLength={60}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Diwali Specials"
              />
              <p className="text-xs text-muted-foreground">Also used as the first title — you can change it after.</p>
            </div>
            <div className="space-y-2">
              <Label>First placed on Home</Label>
              <Select value={newPosition} onValueChange={(v) => setNewPosition(v as ShowcasePosition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {POSITION_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">It starts switched off. Move it anywhere later in Home Layout.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={create}
              disabled={saving || newName.trim().length < 2}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create &amp; edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.name}”, its {toDelete?.items.length ?? 0} cards and their images will be removed from the app.
              Services and prices are not touched. This can&apos;t be undone.
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
