'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowDown, ArrowUp, ExternalLink, Loader2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BoxBgStyle, LayoutBlock, LayoutBox, getLayout, saveLayout, updateSection } from '@/lib/api/appShowcase';
import { ColorInput } from '../app-theme/theme-editor';
import { toLocalInput } from '../app-content/content-form-dialog';
import { Choice, NumberInput, Row } from './form-bits';

// Home Layout — one ordered list of everything on the app's Home below the
// header: Banner, Our Services, Your Bookings, the bottom text and every
// showcase section. Built-ins get ON/OFF, schedule and a box (spacing,
// background, radius, border, shadow) here; their inner colours stay in
// App Theme. A showcase row only moves and gets outer spacing here — its
// look, cards and schedule live in its own editor.

const ICONS: Record<string, string> = { banner: '🖼', services: '🧺', bookings: '📦', footer: '🪔', showcase: '✨' };

const THEME_HINT: Record<string, string> = {
  banner: 'Banner images and links: Settings → Mobile Theme → App Banners & Popup.',
  services: 'Tile style and colours: Settings → Mobile Theme → App Theme.',
  bookings: 'Title/link colours: Settings → Mobile Theme → App Theme.',
  footer: 'Text, ornament and colours: Settings → Mobile Theme → App Theme (Home sections).',
};

function blockId(b: LayoutBlock) {
  return b.kind === 'builtin' ? `b:${b.key}` : `s:${b.section_id}`;
}

