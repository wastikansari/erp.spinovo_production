'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, MapPin, MessageSquareText, Phone, ShoppingBag, IndianRupee, X, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SalesCallApiService } from '@/lib/api/salesCall';
import {
  SALES_CALL_RESPONSE_OPTIONS,
  type SalesCallCustomer,
  type SalesCallNote,
  type SalesCallResponse,
} from '@/lib/types/salesCall';
import { ResponseBadge } from './ResponseBadge';

interface CallNotePanelProps {
  customer: SalesCallCustomer;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (note: SalesCallNote) => void;
}

const formatAddress = (customer: SalesCallCustomer) => {
  const a = customer.address;
  if (!a) return '';
  return (
    a.format_address ||
    [a.flat_no, a.building, a.street, a.landmark, a.city, a.pincode].filter(Boolean).join(', ')
  );
};

// Right-hand panel on the Sales Call page: customer summary, the "log this
// call" form, and the customer's full call-note history (newest first).
export function CallNotePanel({ customer, canEdit, onClose, onSaved }: CallNotePanelProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<SalesCallNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [response, setResponse] = useState<SalesCallResponse | ''>('');
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResponse('');
    setNote('');
    setFollowUp('');
    setLoadingNotes(true);
    SalesCallApiService.getNotes(customer._id)
      .then((res) => {
        if (!cancelled) setNotes(res.status && res.data ? res.data.notes : []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingNotes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer._id]);

  const handleSave = async () => {
    if (!response) {
      toast({ title: 'Select a response', description: 'Choose what the customer said.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await SalesCallApiService.addNote(customer._id, {
        response,
        note: note.trim(),
        follow_up_date: followUp,
      });
      if (res.status && res.data) {
        setNotes((prev) => [res.data!.note, ...prev]);
        setResponse('');
        setNote('');
        setFollowUp('');
        onSaved(res.data.note);
        toast({ title: 'Saved', description: 'Call note saved.' });
      } else {
        toast({ title: 'Error', description: res.msg || 'Could not save the note.', variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Could not save the note.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const address = formatAddress(customer);

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{customer.name || 'No name'}</CardTitle>
            <a
              href={`tel:${customer.mobile}`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              {customer.mobile}
            </a>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            {customer.total_orders} orders
          </span>
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" />
            {customer.total_spending} spent
          </span>
          {customer.last_order_date && (
            <span>Last order {format(new Date(customer.last_order_date), 'dd MMM yyyy')}</span>
          )}
        </div>
        {address && (
          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {address}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {canEdit ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <Label className="text-xs font-semibold">Customer response</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SALES_CALL_RESPONSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResponse(opt.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      response === opt.value
                        ? `${opt.className} ring-2 ring-primary ring-offset-1 ring-offset-background`
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="sales-call-note" className="text-xs font-semibold">
                Key points / note
              </Label>
              <Textarea
                id="sales-call-note"
                rows={4}
                maxLength={2000}
                placeholder="What did the customer say? e.g. Will order on Sunday, wants dry clean price list…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="sales-call-followup" className="text-xs font-semibold">
                Follow-up date (optional)
              </Label>
              <Input
                id="sales-call-followup"
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save note
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            You have view-only access to Sales Call, so you can read notes but not add them.
          </p>
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <MessageSquareText className="h-4 w-4" />
            Previous notes {notes.length > 0 && <span className="text-muted-foreground">({notes.length})</span>}
          </p>
          {loadingNotes ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No calls logged yet.</p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {notes.map((n) => (
                <li key={n._id} className="rounded-lg border p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <ResponseBadge response={n.response} />
                    <span
                      className="text-xs text-muted-foreground"
                      title={format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}
                    >
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {n.note && <p className="mt-1.5 whitespace-pre-wrap text-sm">{n.note}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span>by {n.staff_name || 'Staff'}</span>
                    {n.follow_up_date && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Follow-up {format(new Date(`${n.follow_up_date}T00:00:00`), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
