'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CatalogService,
  ItemFields,
  SIZE_PRESETS,
  LINE_LABELS,
  POSITION_LABELS,
  SectionPatch,
  ShowcaseItem,
  ShowcasePosition,
  ShowcaseSection,
  createItem,
  deleteItem,
  getCatalog,
  getSection,
  removeBackground,
  reorderItems,
  sectionStatus,
  updateItem,
  updateSection,
  uploadBackground,
} from '@/lib/api/appShowcase';
import { ColorInput } from '../../app-theme/theme-editor';
import { toLocalInput } from '../../app-content/content-form-dialog';
import { ShowcasePreview } from '../showcase-preview';
import { CardDialog } from '../card-dialog';
import { Choice, NumberInput, Row, WeightSelect } from '../form-bits';

export default function ShowcaseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const bgInput = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ShowcaseSection | null>(null);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [turningOn, setTurningOn] = useState(false);
  const [bgBusy, setBgBusy] = useState(false);
  const [cardDialog, setCardDialog] = useState<{ item: ShowcaseItem | null } | null>(null);
  const [cardToDelete, setCardToDelete] = useState<ShowcaseItem | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([getSection(id), getCatalog()]);
    if (s.success && s.data) {
      setDraft(s.data.section);
      setStartAt(toLocalInput(s.data.section.start_at));
      setEndAt(toLocalInput(s.data.section.end_at));
      setDirty(false);
      setOrderDirty(false);
    } else toast({ title: 'Could not load', description: s.message, variant: 'destructive' });
    if (c.success && c.data) setCatalog(c.data.services);
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Warn before closing the tab with unsaved design changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (loading && !draft) return <p className="text-muted-foreground">Loading…</p>;
  if (!draft)
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Section not found.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/app-showcase')}>
          Back
        </Button>
      </div>
    );

  const section = draft;

  // Edit one style group locally (saved with "Save changes").
  function patch<K extends keyof ShowcaseSection>(key: K, value: Partial<ShowcaseSection[K]> | ShowcaseSection[K]) {
    setDraft((d) =>
      d
        ? {
            ...d,
            [key]:
              value && typeof value === 'object' && !Array.isArray(value)
                ? { ...(d[key] as object), ...(value as object) }
                : value,
          }
        : d
    );
    setDirty(true);
  }

  // Card/background calls return the saved section — keep unsaved design edits.
  function takeServer(saved: ShowcaseSection, fields: (keyof ShowcaseSection)[]) {
    setDraft((d) => {
      if (!d) return saved;
      const next = { ...d };
      for (const f of fields) (next as Record<string, unknown>)[f] = saved[f];
      return next;
    });
  }

  async function save() {
    if (startAt && endAt && endAt < startAt) {
      toast({ title: 'Not saved', description: 'End date must be after the start date.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    // image_url is left out — it changes only through its own upload.
    const { style, color, gradient_from, gradient_to, radius } = section.background;
    const background = { style, color, gradient_from, gradient_to, radius };
    const body: SectionPatch = {
      name: section.name.trim(),
      is_active: section.is_active,
      position: section.position,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      heading: section.heading,
      background,
      layout: section.layout,
      card: section.card,
      add_button: section.add_button,
      badge: section.badge,
      text: section.text,
      price_row: section.price_row,
      lines: section.lines,
    };
    const r = await updateSection(section._id, body);
    setSaving(false);
    if (!r.success || !r.data) {
      toast({ title: 'Not saved', description: r.message, variant: 'destructive' });
      return;
    }
    // Keep the on-screen card order (it may have an unsaved ↑↓ change).
    const saved = r.data.section;
    setDraft((d) => (d ? { ...saved, items: d.items } : saved));
    setDirty(false);
    toast({ title: 'Section saved', description: section.is_active ? 'The app picks it up on next Home open.' : undefined });
  }

  async function submitCard(fields: ItemFields, image: File | null): Promise<string | null> {
    const editing = cardDialog?.item;
    const r = editing
      ? await updateItem(section._id, editing._id, fields, image)
      : await createItem(section._id, fields, image as File);
    if (!r.success || !r.data) return r.message;
    takeServer(r.data.section, ['items']);
    toast({ title: editing ? 'Card saved' : 'Card added' });
    return null;
  }

  async function toggleCard(item: ShowcaseItem, value: boolean) {
    const r = await updateItem(section._id, item._id, { is_active: value });
    if (!r.success || !r.data) {
      toast({ title: 'Not updated', description: r.message, variant: 'destructive' });
      return;
    }
    takeServer(r.data.section, ['items']);
  }

  async function confirmDeleteCard() {
    if (!cardToDelete) return;
    const r = await deleteItem(section._id, cardToDelete._id);
    setCardToDelete(null);
    if (!r.success || !r.data) {
      toast({ title: 'Not deleted', description: r.message, variant: 'destructive' });
      return;
    }
    takeServer(r.data.section, ['items']);
    toast({ title: 'Card deleted' });
  }

  function moveCard(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= section.items.length) return;
    const items = [...section.items];
    [items[index], items[target]] = [items[target], items[index]];
    setDraft({ ...section, items });
    setOrderDirty(true);
  }

  async function saveCardOrder() {
    const r = await reorderItems(section._id, section.items.map((i) => i._id));
    if (!r.success || !r.data) {
      toast({ title: 'Order not saved', description: r.message, variant: 'destructive' });
      return;
    }
    takeServer(r.data.section, ['items']);
    setOrderDirty(false);
    toast({ title: 'Card order saved' });
  }

  async function pickBackground(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size > 10 * 1024 * 1024) {
      toast({ title: 'Image must be PNG, JPG or WEBP under 10 MB', variant: 'destructive' });
      return;
    }
    setBgBusy(true);
    const r = await uploadBackground(section._id, file);
    setBgBusy(false);
    if (!r.success || !r.data) {
      toast({ title: 'Not uploaded', description: r.message, variant: 'destructive' });
      return;
    }
    takeServer(r.data.section, ['background']);
    toast({ title: 'Background image saved' });
  }

  async function clearBackground() {
    setBgBusy(true);
    const r = await removeBackground(section._id);
    setBgBusy(false);
    if (r.success && r.data) takeServer(r.data.section, ['background']);
  }

  // The banner's one-tap switch — saved at once, other unsaved edits stay.
  async function turnOn() {
    setTurningOn(true);
    const r = await updateSection(section._id, { is_active: true });
    setTurningOn(false);
    if (!r.success || !r.data) {
      toast({ title: 'Not updated', description: r.message, variant: 'destructive' });
      return;
    }
    takeServer(r.data.section, ['is_active']);
    toast({ title: 'Section is on', description: 'The app picks it up on next Home open.' });
  }

  function moveLine(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= section.lines.length) return;
    const lines = [...section.lines];
    [lines[index], lines[target]] = [lines[target], lines[index]];
    patch('lines', lines);
  }

  const status = sectionStatus({
    is_active: section.is_active,
    start_at: startAt ? new Date(startAt).toISOString() : null,
    end_at: endAt ? new Date(endAt).toISOString() : null,
  });
  const { heading, background, layout, card, add_button: btn, badge, text, price_row } = section;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/app-showcase')} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{section.name || 'Section'}</h1>
            <p className="text-xs text-muted-foreground">
              {POSITION_LABELS[section.position]} ·{' '}
              {status === 'live' ? 'Live in app' : status === 'scheduled' ? 'Scheduled' : status === 'ended' ? 'Ended' : 'Off'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
          <Button variant="outline" onClick={load} disabled={saving}>
            {dirty ? 'Discard' : 'Refresh'}
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={save} disabled={saving || !dirty}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save changes
          </Button>
        </div>
      </div>

      {!section.is_active && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            This section is OFF — it is not shown in the app, even with cards switched on.
          </span>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={turnOn} disabled={turningOn}>
            {turningOn && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Turn ON
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        <Tabs defaultValue="cards">
          <TabsList>
            <TabsTrigger value="cards">Cards ({section.items.length})</TabsTrigger>
            <TabsTrigger value="heading">Heading &amp; placement</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
          </TabsList>

          {/* ── CARDS ── */}
          <TabsContent value="cards">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Cards</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Each card is one existing category. Card changes save straight away. Showing the first{' '}
                      {layout.max_cards} active cards.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {orderDirty && (
                      <Button size="sm" variant="outline" onClick={saveCardOrder}>
                        Save Order
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => setCardDialog({ item: null })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.items.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No cards yet.</p>
                )}
                {section.items.map((item, i) => {
                  const url = appContentImageUrl(item.image_url);
                  return (
                    <div
                      key={item._id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-2.5',
                        (!item.is_active || item.warning) && 'bg-gray-50 dark:bg-gray-900'
                      )}
                    >
                      <span className="w-6 text-center text-sm font-semibold text-gray-500">{i + 1}</span>
                      <div className={cn('h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100', !item.is_active && 'opacity-40')}>
                        {url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.custom_name || item.category_name || `Category #${item.category_id}`}
                          {item.badge_text && (
                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              {item.badge_text}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.service_name || `Service #${item.service_id}`}
                          {item.custom_name && item.category_name ? ` · ${item.category_name}` : ''}
                          {item.price !== '' ? ` · ₹${item.price}` : ''}
                          {item.mrp ? ` (MRP ₹${item.mrp})` : ''}
                        </p>
                        {item.warning && (
                          <p className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> {item.warning}
                          </p>
                        )}
                      </div>
                      <Switch checked={item.is_active} onCheckedChange={(v) => toggleCard(item, v)} aria-label="Show card" />
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" disabled={i === 0} onClick={() => moveCard(i, -1)} aria-label="Move up">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={i === section.items.length - 1}
                          onClick={() => moveCard(i, 1)}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCardDialog({ item })} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => setCardToDelete(item)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HEADING & PLACEMENT ── */}
          <TabsContent value="heading">
            <Card>
              <CardContent className="divide-y pt-4">
                <Row label="Section name" hint="ERP only">
                  <Input
                    className="max-w-sm"
                    value={section.name}
                    maxLength={60}
                    onChange={(e) => {
                      setDraft({ ...section, name: e.target.value });
                      setDirty(true);
                    }}
                  />
                </Row>
                <Row label="Show in app">
                  <Switch
                    checked={section.is_active}
                    onCheckedChange={(v) => {
                      setDraft({ ...section, is_active: v });
                      setDirty(true);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Saved with “Save changes”.</span>
                </Row>
                <Row label="Where on Home">
                  <Select
                    value={section.position}
                    onValueChange={(v) => {
                      setDraft({ ...section, position: v as ShowcasePosition });
                      setDirty(true);
                    }}
                  >
                    <SelectTrigger className="w-60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POSITION_LABELS) as ShowcasePosition[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {POSITION_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Schedule" hint="Optional — empty = no limit">
                  <Input
                    type="datetime-local"
                    className="w-56"
                    value={startAt}
                    onChange={(e) => {
                      setStartAt(e.target.value);
                      setDirty(true);
                    }}
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    type="datetime-local"
                    className="w-56"
                    value={endAt}
                    onChange={(e) => {
                      setEndAt(e.target.value);
                      setDirty(true);
                    }}
                  />
                </Row>
                <Row label="Title">
                  <Input
                    className="max-w-sm"
                    value={heading.title}
                    maxLength={40}
                    onChange={(e) => patch('heading', { title: e.target.value })}
                    placeholder="Festive Packs"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={heading.show_title} onCheckedChange={(v) => patch('heading', { show_title: v })} /> Show
                  </label>
                </Row>
                <Row label="Title style">
                  <ColorInput value={heading.title_color} onChange={(v) => patch('heading', { title_color: v })} />
                  <NumberInput value={heading.title_size} min={12} max={32} suffix="size" onChange={(v) => patch('heading', { title_size: v })} />
                </Row>
                <Row label="Subtitle">
                  <Input
                    className="max-w-sm"
                    value={heading.subtitle}
                    maxLength={80}
                    onChange={(e) => patch('heading', { subtitle: e.target.value })}
                    placeholder="Get your home celebration-ready!"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={heading.show_subtitle} onCheckedChange={(v) => patch('heading', { show_subtitle: v })} /> Show
                  </label>
                </Row>
                <Row label="Subtitle style">
                  <ColorInput value={heading.subtitle_color} onChange={(v) => patch('heading', { subtitle_color: v })} />
                  <NumberInput
                    value={heading.subtitle_size}
                    min={10}
                    max={22}
                    suffix="size"
                    onChange={(v) => patch('heading', { subtitle_size: v })}
                  />
                </Row>
                <Row label="Alignment">
                  <Choice
                    value={heading.align}
                    onChange={(v) => patch('heading', { align: v })}
                    options={[
                      { value: 'center', label: 'Center' },
                      { value: 'left', label: 'Left' },
                    ]}
                  />
                </Row>
                <Row label="Ornament" hint="Beside the title">
                  <Choice
                    value={heading.ornament}
                    onChange={(v) => patch('heading', { ornament: v })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'diamond', label: '◇◆' },
                      { value: 'line_dot', label: '—•' },
                    ]}
                  />
                  {heading.ornament !== 'none' && (
                    <ColorInput value={heading.ornament_color} onChange={(v) => patch('heading', { ornament_color: v })} />
                  )}
                </Row>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DESIGN ── */}
          <TabsContent value="design" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layout</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Layout">
                  <Choice
                    value={layout.style}
                    onChange={(v) => patch('layout', { style: v })}
                    options={[
                      { value: 'scroll', label: 'Side scroll' },
                      { value: 'grid', label: '2-column grid' },
                    ]}
                  />
                </Row>
                {layout.style === 'scroll' && (
                  <Row label="Card width" hint="Small 130 · Medium 160 · Large 200 px">
                    <Choice
                      value={layout.card_width}
                      onChange={(v) => patch('layout', { card_width: v })}
                      options={[
                        { value: 's', label: 'Small' },
                        { value: 'm', label: 'Medium' },
                        { value: 'l', label: 'Large' },
                        { value: 'custom', label: 'Custom' },
                      ]}
                    />
                    {layout.card_width === 'custom' && (
                      <NumberInput
                        value={layout.card_width_px}
                        min={100}
                        max={260}
                        suffix="px wide"
                        onChange={(v) => patch('layout', { card_width_px: v })}
                      />
                    )}
                  </Row>
                )}
                <Row label="Spacing">
                  <NumberInput value={layout.gap} min={4} max={24} suffix="gap between cards" onChange={(v) => patch('layout', { gap: v })} />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={card.padding === null}
                      onCheckedChange={(auto) => patch('card', { padding: auto ? null : 6 })}
                    />
                    Auto card padding
                  </label>
                  {card.padding !== null && (
                    <NumberInput value={card.padding} min={0} max={16} suffix="card padding" onChange={(v) => patch('card', { padding: v })} />
                  )}
                </Row>
                <Row label="Image shape" hint="Upload images in this shape">
                  <Choice
                    value={layout.image_ratio}
                    onChange={(v) => patch('layout', { image_ratio: v })}
                    options={[
                      { value: '1:1', label: 'Square 1:1' },
                      { value: '4:3', label: 'Wide 4:3' },
                      { value: '3:4', label: 'Tall 3:4' },
                    ]}
                  />
                </Row>
                <Row label="Max cards">
                  <NumberInput value={layout.max_cards} min={1} max={20} onChange={(v) => patch('layout', { max_cards: v })} />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sizes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Start from a preset, then fine-tune any size below. Presets change only sizes — never colours or text.
                </p>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Preset">
                  {(Object.keys(SIZE_PRESETS) as (keyof typeof SIZE_PRESETS)[]).map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="capitalize"
                      onClick={() => {
                        const p = SIZE_PRESETS[key];
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                layout: { ...d.layout, ...p.layout },
                                add_button: { ...d.add_button, ...p.add_button },
                                badge: { ...d.badge, ...p.badge },
                                text: { ...d.text, ...p.text },
                              }
                            : d
                        );
                        setDirty(true);
                      }}
                    >
                      {key}
                    </Button>
                  ))}
                </Row>
                <Row label="Price">
                  <NumberInput value={text.price_size} min={12} max={30} suffix="size" onChange={(v) => patch('text', { price_size: v })} />
                  <WeightSelect value={text.price_weight} onChange={(v) => patch('text', { price_weight: v })} />
                </Row>
                <Row label="MRP & % OFF">
                  <NumberInput value={text.mrp_size} min={9} max={20} suffix="MRP" onChange={(v) => patch('text', { mrp_size: v })} />
                  <NumberInput value={text.off_size} min={8} max={16} suffix="% OFF" onChange={(v) => patch('text', { off_size: v })} />
                </Row>
                <Row label="Name">
                  <NumberInput value={text.name_size} min={11} max={22} suffix="size" onChange={(v) => patch('text', { name_size: v })} />
                  <WeightSelect value={text.name_weight} onChange={(v) => patch('text', { name_weight: v })} />
                  <Choice
                    value={String(text.name_max_lines) as '1' | '2' | '3'}
                    onChange={(v) => patch('text', { name_max_lines: Number(v) })}
                    options={[
                      { value: '1', label: '1 line' },
                      { value: '2', label: '2 lines' },
                      { value: '3', label: '3 lines' },
                    ]}
                  />
                </Row>
                <Row label="Duration line">
                  <NumberInput value={text.duration_size} min={9} max={18} suffix="size" onChange={(v) => patch('text', { duration_size: v })} />
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={text.show_duration_icon} onCheckedChange={(v) => patch('text', { show_duration_icon: v })} />
                    ⏱ icon
                  </label>
                </Row>
                <Row label="Extra text">
                  <NumberInput value={text.extra_size} min={9} max={18} suffix="size" onChange={(v) => patch('text', { extra_size: v })} />
                </Row>
                <Row label="ADD button size" hint="The − 1 + stepper is the same size">
                  <NumberInput value={btn.width} min={40} max={160} suffix="min width" onChange={(v) => patch('add_button', { width: v })} />
                  <NumberInput value={btn.height} min={24} max={48} suffix="height" onChange={(v) => patch('add_button', { height: v })} />
                  <NumberInput value={btn.font_size} min={10} max={20} suffix="text" onChange={(v) => patch('add_button', { font_size: v })} />
                  <NumberInput value={btn.radius} min={0} max={24} suffix="corner" onChange={(v) => patch('add_button', { radius: v })} />
                  <NumberInput
                    value={btn.border_width}
                    min={0}
                    max={4}
                    step={0.5}
                    suffix="border"
                    onChange={(v) => patch('add_button', { border_width: v })}
                  />
                </Row>
                <Row label="Badge size">
                  <NumberInput value={badge.font_size} min={8} max={16} suffix="text" onChange={(v) => patch('badge', { font_size: v })} />
                  <NumberInput value={badge.padding_h} min={2} max={16} suffix="side space" onChange={(v) => patch('badge', { padding_h: v })} />
                  <NumberInput value={badge.padding_v} min={0} max={8} suffix="top/bottom" onChange={(v) => patch('badge', { padding_v: v })} />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lines under the image</CardTitle>
                <p className="text-sm text-muted-foreground">Switch each line on/off and set the order with ↑ ↓.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.lines.map((line, i) => (
                  <div key={line.key} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        patch(
                          'lines',
                          section.lines.map((l) => (l.key === line.key ? { ...l, show: !l.show } : l))
                        )
                      }
                      aria-label={line.show ? 'Hide' : 'Show'}
                    >
                      {line.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <span className={cn('flex-1 text-sm', !line.show && 'text-muted-foreground line-through')}>
                      {LINE_LABELS[line.key]}
                    </span>
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={i === 0} onClick={() => moveLine(i, -1)} aria-label="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={i === section.lines.length - 1}
                      onClick={() => moveLine(i, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={price_row.show_mrp} onCheckedChange={(v) => patch('price_row', { show_mrp: v })} />
                    Crossed-out MRP
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={price_row.show_off} onCheckedChange={(v) => patch('price_row', { show_off: v })} />
                    “% OFF” tag
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Text colours</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Price">
                  <ColorInput value={text.price_color} onChange={(v) => patch('text', { price_color: v })} />
                </Row>
                <Row label="Name">
                  <ColorInput value={text.name_color} onChange={(v) => patch('text', { name_color: v })} />
                </Row>
                <Row label="MRP / other lines">
                  <ColorInput value={text.mrp_color} label="MRP" onChange={(v) => patch('text', { mrp_color: v })} />
                  <ColorInput value={text.line_color} label="Duration & extra" onChange={(v) => patch('text', { line_color: v })} />
                </Row>
                <Row label="% OFF tag">
                  <ColorInput value={text.off_bg_color} label="Background" onChange={(v) => patch('text', { off_bg_color: v })} />
                  <ColorInput value={text.off_text_color} label="Text" onChange={(v) => patch('text', { off_text_color: v })} />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Card &amp; buttons</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Card">
                  <ColorInput value={card.bg_color} label="Background" onChange={(v) => patch('card', { bg_color: v })} />
                  <NumberInput value={card.radius} min={0} max={32} suffix="corner" onChange={(v) => patch('card', { radius: v })} />
                  <NumberInput value={card.image_radius} min={0} max={32} suffix="image corner" onChange={(v) => patch('card', { image_radius: v })} />
                </Row>
                <Row label="Border & shadow">
                  <NumberInput value={card.border_width} min={0} max={4} suffix="border" onChange={(v) => patch('card', { border_width: v })} />
                  {card.border_width > 0 && <ColorInput value={card.border_color} onChange={(v) => patch('card', { border_color: v })} />}
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={card.shadow} onCheckedChange={(v) => patch('card', { shadow: v })} /> Shadow
                  </label>
                </Row>
                <Row label="ADD button" hint="Size is under Sizes. The − 1 + stepper uses the same look.">
                  <Input
                    className="w-24"
                    value={btn.text}
                    maxLength={10}
                    onChange={(e) => patch('add_button', { text: e.target.value })}
                  />
                  <Choice
                    value={btn.position}
                    onChange={(v) => patch('add_button', { position: v })}
                    options={[
                      { value: 'on_image', label: 'On image' },
                      { value: 'below', label: 'Below text' },
                    ]}
                  />
                </Row>
                <Row label="ADD colours">
                  <ColorInput value={btn.bg_color} label="Fill" onChange={(v) => patch('add_button', { bg_color: v })} />
                  <ColorInput value={btn.border_color} label="Border" onChange={(v) => patch('add_button', { border_color: v })} />
                  <ColorInput value={btn.text_color} label="Text" onChange={(v) => patch('add_button', { text_color: v })} />
                </Row>
                <Row label="Badge colours">
                  <ColorInput value={badge.bg_color} label="Fill" onChange={(v) => patch('badge', { bg_color: v })} />
                  <ColorInput value={badge.text_color} label="Text" onChange={(v) => patch('badge', { text_color: v })} />
                </Row>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Section background</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <Row label="Background">
                  <Choice
                    value={background.style}
                    onChange={(v) => {
                      if (v === 'image' && !background.image_url) {
                        bgInput.current?.click();
                        return;
                      }
                      patch('background', { style: v });
                    }}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'color', label: 'Colour' },
                      { value: 'gradient', label: 'Gradient' },
                      { value: 'image', label: 'Image' },
                    ]}
                  />
                </Row>
                {background.style === 'color' && (
                  <Row label="Colour">
                    <ColorInput value={background.color} onChange={(v) => patch('background', { color: v })} />
                  </Row>
                )}
                {background.style === 'gradient' && (
                  <Row label="Gradient" hint="Top → bottom">
                    <ColorInput value={background.gradient_from} onChange={(v) => patch('background', { gradient_from: v })} />
                    <ColorInput value={background.gradient_to} onChange={(v) => patch('background', { gradient_to: v })} />
                  </Row>
                )}
                {background.style === 'image' && (
                  <Row label="Image" hint="Wide image, ~1440 px. Uploads straight away.">
                    <Button variant="outline" size="sm" disabled={bgBusy} onClick={() => bgInput.current?.click()}>
                      {bgBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImagePlus className="h-4 w-4 mr-2" />}
                      Replace image
                    </Button>
                    <Button variant="ghost" size="sm" disabled={bgBusy} onClick={clearBackground}>
                      Remove
                    </Button>
                  </Row>
                )}
                {background.style !== 'none' && (
                  <Row label="Corner">
                    <NumberInput value={background.radius} min={0} max={40} onChange={(v) => patch('background', { radius: v })} />
                  </Row>
                )}
                <input
                  ref={bgInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    pickBackground(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── LIVE PREVIEW ── */}
        <div className="xl:sticky xl:top-4 h-fit space-y-2">
          <p className="text-center text-sm font-medium text-muted-foreground">Live preview</p>
          <ShowcasePreview style={section} items={section.items.filter((i) => i.is_active && !i.warning)} />
          <p className="text-center text-xs text-muted-foreground">Hidden cards are left out, as in the app.</p>
        </div>
      </div>

      <CardDialog
        open={cardDialog !== null}
        onOpenChange={(o) => !o && setCardDialog(null)}
        item={cardDialog?.item ?? null}
        catalog={catalog}
        imageRatio={layout.image_ratio}
        onSubmit={submitCard}
      />

      <AlertDialog open={cardToDelete !== null} onOpenChange={(o) => !o && setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              “{cardToDelete?.custom_name || cardToDelete?.category_name}” and its image will be removed from this section.
              The category itself is not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteCard}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