function status(b: LayoutBlock): { label: string; className: string } {
  if (!b.is_active) return { label: 'Off', className: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (b.kind === 'showcase' && (b.cards ?? 0) === 0)
    return { label: 'No cards', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (!b.live) return { label: 'Scheduled / ended', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'Live in app', className: 'bg-green-100 text-green-700 border-green-200' };
}

function boxStyle(box?: LayoutBox): React.CSSProperties {
  if (!box) return {};
  return {
    paddingTop: box.padding_top / 2,
    paddingBottom: box.padding_bottom / 2,
    paddingLeft: box.padding_left / 2,
    paddingRight: box.padding_right / 2,
    borderRadius: box.radius / 2,
    border: box.border_width > 0 ? `${box.border_width / 2}px solid ${box.border_color}` : undefined,
    boxShadow: box.shadow ? '0 2px 6px rgba(0,0,0,0.15)' : undefined,
    background:
      box.bg_style === 'color'
        ? box.bg_color
        : box.bg_style === 'gradient'
          ? `linear-gradient(${box.gradient_from}, ${box.gradient_to})`
          : undefined,
  };
}

// Half-scale phone sketch of the Home order, spacing and boxes.
function LayoutPreview({ blocks }: { blocks: LayoutBlock[] }) {
  const shown = blocks.filter((b) => b.is_active && (b.kind === 'builtin' || (b.cards ?? 0) > 0));
  return (
    <div className="mx-auto w-[220px] rounded-[22px] border-4 border-gray-800 bg-white p-2 text-[10px] dark:border-gray-600">
      <div className="mb-2 rounded-lg bg-orange-500 px-2 py-3 text-white">Header</div>
      {shown.map((b) => (
        <div key={blockId(b)} style={{ marginTop: b.margin_top / 2, marginBottom: b.margin_bottom / 2 }}>
          <div style={boxStyle(b.box)}>
            <div
              className={cn(
                'rounded-md border border-dashed px-2 py-2 text-gray-600',
                b.kind === 'showcase' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-gray-50'
              )}
            >
              {ICONS[b.kind === 'builtin' ? b.key! : 'showcase']} {b.label}
              {!b.live && <span className="ml-1 text-blue-600">(scheduled)</span>}
            </div>
          </div>
        </div>
      ))}
      <p className="mt-2 text-center text-[9px] text-gray-400">Half scale · off sections left out</p>
    </div>
  );
}

const BG_OPTIONS: { value: BoxBgStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'color', label: 'Colour' },
  { value: 'gradient', label: 'Gradient' },
];

function EditDialog({
  block,
  onClose,
  onApply,
}: {
  block: LayoutBlock;
  onClose: () => void;
  onApply: (b: LayoutBlock) => void;
}) {
  const [b, setB] = useState<LayoutBlock>(block);
  const [startAt, setStartAt] = useState(toLocalInput(block.start_at));
  const [endAt, setEndAt] = useState(toLocalInput(block.end_at));
  const builtin = b.kind === 'builtin';
  const box = b.box;
  const setBox = (patch: Partial<LayoutBox>) => setB((x) => ({ ...x, box: { ...(x.box as LayoutBox), ...patch } }));
  const badDates = Boolean(startAt && endAt && endAt < startAt);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ICONS[builtin ? b.key! : 'showcase']} {b.label}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <div className="divide-y">
            {builtin && b.key === 'services' && !b.is_active && (
              <p className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" /> Our Services is off — customers can&apos;t open a service from Home.
              </p>
            )}
            {builtin && (
              <Row label="Show in app">
                <Switch checked={b.is_active} onCheckedChange={(v) => setB({ ...b, is_active: v })} />
              </Row>
            )}
            <Row label="Space above" hint="Gap before this section">
              <NumberInput value={b.margin_top} min={0} max={200} onChange={(v) => setB({ ...b, margin_top: v })} suffix="px" />
            </Row>
            <Row label="Space below" hint="Gap after this section">
              <NumberInput
                value={b.margin_bottom}
                min={0}
                max={200}
                onChange={(v) => setB({ ...b, margin_bottom: v })}
                suffix="px"
              />
            </Row>

            {builtin && box && (
              <>
                <Row label="Inner padding" hint="Top · bottom · left · right">
                  <NumberInput value={box.padding_top} min={0} max={100} onChange={(v) => setBox({ padding_top: v })} />
                  <NumberInput value={box.padding_bottom} min={0} max={100} onChange={(v) => setBox({ padding_bottom: v })} />
                  <NumberInput value={box.padding_left} min={0} max={100} onChange={(v) => setBox({ padding_left: v })} />
                  <NumberInput value={box.padding_right} min={0} max={100} onChange={(v) => setBox({ padding_right: v })} />
                </Row>
                <Row label="Box background">
                  <Choice value={box.bg_style} options={BG_OPTIONS} onChange={(v) => setBox({ bg_style: v })} />
                </Row>
                {box.bg_style === 'color' && (
                  <Row label="Colour">
                    <ColorInput value={box.bg_color} onChange={(v) => setBox({ bg_color: v })} />
                  </Row>
                )}
                {box.bg_style === 'gradient' && (
                  <Row label="Gradient" hint="Top → bottom">
                    <ColorInput value={box.gradient_from} onChange={(v) => setBox({ gradient_from: v })} />
                    <ColorInput value={box.gradient_to} onChange={(v) => setBox({ gradient_to: v })} />
                  </Row>
                )}
                <Row label="Corner radius">
                  <NumberInput value={box.radius} min={0} max={60} onChange={(v) => setBox({ radius: v })} suffix="px" />
                </Row>
                <Row label="Border">
                  <NumberInput
                    value={box.border_width}
                    min={0}
                    max={6}
                    step={0.5}
                    onChange={(v) => setBox({ border_width: v })}
                    suffix="px"
                  />
                  {box.border_width > 0 && (
                    <ColorInput value={box.border_color} onChange={(v) => setBox({ border_color: v })} />
                  )}
                </Row>
                <Row label="Shadow">
                  <Switch checked={box.shadow} onCheckedChange={(v) => setBox({ shadow: v })} />
                </Row>
                <Row label="Schedule" hint="Empty = always (while on)">
                  <Input type="datetime-local" className="w-52" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="datetime-local" className="w-52" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </Row>
                {badDates && <p className="py-1 text-xs text-red-600">End must be after the start.</p>}
                <p className="pt-2 text-xs text-muted-foreground">{THEME_HINT[b.key!]}</p>
              </>
            )}
            {!builtin && (
              <p className="pt-3 text-sm text-muted-foreground">
                Its look, cards, ON/OFF and schedule are in the section editor.{' '}
                <Link href={`/dashboard/app-showcase/${b.section_id}`} className="text-indigo-600 inline-flex items-center gap-1">
                  Open editor <ExternalLink className="h-3 w-3" />
                </Link>
              </p>
            )}
          </div>

          {builtin && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Box preview</p>
              <div className="rounded-lg border bg-white p-2" style={{ paddingTop: b.margin_top / 2 + 8, paddingBottom: b.margin_bottom / 2 + 8 }}>
                <div style={boxStyle(box)}>
                  <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-xs text-gray-600">
                    {b.label}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={badDates}
            onClick={() =>
              onApply({
                ...b,
                ...(builtin
                  ? {
                      start_at: startAt ? new Date(startAt).toISOString() : null,
                      end_at: endAt ? new Date(endAt).toISOString() : null,
                    }
                  : {}),
              })
            }
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HomeLayoutCard({ reloadKey, onSectionsChanged }: { reloadKey: number; onSectionsChanged: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<LayoutBlock | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getLayout();
    if (r.success && r.data) setBlocks(r.data.blocks);
    else toast({ title: 'Could not load Home layout', description: r.message, variant: 'destructive' });
    setDirty(false);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  function change(next: LayoutBlock[]) {
    setBlocks(next);
    setDirty(true);
  }

  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  }

  async function toggle(b: LayoutBlock, value: boolean) {
    if (b.kind === 'builtin') {
      change(blocks.map((x) => (blockId(x) === blockId(b) ? { ...x, is_active: value } : x)));
      if (b.key === 'services' && !value)
        toast({ title: 'Our Services will be hidden', description: "Customers can't open a service from Home." });
      return;
    }
    // A showcase section's ON/OFF is saved on the section straight away.
    setBusy(blockId(b));
    const r = await updateSection(b.section_id!, { is_active: value });
    setBusy(null);
    if (!r.success) {
      toast({ title: 'Not updated', description: r.message, variant: 'destructive' });
      return;
    }
    setBlocks((xs) => xs.map((x) => (blockId(x) === blockId(b) ? { ...x, is_active: value } : x)));
    if (value && (b.cards ?? 0) === 0)
      toast({ title: 'Section is on', description: 'It has no visible cards yet, so the app still hides it.' });
    onSectionsChanged();
  }

  async function save() {
    setSaving(true);
    const r = await saveLayout(blocks);
    setSaving(false);
    if (!r.success || !r.data) {
      toast({ title: 'Layout not saved', description: r.message, variant: 'destructive' });
      return;
    }
    setBlocks(r.data.blocks);
    setDirty(false);
    toast({ title: 'Home layout saved', description: 'The app picks it up on next Home open.' });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Home Layout</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Everything on the app&apos;s Home below the header, top to bottom (app 1.0.17+). Move with ↑ ↓, switch
              sections on/off, ✎ for spacing and box design. Then Save layout.
            </p>
          </div>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="outline" size="sm" onClick={load} disabled={saving}>
                Discard
              </Button>
            )}
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={save}
              disabled={!dirty || saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save layout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
            <div className="space-y-2">
              {blocks.map((b, i) => {
                const st = status(b);
                const id = blockId(b);
                return (
                  <div
                    key={id}
                    className={cn(
                      'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                      b.kind === 'showcase' ? 'border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20' : 'bg-white dark:bg-gray-900',
                      !b.is_active && 'opacity-60'
                    )}
                  >
                    <span className="w-6 text-sm font-semibold text-gray-500">{i + 1}</span>
                    <span className="text-lg">{ICONS[b.kind === 'builtin' ? b.key! : 'showcase']}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{b.label}</span>
                        <span className="text-xs text-muted-foreground">{b.kind === 'builtin' ? 'built-in' : 'showcase'}</span>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', st.className)}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Space ↑{b.margin_top} ↓{b.margin_bottom}
                        {b.box && b.box.bg_style !== 'none' ? ' · boxed' : ''}
                        {b.kind === 'showcase' ? ` · ${b.cards ?? 0} card${b.cards === 1 ? '' : 's'}` : ''}
                      </p>
                    </div>
                    <Switch
                      checked={b.is_active}
                      disabled={busy === id}
                      onCheckedChange={(v) => toggle(b, v)}
                      aria-label="Show in app"
                    />
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={i === blocks.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing(b)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {b.kind === 'showcase' && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => router.push(`/dashboard/app-showcase/${b.section_id}`)}
                          aria-label="Open section editor"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {dirty && <p className="text-xs text-amber-600">Unsaved changes — press Save layout.</p>}
            </div>
            <LayoutPreview blocks={blocks} />
          </div>
        )}
      </CardContent>

      {editing && (
        <EditDialog
          block={editing}
          onClose={() => setEditing(null)}
          onApply={(nb) => {
            change(blocks.map((x) => (blockId(x) === blockId(nb) ? nb : x)));
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}
