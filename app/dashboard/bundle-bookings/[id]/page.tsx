'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Ban, Check, CheckCircle2, Loader2, Minus, PackagePlus, Plus, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/lib/auth';
import { hasAccess } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { BundleApiService } from '@/lib/api/bundle';
import type { BundleBookingDetailsData, BundleStatus, BundleConvertItem } from '@/lib/types/bundle';
import { BundleStatusBadge } from '@/components/bundle/BundleStatusBadge';

const PAGE_KEY = 'bundle-bookings';

const STEPS: { status: BundleStatus; label: string; note: string }[] = [
  { status: 'booked', label: 'Booked', note: 'Customer can cancel (₹ back to wallet)' },
  { status: 'visit_scheduled', label: 'Visit Scheduled', note: 'Customer cancel + refund locked' },
  { status: 'visit_done', label: 'Visit Done', note: 'Expert checked the curtains' },
  { status: 'completed', label: 'Completed', note: 'Converted to order, or consultation' },
];
const STEP_INDEX: Partial<Record<BundleStatus, number>> = { booked: 0, visit_scheduled: 1, visit_done: 2, completed: 3 };

type Confirm = 'visit_scheduled' | 'visit_done' | 'consultation' | 'cancel' | null;

interface CustomLine {
  key: number;
  category: string;
  price: string;
  qty: number;
}

// "DD/MM/YYYY" ⇄ "YYYY-MM-DD" (native date input)
const toInputDate = (d: string) => (/^\d{2}\/\d{2}\/\d{4}$/.test(d) ? d.split('/').reverse().join('-') : '');
const fromInputDate = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split('-').reverse().join('/') : '');
const fmt = (d?: string | null) => (d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : '—');

