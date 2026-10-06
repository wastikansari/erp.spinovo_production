'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Copy, PanelBottom, Pencil, Power, RotateCcw, Trash2, Zap } from 'lucide-react';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  AppNavBar,
  listNavBars,
  applyNavBar,
  duplicateNavBar,
  resetNavBar,
  deleteNavBar,
  updateNavBar,
} from '@/lib/api/appNavBar';
import { NavBarPreview } from './nav-bar-preview';
import { NavBarEditor } from './nav-bar-editor';

type Status = 'live' | 'scheduled' | 'waiting' | 'ended' | 'off';

function statusOf(b: AppNavBar, liveId: string): Status {
  if (b._id === liveId) return 'live';
  if (!b.is_active) return 'off';
  const now = Date.now();
  if (b.start_at && new Date(b.start_at).getTime() > now) return 'scheduled';
  if (b.end_at && new Date(b.end_at).getTime() < now) return 'ended';
  return 'waiting';
}

const STATUS: Record<Status, { label: string; className: string }> = {
  live: { label: '● Live in app now', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
  waiting: { label: 'On — another bar has priority', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  ended: { label: 'Schedule ended', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  off: { label: 'Off', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

function scheduleText(b: AppNavBar): string | null {
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  if (b.start_at && b.end_at) return `${fmt(b.start_at)} → ${fmt(b.end_at)}`;
  if (b.start_at) return `From ${fmt(b.start_at)}`;
  if (b.end_at) return `Until ${fmt(b.end_at)}`;
  return null;
}

export default function AppNavBarPage() {
  const { toast } = useToast();
  const [bars, setBars] = useState<AppNavBar[]>([]);
  const [liveId, setLiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AppNavBar | null>(null);
  const [toDelete, setToDelete] = useState<AppNavBar | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listNavBars();
    if (result.success && result.data) {
      setBars(result.data.bars);
      setLiveId(result.data.live_bar_id);
    } else {
      toast({ title: 'Could not load bottom bars', description: result.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id: string, action: () => Promise<{ success: boolean; message: string }>, ok: string) {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (!result.success) {
      toast({ title: 'Not done', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: ok });
    await load();
  }

  return (
    <div className="space-y-6">
      <HeaderSection title="Bottom Bar" handleRefresh={load} loading={loading} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelBottom className="h-5 w-5" />
            The app&apos;s bottom navigation bar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a design, change its colors and icons, then <strong>Apply now</strong> (or schedule it). Shown on
            the Home, Booking and Account tabs. A live App Theme can recolor it with its festive colors, or use its
            own bar.
          </p>
        </CardHeader>
        <CardContent>
          {loading && bars.length === 0 ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {bars.map((b) => {
                const status = statusOf(b, liveId);
                const schedule = scheduleText(b);
                const busy = busyId === b._id;
                return (
                  <div
                    key={b._id}
                    className={cn(
                      'flex flex-col gap-4 rounded-xl border bg-white p-4 dark:bg-gray-900',
                      status === 'live' ? 'border-green-400 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.preset_key ? 'Built-in design' : 'Custom'}</p>
                      </div>
                      <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', STATUS[status].className)}>
                        {STATUS[status].label}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <NavBarPreview bar={b} />
                    </div>
                    {schedule && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" /> {schedule}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2">
                      {status !== 'live' && (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          disabled={busy}
                          onClick={() => run(b._id, () => applyNavBar(b._id), `${b.name} is now the app's bottom bar`)}
                        >
                          <Zap className="mr-1.5 h-4 w-4" /> Apply now
                        </Button>
                      )}
                      {b.is_active && b.preset_key !== 'floating' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            run(b._id, () => updateNavBar(b._id, { is_active: false, start_at: null, end_at: null }), `${b.name} switched off`)
                          }
                        >
                          <Power className="mr-1.5 h-4 w-4" /> Turn off
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(b)}>
                        <Pencil className="mr-1.5 h-4 w-4" /> Edit / Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        title="Make an editable copy"
                        onClick={() => run(b._id, () => duplicateNavBar(b._id), 'Copy created')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {b.preset_key ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          title="Reset to original"
                          onClick={() => run(b._id, () => resetNavBar(b._id), `${b.name} reset to original`)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={busy} title="Delete" onClick={() => setToDelete(b)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NavBarEditor bar={editing} open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} onSaved={load} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This custom bottom bar will be removed. Themes using it fall back to the live bar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                const b = toDelete;
                setToDelete(null);
                if (b) run(b._id, () => deleteNavBar(b._id), 'Bottom bar deleted');
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
