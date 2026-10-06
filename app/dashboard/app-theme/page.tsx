'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Copy, Pencil, Power, RotateCcw, Sparkles, Trash2, Zap } from 'lucide-react';
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
  AppTheme,
  listThemes,
  applyTheme,
  duplicateTheme,
  resetTheme,
  deleteTheme,
  updateTheme,
} from '@/lib/api/appTheme';
import { HomePreview } from './theme-preview';
import { ThemeEditor } from './theme-editor';

type Status = 'live' | 'scheduled' | 'waiting' | 'ended' | 'off';

function statusOf(t: AppTheme, liveId: string): Status {
  if (t._id === liveId) return 'live';
  if (!t.is_active) return 'off';
  const now = Date.now();
  if (t.start_at && new Date(t.start_at).getTime() > now) return 'scheduled';
  if (t.end_at && new Date(t.end_at).getTime() < now) return 'ended';
  // Active but another theme wins right now (e.g. a scheduled one).
  return 'waiting';
}

const STATUS: Record<Status, { label: string; className: string }> = {
  live: { label: '● Live in app now', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
  waiting: { label: 'On — another theme has priority', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  ended: { label: 'Schedule ended', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  off: { label: 'Off', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
};

function scheduleText(t: AppTheme): string | null {
  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  if (t.start_at && t.end_at) return `${fmt(t.start_at)} → ${fmt(t.end_at)}`;
  if (t.start_at) return `From ${fmt(t.start_at)}`;
  if (t.end_at) return `Until ${fmt(t.end_at)}`;
  return null;
}

export default function AppThemePage() {
  const { toast } = useToast();
  const [themes, setThemes] = useState<AppTheme[]>([]);
  const [liveId, setLiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AppTheme | null>(null);
  const [toDelete, setToDelete] = useState<AppTheme | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listThemes();
    if (result.success && result.data) {
      setThemes(result.data.themes);
      setLiveId(result.data.live_theme_id);
    } else {
      toast({ title: 'Could not load themes', description: result.message, variant: 'destructive' });
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

  const liveTheme = themes.find((t) => t._id === liveId);

  return (
    <div className="space-y-6">
      <HeaderSection title="App Theme" handleRefresh={load} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Festive look for the app&apos;s Splash & Home screens
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <strong>Apply now</strong> switches the app to a theme until you change it. A <strong>schedule</strong>{' '}
            (Edit → dates) turns a theme on and off by itself, e.g. Navratri for 9 days, then back to Default.
            Customers see a change the next time they open the app.
          </p>
          {liveTheme && (
            <p className="text-sm">
              Live now: <strong>{liveTheme.name}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading && themes.length === 0 ? (
            <p className="text-muted-foreground">Loading themes…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {themes.map((t) => {
                const status = statusOf(t, liveId);
                const schedule = scheduleText(t);
                const busy = busyId === t._id;
                return (
                  <div
                    key={t._id}
                    className={cn(
                      'flex flex-col gap-4 rounded-xl border bg-white p-4 dark:bg-gray-900',
                      status === 'live' ? 'border-green-400 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</h3>
                        <p className="text-xs text-muted-foreground">{t.preset_key ? 'Built-in' : 'Custom'}</p>
                      </div>
                      <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', STATUS[status].className)}>
                        {STATUS[status].label}
                      </span>
                    </div>

                    <div className="flex justify-center rounded-lg bg-gray-50 py-3 dark:bg-gray-800">
                      <div className="origin-top scale-[0.8] -mb-16">
                        <HomePreview theme={t} />
                      </div>
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
                          onClick={() => run(t._id, () => applyTheme(t._id), `${t.name} is now live in the app`)}
                        >
                          <Zap className="mr-1.5 h-4 w-4" /> Apply now
                        </Button>
                      )}
                      {t.is_active && t.preset_key !== 'default' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            run(
                              t._id,
                              () => updateTheme(t._id, { is_active: false, start_at: null, end_at: null }),
                              `${t.name} switched off`
                            )
                          }
                        >
                          <Power className="mr-1.5 h-4 w-4" /> Turn off
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(t)}>
                        <Pencil className="mr-1.5 h-4 w-4" /> Edit / Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => run(t._id, () => duplicateTheme(t._id), 'Copy created — edit it to make your own theme')}
                        title="Make an editable copy (e.g. for Holi or Ganesh Chaturthi)"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {t.preset_key && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => run(t._id, () => resetTheme(t._id), `${t.name} reset to original`)}
                          title="Reset colors and effects to the original"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {!t.preset_key && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={busy}
                          onClick={() => setToDelete(t)}
                          title="Delete"
                        >
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

      <ThemeEditor theme={editing} open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} onSaved={load} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This custom theme will be removed. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                const t = toDelete;
                setToDelete(null);
                if (t) run(t._id, () => deleteTheme(t._id), 'Theme deleted');
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