export default function BundleBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [user] = useState(() => AuthService.getUser());
  const canEdit = hasAccess(user, PAGE_KEY, 'edit');
  // Refunds are role-gated on the API (admin / super_admin), like B2B approvals.
  const canRefund = !user?.role || user.role === 'admin' || user.role === 'super_admin';

  const [data, setData] = useState<BundleBookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [cancelNote, setCancelNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Convert dialog
  const [convertOpen, setConvertOpen] = useState(false);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [customLines, setCustomLines] = useState<CustomLine[]>([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [convertError, setConvertError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await BundleApiService.getBooking(id);
      setData(res.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const booking = data?.booking;
  const convertService = data?.convert.service;
  const handling = data?.convert.handling_charge ?? 0;

  const lineTotal = useMemo(() => {
    const catalog = (convertService?.categories || []).reduce((s, c) => s + (qty[c.category_id] || 0) * c.price, 0);
    const custom = customLines.reduce((s, l) => s + l.qty * (Number(l.price) || 0), 0);
    return catalog + custom;
  }, [convertService, qty, customLines]);
  const pieces =
    Object.values(qty).reduce((s, q) => s + q, 0) + customLines.reduce((s, l) => s + l.qty, 0);

  function stepTime(status: BundleStatus) {
    return booking?.status_history?.find((h) => h.status === status)?.at;
  }

  function openConvert() {
    if (!booking) return;
    setQty({});
    setCustomLines([]);
    setPickupDate(toInputDate(booking.booking_date));
    setPickupTime(booking.booking_time);
    setConvertError('');
    setConvertOpen(true);
  }

  async function runConfirm() {
    if (!booking || !confirm) return;
    setBusy(true);
    try {
      if (confirm === 'visit_scheduled' || confirm === 'visit_done') {
        await BundleApiService.setStatus(booking._id, confirm);
        toast({ title: 'Status updated', description: 'Customer has been notified.' });
      } else if (confirm === 'consultation') {
        await BundleApiService.closeConsultation(booking._id);
        toast({ title: 'Completed as consultation', description: `₹${booking.amount} kept as consultation fee.` });
      } else if (confirm === 'cancel') {
        await BundleApiService.cancel(booking._id, cancelNote.trim());
        toast({ title: 'Booking cancelled', description: `₹${booking.amount} refunded to the customer's wallet.` });
      }
      setConfirm(null);
      setCancelNote('');
      await load();
    } catch (err: any) {
      toast({ title: 'Not updated', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function runConvert() {
    if (!booking) return;
    const items: BundleConvertItem[] = [
      ...Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([catId, q]) => ({ custom: false, category_id: Number(catId), qty: q })),
      ...customLines.map((l) => ({ custom: true, category: l.category.trim(), price: Number(l.price), qty: l.qty })),
    ];
    if (!items.length) return setConvertError('Add at least one curtain.');
    if (customLines.some((l) => !l.category.trim() || !(Number(l.price) > 0) || !Number.isInteger(Number(l.price)) || l.qty < 1))
      return setConvertError('Every custom line needs a name, a price in whole rupees and a quantity.');
    const date = fromInputDate(pickupDate);
    if (!date || !pickupTime.trim()) return setConvertError('Choose the pickup date and slot.');

    setBusy(true);
    setConvertError('');
    try {
      const res = await BundleApiService.convert(booking._id, { booking_date: date, booking_time: pickupTime.trim(), items });
      toast({ title: `Order ${res.data?.order.order_display_no} created`, description: 'Booking completed. Customer has been notified.' });
      setConvertOpen(false);
      await load();
    } catch (err: any) {
      setConvertError(err.message || 'Could not create the order');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (error || !booking) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/bundle-bookings"><ArrowLeft className="h-4 w-4 mr-2" />Bundle Bookings</Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const current = STEP_INDEX[booking.status] ?? -1;
  const confirmText: Record<Exclude<Confirm, null>, { title: string; body: string; action: string }> = {
    visit_scheduled: {
      title: 'Mark "Visit Scheduled"?',
      body: 'The customer gets a notification. After this the customer can no longer cancel or get a refund.',
      action: 'Yes, mark scheduled',
    },
    visit_done: {
      title: 'Mark "Visit Done"?',
      body: 'The customer gets a notification. Next you choose: convert to an order, or close as consultation.',
      action: 'Yes, mark done',
    },
    consultation: {
      title: 'Customer said no — close as consultation?',
      body: `The booking is completed and ₹${booking.amount} is kept as the consultation fee. No refund. The customer is notified.`,
      action: 'Yes, complete',
    },
    cancel: {
      title: 'Cancel and refund?',
      body: `₹${booking.amount} goes back to the customer's Spinovo wallet and the booking is cancelled.`,
      action: 'Cancel & refund',
    },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/bundle-bookings"><ArrowLeft className="h-4 w-4 mr-2" />Bundle Bookings</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{booking.booking_display_no}</h1>
          <span className="text-muted-foreground">{booking.service_name}</span>
          <BundleStatusBadge booking={booking} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-1 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">CUSTOMER</p>
            <p className="font-semibold">{data?.customer?.name || '—'}</p>
            <p>{data?.customer?.mobile}</p>
            <p className="text-xs text-muted-foreground">Wallet ₹{data?.customer?.wallet_balance ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">VISIT</p>
            <p className="font-semibold">{booking.booking_date} · {booking.booking_time}</p>
            <p>{booking.address_text}</p>
            <p className="text-xs text-muted-foreground">{booking.pincode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">PAYMENT</p>
            <p className="font-semibold">₹{booking.amount} · {booking.payment_mode === 'Online' ? 'Online (Razorpay)' : 'Wallet'}</p>
            {!!booking.wallet_amount && !!booking.online_amount && (
              <p className="text-xs">Wallet ₹{booking.wallet_amount} + Online ₹{booking.online_amount}</p>
            )}
            {booking.razorpay_payment_id && <p className="text-xs text-muted-foreground break-all">{booking.razorpay_payment_id}</p>}
            <p className="text-xs text-muted-foreground">Paid {fmt(booking.paid_at)}</p>
            {booking.refund_amount > 0 && <p className="text-xs text-red-600">₹{booking.refund_amount} refunded to wallet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-1 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">T&amp;C AGREED</p>
            <p className="font-semibold">Version {booking.terms_version}</p>
            <p className="text-xs text-muted-foreground">{fmt(booking.terms_agreed_at)}</p>
            {!!booking.terms_rules?.length && (
              <details className="text-xs">
                <summary className="cursor-pointer text-indigo-600">Rules the customer saw</summary>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  {booking.terms_rules.map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </details>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {booking.status === 'cancelled' ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
              <XCircle className="h-4 w-4" />
              Cancelled by {booking.cancelled_by || '—'} on {fmt(booking.cancelled_at)} · ₹{booking.refund_amount} refunded to wallet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STEPS.map((step, i) => {
                const done = i <= current;
                return (
                  <div key={step.status} className={cn('flex gap-3 rounded-lg p-3', done ? 'bg-green-50 dark:bg-green-950/40' : 'bg-gray-50 dark:bg-gray-900')}>
                    <span className={cn('h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold', done ? 'bg-green-600 text-white' : 'border border-gray-300 text-muted-foreground')}>
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-sm font-semibold">{step.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {stepTime(step.status) ? fmt(stepTime(step.status)) : step.note}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {canEdit && booking.status === 'booked' && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setConfirm('visit_scheduled')}>Mark Visit Scheduled</Button>
              <span className="text-sm text-muted-foreground">After this the customer can&apos;t cancel.</span>
            </div>
          )}
          {canEdit && booking.status === 'visit_scheduled' && (
            <Button onClick={() => setConfirm('visit_done')}>Mark Visit Done</Button>
          )}
          {canEdit && booking.status === 'visit_done' && (
            <div className="flex flex-wrap gap-3">
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={openConvert} disabled={!convertService}>
                <PackagePlus className="h-4 w-4" />
                Completed — Convert to {convertService?.service || 'order'}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setConfirm('consultation')}>
                <CheckCircle2 className="h-4 w-4" />
                Completed — Customer said no (keep ₹{booking.amount})
              </Button>
              {!convertService && (
                <p className="w-full text-sm text-red-600">
                  Set the &quot;Convert to order&quot; service in Services → Bundle settings first.
                </p>
              )}
            </div>
          )}
          {canEdit && canRefund && (booking.status === 'booked' || booking.status === 'visit_scheduled') && (
            <Button variant="ghost" className="text-red-600 hover:text-red-700 gap-2 -ml-2" onClick={() => setConfirm('cancel')}>
              <Ban className="h-4 w-4" />
              Cancel &amp; refund ₹{booking.amount} to wallet (admin)
            </Button>
          )}

          {booking.status === 'completed' && booking.outcome === 'converted' && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-800 dark:text-green-300">
              Converted to{' '}
              <Link href={`/dashboard/bookings/${booking.converted_order_id}`} className="font-semibold underline">
                {booking.converted_order_no}
              </Link>
              {data?.order && (
                <> · ₹{data.order.order_amount} + handling ₹{data.order.handling_charges} = ₹{data.order.total_billing} · {data.order.ord_status}</>
              )}
              . ₹{booking.amount} is counted as paid; the rest is settled at QC as usual.
            </div>
          )}
          {booking.status === 'completed' && booking.outcome === 'consultation' && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 text-sm">
              Customer said no. ₹{booking.amount} kept as consultation fee.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(booking.status_history || []).map((h, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_160px_1fr] gap-1 sm:gap-3 py-2 text-sm">
                <span className="text-muted-foreground">{fmt(h.at)}</span>
                <span className="font-medium">{STEPS.find((s) => s.status === h.status)?.label || (h.status === 'cancelled' ? 'Cancelled' : h.status)}</span>
                <span className="text-muted-foreground">
                  {h.by_name || h.by_type}{h.by_role ? ` (${h.by_role})` : ''}{h.note ? ` · ${h.note}` : ''}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmText[confirm].title}</AlertDialogTitle>
                <AlertDialogDescription>{confirmText[confirm].body}</AlertDialogDescription>
              </AlertDialogHeader>
              {confirm === 'cancel' && (
                <div className="space-y-2">
                  <Label htmlFor="cancel-note">Reason (optional)</Label>
                  <Textarea id="cancel-note" value={cancelNote} maxLength={300} rows={2} onChange={(e) => setCancelNote(e.target.value)} />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  className={confirm === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    runConfirm();
                  }}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {confirmText[confirm].action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={convertOpen} onOpenChange={(open) => !busy && setConvertOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert to {convertService?.service} order</DialogTitle>
            <DialogDescription>
              Enter the curtains counted at home. Rates come from the {convertService?.service} categories. Use
              &quot;Custom add&quot; for a curtain that isn&apos;t in the list or needs a different price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {(convertService?.categories || []).map((c) => {
              const q = qty[c.category_id] || 0;
              return (
                <div key={c.category_id} className="grid grid-cols-[1fr_70px_130px_80px] items-center gap-2 text-sm">
                  <span>{c.category}</span>
                  <span className="text-muted-foreground">₹{c.price}</span>
                  <span className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" aria-label={`Less ${c.category}`}
                      onClick={() => setQty((p) => ({ ...p, [c.category_id]: Math.max(0, q - 1) }))}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{q}</span>
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" aria-label={`More ${c.category}`}
                      onClick={() => setQty((p) => ({ ...p, [c.category_id]: q + 1 }))}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                  <span className="text-right font-medium">₹{q * c.price}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Custom lines</p>
              <Button type="button" size="sm" variant="outline" className="gap-1"
                onClick={() => setCustomLines((p) => [...p, { key: Date.now(), category: '', price: '', qty: 1 }])}>
                <Plus className="h-3.5 w-3.5" />
                Custom add
              </Button>
            </div>
            {customLines.map((l) => (
              <div key={l.key} className="grid grid-cols-[1fr_90px_70px_80px_36px] items-center gap-2">
                <Input placeholder="Category name, e.g. Silk Designer – Door" value={l.category} maxLength={60}
                  aria-label="Custom category name"
                  onChange={(e) => setCustomLines((p) => p.map((x) => (x.key === l.key ? { ...x, category: e.target.value } : x)))} />
                <Input placeholder="₹ price" inputMode="numeric" value={l.price} aria-label="Custom price"
                  onChange={(e) => setCustomLines((p) => p.map((x) => (x.key === l.key ? { ...x, price: e.target.value.replace(/[^0-9]/g, '') } : x)))} />
                <Input type="number" min={1} value={l.qty} aria-label="Custom quantity"
                  onChange={(e) => setCustomLines((p) => p.map((x) => (x.key === l.key ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))} />
                <span className="text-right text-sm font-medium">₹{l.qty * (Number(l.price) || 0)}</span>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600" aria-label="Remove custom line"
                  onClick={() => setCustomLines((p) => p.filter((x) => x.key !== l.key))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
            <div className="space-y-1">
              <Label htmlFor="pickup-date">Pickup date</Label>
              <Input id="pickup-date" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pickup-time">Pickup slot</Label>
              <Input id="pickup-time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} placeholder="11:00 am - 01:00 pm" />
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Defaults to the visit slot (curtains taken during the visit). The order then goes through the normal pickup → QC → delivery flow.
            </p>
          </div>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span>Curtains ({pieces})</span><span>₹{lineTotal}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Handling charge</span><span>₹{handling}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery / slot / platform charge</span><span>₹0</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>₹{lineTotal + handling}</span></div>
            <div className="flex justify-between text-green-700"><span>Already paid ({booking.booking_display_no})</span><span>− ₹{booking.amount}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Balance (settled at QC)</span><span>₹{Math.max(0, lineTotal + handling - booking.amount)}</span></div>
          </div>

          {convertError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{convertError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={busy}>Back</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={runConvert} disabled={busy || pieces === 0}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create order &amp; complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
