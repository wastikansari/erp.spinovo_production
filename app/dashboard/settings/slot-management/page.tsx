'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CalendarClock, AlertCircle, Plus, Pencil, Trash2, Save, Info,
  EyeOff, CalendarX, RotateCcw, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { SlotSettingsApiService } from '@/lib/api/slotSettings';
import {
  SlotSettings, SlotTemplate, SlotDateOverride, SlotOverrideEntry, PreviewDay,
} from '@/lib/types/slotSettings';

// ── Helpers ───────────────────────────────────────────────────────────────────

function to12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

function slotLabel(s: { start: string; end: string }) {
  return `${to12h(s.start)} – ${to12h(s.end)}`;
}

// <input type="date"> uses YYYY-MM-DD; the API / app use DD/MM/YYYY.
const isoToDmy = (iso: string) => iso.split('-').reverse().join('/');
const dmyToIso = (dmy: string) => dmy.split('/').reverse().join('-');

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDmy(dmy: string) {
  const d = new Date(dmyToIso(dmy) + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// Whole rupees only — the customer app parses charges as an integer.
function parseCharge(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong';
}

// ── Charge input (saves on blur / Enter) ─────────────────────────────────────

function ChargeInput({
  value, onSave, disabled, placeholder,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => { setText(value === null ? '' : String(value)); }, [value]);

  function commit() {
    const parsed = parseCharge(text);
    if (parsed !== null && Number.isNaN(parsed)) {
      setText(value === null ? '' : String(value));
      return;
    }
    if (parsed !== value) onSave(parsed);
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 text-sm">₹</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="h-8 w-20"
      />
    </div>
  );
}

// ── Tab 1: Daily slots (template) ─────────────────────────────────────────────

function SlotDialog({
  open, slot, onClose, onSaved,
}: {
  open: boolean;
  slot: SlotTemplate | null;
  onClose: () => void;
  onSaved: (s: SlotSettings) => void;
}) {
  const { toast } = useToast();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [pickupCharge, setPickupCharge] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStart(slot?.start ?? '');
    setEnd(slot?.end ?? '');
    setPickupCharge(String(slot?.pickup.charges ?? 0));
    setDeliveryCharge(String(slot?.delivery.charges ?? 0));
  }, [open, slot]);

  async function save() {
    const pc = parseCharge(pickupCharge) ?? 0;
    const dc = parseCharge(deliveryCharge) ?? 0;
    if (!start || !end) {
      toast({ title: 'Start and end time are required', variant: 'destructive' });
      return;
    }
    if (end <= start) {
      toast({ title: 'End time must be after start time', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(pc) || Number.isNaN(dc)) {
      toast({ title: 'Charges must be whole rupees (0 or more)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = { start, end, pickup: { charges: pc }, delivery: { charges: dc } };
      const res = slot
        ? await SlotSettingsApiService.updateSlot(slot._id, body)
        : await SlotSettingsApiService.createSlot(body);
      toast({ title: slot ? 'Slot updated' : 'Slot created' });
      onSaved(res.data.settings);
      onClose();
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{slot ? 'Edit slot' : 'Add new slot'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Start time</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End time</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pickup charge (₹)</Label>
            <Input type="number" min={0} step={1} value={pickupCharge} onChange={(e) => setPickupCharge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery charge (₹)</Label>
            <Input type="number" min={0} step={1} value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          The delivery charge only applies when the customer picks a delivery slot themselves
          (&quot;Schedule delivery&quot;). Auto-assigned delivery is always free.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailySlotsTab({
  settings, onChange,
}: {
  settings: SlotSettings;
  onChange: (s: SlotSettings) => void;
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SlotTemplate | null>(null);
  const [deleting, setDeleting] = useState<SlotTemplate | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const slots = [...settings.slots].sort((a, b) => a.start.localeCompare(b.start));

  async function patch(slot: SlotTemplate, body: Parameters<typeof SlotSettingsApiService.updateSlot>[1]) {
    setBusyId(slot._id);
    try {
      const res = await SlotSettingsApiService.updateSlot(slot._id, body);
      onChange(res.data.settings);
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const res = await SlotSettingsApiService.deleteSlot(deleting._id);
      onChange(res.data.settings);
      toast({ title: 'Slot deleted' });
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-gray-700">
          Daily slots ({slots.length})
        </CardTitle>
        <Button size="sm" className="gap-1" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add slot
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          These slots repeat every day. Pickup and delivery use the same timings, but each can be
          switched on/off and charged separately. Use <b>Date Overrides</b> to change a single date.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Pickup charge</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Delivery charge</TableHead>
                <TableHead>Show in app</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((s) => {
                const busy = busyId === s._id;
                return (
                  <TableRow key={s._id} className={s.is_hidden ? 'opacity-50' : ''}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {slotLabel(s)}
                      {s.is_hidden && <Badge variant="secondary" className="ml-2">Hidden</Badge>}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.pickup.is_active}
                        disabled={busy}
                        onCheckedChange={(v) => patch(s, { pickup: { is_active: v } })}
                      />
                    </TableCell>
                    <TableCell>
                      <ChargeInput
                        value={s.pickup.charges}
                        disabled={busy}
                        onSave={(v) => patch(s, { pickup: { charges: v ?? 0 } })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.delivery.is_active}
                        disabled={busy}
                        onCheckedChange={(v) => patch(s, { delivery: { is_active: v } })}
                      />
                    </TableCell>
                    <TableCell>
                      <ChargeInput
                        value={s.delivery.charges}
                        disabled={busy}
                        onSave={(v) => patch(s, { delivery: { charges: v ?? 0 } })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={!s.is_hidden}
                        disabled={busy}
                        onCheckedChange={(v) => patch(s, { is_hidden: !v })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditing(s); setDialogOpen(true); }}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600"
                          title="Edit slot"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(s)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                          title="Delete slot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {slots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-gray-400 py-8">
                    No slots yet. Add one to start taking bookings.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div><b>Off</b> = slot shows in the app as &quot;Unavailable&quot; (greyed out).</div>
          <div><b>Show in app off</b> = slot is removed from the app completely.</div>
          <div>Charges are whole rupees and show as a &quot;+₹&quot; badge on the slot in the app.</div>
        </div>
      </CardContent>

      <SlotDialog
        open={dialogOpen}
        slot={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={onChange}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete slot {deleting && slotLabel(deleting)}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the app for every date, and any date overrides for it are removed.
              Existing orders are not affected. To stop it temporarily, switch it off or hide it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ── Tab 2: Date overrides ─────────────────────────────────────────────────────

type TriState = 'default' | 'on' | 'off';
const toTri = (v: boolean | null | undefined): TriState => (v == null ? 'default' : v ? 'on' : 'off');
const fromTri = (t: TriState): boolean | null => (t === 'default' ? null : t === 'on');

function TriSelect({ value, onChange, disabled }: { value: TriState; onChange: (t: TriState) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TriState)}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
    >
      <option value="default">Default</option>
      <option value="on">On</option>
      <option value="off">Off</option>
    </select>
  );
}

function emptyOverride(date: string): SlotDateOverride {
  return { date, pickup_closed: false, delivery_closed: false, reason: '', slots: [] };
}

function overrideSummary(o: SlotDateOverride) {
  const parts: string[] = [];
  if (o.pickup_closed && o.delivery_closed) parts.push('Closed (pickup + delivery)');
  else if (o.pickup_closed) parts.push('Pickup closed');
  else if (o.delivery_closed) parts.push('Delivery closed');
  if (o.slots.length) parts.push(`${o.slots.length} slot change${o.slots.length > 1 ? 's' : ''}`);
  return parts.join(' · ') || 'No changes';
}

function DateOverridesTab({ settings }: { settings: SlotSettings }) {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<SlotDateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateIso, setDateIso] = useState(todayIso());
  const [draft, setDraft] = useState<SlotDateOverride>(emptyOverride(isoToDmy(todayIso())));
  const [saving, setSaving] = useState(false);

  const slots = [...settings.slots].filter((s) => !s.is_hidden).sort((a, b) => a.start.localeCompare(b.start));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SlotSettingsApiService.getOverrides();
      setOverrides(res.data.overrides);
    } catch (e) {
      toast({ title: 'Failed to load overrides', description: errMsg(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Selecting a date loads its existing override (or a blank one).
  useEffect(() => {
    const dmy = isoToDmy(dateIso);
    const existing = overrides.find((o) => o.date === dmy);
    setDraft(existing ? JSON.parse(JSON.stringify(existing)) : emptyOverride(dmy));
  }, [dateIso, overrides]);

  const existing = overrides.find((o) => o.date === draft.date);

  function entryFor(slotId: string): SlotOverrideEntry {
    return draft.slots.find((e) => e.slot_id === slotId) ?? {
      slot_id: slotId, pickup_active: null, pickup_charges: null, delivery_active: null, delivery_charges: null,
    };
  }

  function setEntry(slotId: string, patch: Partial<SlotOverrideEntry>) {
    setDraft((d) => {
      const others = d.slots.filter((e) => e.slot_id !== slotId);
      return { ...d, slots: [...others, { ...entryFor(slotId), ...patch }] };
    });
  }

  async function save() {
    setSaving(true);
    try {
      await SlotSettingsApiService.saveOverride(draft);
      toast({ title: 'Saved', description: `Slots for ${formatDmy(draft.date)} updated` });
      await load();
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function reset(date: string) {
    try {
      await SlotSettingsApiService.deleteOverride(date);
      toast({ title: 'Reset', description: `${formatDmy(date)} is back to the daily slots` });
      await load();
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">Change slots for one date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" min={todayIso()} value={dateIso} onChange={(e) => e.target.value && setDateIso(e.target.value)} className="w-44" />
            </div>
            <div className="text-sm text-gray-500 pb-2">
              {formatDmy(draft.date)}
              {existing
                ? <Badge className="ml-2" variant="secondary">Has changes</Badge>
                : <span className="ml-2">· using daily slots</span>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                checked={draft.pickup_closed}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, pickup_closed: v }))}
              />
              <span className="text-sm">Close all <b>pickup</b></span>
            </label>
            <label className="flex items-center gap-3 rounded-md border p-3">
              <Switch
                checked={draft.delivery_closed}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, delivery_closed: v }))}
              />
              <span className="text-sm">Close all <b>delivery</b></span>
            </label>
            <div className="space-y-1.5">
              <Input
                placeholder="Reason (e.g. Diwali)"
                value={draft.reason}
                onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Pickup charge</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Delivery charge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((s) => {
                  const e = entryFor(s._id);
                  return (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium whitespace-nowrap">{slotLabel(s)}</TableCell>
                      <TableCell>
                        <TriSelect
                          value={toTri(e.pickup_active)}
                          disabled={draft.pickup_closed}
                          onChange={(t) => setEntry(s._id, { pickup_active: fromTri(t) })}
                        />
                        <div className="text-[11px] text-gray-400 mt-0.5">Default: {s.pickup.is_active ? 'On' : 'Off'}</div>
                      </TableCell>
                      <TableCell>
                        <ChargeInput
                          value={e.pickup_charges}
                          placeholder={String(s.pickup.charges)}
                          disabled={draft.pickup_closed}
                          onSave={(v) => setEntry(s._id, { pickup_charges: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <TriSelect
                          value={toTri(e.delivery_active)}
                          disabled={draft.delivery_closed}
                          onChange={(t) => setEntry(s._id, { delivery_active: fromTri(t) })}
                        />
                        <div className="text-[11px] text-gray-400 mt-0.5">Default: {s.delivery.is_active ? 'On' : 'Off'}</div>
                      </TableCell>
                      <TableCell>
                        <ChargeInput
                          value={e.delivery_charges}
                          placeholder={String(s.delivery.charges)}
                          disabled={draft.delivery_closed}
                          onSave={(v) => setEntry(s._id, { delivery_charges: v })}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-gray-500">
            &quot;Default&quot; and an empty charge box mean the daily slot setting is used. A slot that is off
            every day can be switched <b>On</b> just for this date.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving} className="gap-1">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save for this date
            </Button>
            {existing && (
              <Button variant="outline" onClick={() => reset(draft.date)} className="gap-1">
                <RotateCcw className="h-4 w-4" /> Reset to daily slots
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">Upcoming changed dates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center text-gray-400 py-6"><RefreshCw className="h-4 w-4 animate-spin mr-2" />Loading...</div>
          ) : overrides.length === 0 ? (
            <div className="text-sm text-gray-400 py-6">No dates changed. All dates use the daily slots.</div>
          ) : (
            <div className="divide-y">
              {overrides.map((o) => (
                <button
                  key={o.date}
                  onClick={() => setDateIso(dmyToIso(o.date))}
                  className={`w-full text-left py-3 px-2 rounded hover:bg-gray-50 ${o.date === draft.date ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    {(o.pickup_closed || o.delivery_closed) && <CalendarX className="h-4 w-4 text-red-500" />}
                    {formatDmy(o.date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {overrideSummary(o)}{o.reason ? ` · ${o.reason}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 3: Booking rules ──────────────────────────────────────────────────────

function RulesTab({ settings, onChange }: { settings: SlotSettings; onChange: (s: SlotSettings) => void }) {
  const { toast } = useToast();
  const [days, setDays] = useState(String(settings.booking_days));
  const [buffer, setBuffer] = useState(String(settings.pickup_buffer_hours));
  const [gap, setGap] = useState(String(settings.delivery_gap_hours));
  const [saving, setSaving] = useState(false);

  async function save() {
    const body = { booking_days: Number(days), pickup_buffer_hours: Number(buffer), delivery_gap_hours: Number(gap) };
    if (!Number.isInteger(body.booking_days) || body.booking_days < 1 || body.booking_days > 14) {
      toast({ title: 'Booking days must be between 1 and 14', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(body.pickup_buffer_hours) || body.pickup_buffer_hours < 0 || Number.isNaN(body.delivery_gap_hours) || body.delivery_gap_hours < 0) {
      toast({ title: 'Hours must be 0 or more', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await SlotSettingsApiService.updateRules(body);
      onChange(res.data.settings);
      toast({ title: 'Booking rules saved' });
    } catch (e) {
      toast({ title: 'Failed', description: errMsg(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const rules = [
    { label: 'Booking window (days)', value: days, set: setDays, help: 'How many days ahead customers can book a pickup, starting today. Also used for the "Schedule delivery" date list.' },
    { label: 'Pickup notice (hours)', value: buffer, set: setBuffer, help: 'Today\'s pickup slots starting within this many hours are shown as unavailable.' },
    { label: 'Scheduled delivery gap (hours)', value: gap, set: setGap, help: 'When the customer picks their own delivery slot, the earliest slot is this many hours after the pickup slot ends.' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-700">Booking rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 max-w-2xl">
        {rules.map((r) => (
          <div key={r.label} className="grid gap-1.5 sm:grid-cols-[220px_1fr] sm:items-start">
            <Label className="pt-2">{r.label}</Label>
            <div>
              <Input type="number" min={0} value={r.value} onChange={(e) => r.set(e.target.value)} className="w-28" />
              <p className="text-xs text-gray-500 mt-1">{r.help}</p>
            </div>
          </div>
        ))}
        <div className="rounded-md bg-gray-50 border p-3 text-sm text-gray-600">
          <b>Auto delivery date</b> (when the customer doesn&apos;t schedule delivery) = pickup slot end +
          the service&apos;s SLA hours, then the next delivery slot that is on. SLA hours are set per
          service in <a href="/dashboard/settings/service-duration" className="text-indigo-600 underline">Settings → Service SLA</a>.
        </div>
        <Button onClick={save} disabled={saving} className="gap-1">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save rules
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Tab 4: App preview ────────────────────────────────────────────────────────

function PreviewDays({ days }: { days: PreviewDay[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {days.map((d) => {
        const times = d.slot.flatMap((g) => g.slot_time);
        const anyActive = times.some((t) => t.isActive);
        return (
          <div key={d.date} className={`rounded-lg border p-3 ${anyActive ? '' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">{d.day} <span className="text-gray-400 font-normal">{d.date}</span></div>
              {!anyActive && <Badge variant="secondary">No slots</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {times.map((t) => (
                <div
                  key={t.timeRange}
                  className={`relative rounded-md border px-2 py-1.5 text-xs ${t.isActive ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-400'}`}
                >
                  {t.timeRange}
                  {!t.isActive && <div className="text-[10px]">Unavailable</div>}
                  {t.charges > 0 && (
                    <span className="absolute -top-1.5 right-1 rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-800">+₹{t.charges}</span>
                  )}
                </div>
              ))}
              {times.length === 0 && <div className="col-span-2 text-xs text-gray-400">No slots</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PreviewTab() {
  const { toast } = useToast();
  const [pickup, setPickup] = useState<PreviewDay[]>([]);
  const [delivery, setDelivery] = useState<PreviewDay[] | null>(null);
  const [pickupKey, setPickupKey] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SlotSettingsApiService.preview();
      setPickup(res.data.time_slot);
    } catch (e) {
      toast({ title: 'Failed to load preview', description: errMsg(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function loadDelivery(key: string) {
    setPickupKey(key);
    if (!key) { setDelivery(null); return; }
    const [date, time] = key.split('|');
    try {
      const res = await SlotSettingsApiService.preview(date, time);
      setDelivery(res.data.time_slot);
    } catch (e) {
      toast({ title: 'Failed to load delivery preview', description: errMsg(e), variant: 'destructive' });
    }
  }

  const pickupOptions = pickup.flatMap((d) =>
    d.slot.flatMap((g) => g.slot_time).filter((t) => t.isActive).map((t) => ({
      key: `${d.date}|${t.timeRange}`, label: `${d.day} ${d.date} · ${t.timeRange}`,
    })),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Pickup slots — as customers see them right now
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-gray-400 py-6">Loading...</div> : <PreviewDays days={pickup} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">&quot;Schedule delivery&quot; slots for a pickup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={pickupKey}
            onChange={(e) => loadDelivery(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a pickup slot…</option>
            {pickupOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          {delivery && <PreviewDays days={delivery} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SlotManagementPage() {
  const [settings, setSettings] = useState<SlotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await SlotSettingsApiService.getSettings();
      setSettings(res.data.settings);
    } catch (e) {
      setError(errMsg(e) || 'Failed to load slot settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            Slot Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Control the pickup and delivery slots customers can book in the app: timings, charges,
            holidays and booking rules.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          Changes reach the customer app within about 30 seconds — no app update needed. Orders that
          are already booked keep their slot and charges.
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !settings ? (
        <div className="flex items-center py-12 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : settings && (
        <Tabs defaultValue="slots">
          <TabsList>
            <TabsTrigger value="slots">Daily Slots</TabsTrigger>
            <TabsTrigger value="dates">Date Overrides</TabsTrigger>
            <TabsTrigger value="rules">Booking Rules</TabsTrigger>
            <TabsTrigger value="preview">App Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="slots" className="mt-4">
            <DailySlotsTab settings={settings} onChange={setSettings} />
          </TabsContent>
          <TabsContent value="dates" className="mt-4">
            <DateOverridesTab settings={settings} />
          </TabsContent>
          <TabsContent value="rules" className="mt-4">
            <RulesTab settings={settings} onChange={setSettings} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <PreviewTab />
          </TabsContent>
        </Tabs>
      )}

      {settings && settings.slots.some((s) => s.is_hidden) && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <EyeOff className="h-3 w-3" /> Hidden slots are not shown in Date Overrides or the app.
        </div>
      )}
    </div>
  );
}
