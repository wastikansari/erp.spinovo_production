'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getB2BServices } from '@/lib/api/b2bService';
import { B2BFullServiceCategory } from '@/lib/types/b2bService';
import { B2BOrderSummary } from '@/lib/types/b2b-pickup-assign';
import { B2BQcItemPayload } from '@/lib/types/b2b-process-assign';

// This is the QC-time garment editor — admin corrects what was *actually*
// picked up against what the company ordered, using the same tap-to-edit
// quantity picker as spinovo_b2b_portal's New Order screen (not shared code,
// just the same interaction model, reproduced here for the ERP's own
// Tailwind/Radix component set).

type QcCartItem = { serviceId: number; garmentId: string; qty: number };

// Client only ever sends serviceId/garmentId/qty. Unit price, names, and line
// amounts are always re-derived server-side from the live catalog — this is
// just for building the request payload + a client-side preview total.
export function cartToQcPayload(cart: QcCartItem[]): B2BQcItemPayload[] {
  const bySvc = new Map<number, { garmentId: string; qty: number }[]>();
  for (const item of cart) {
    if (item.qty <= 0) continue;
    if (!bySvc.has(item.serviceId)) bySvc.set(item.serviceId, []);
    bySvc.get(item.serviceId)!.push({ garmentId: item.garmentId, qty: item.qty });
  }
  return Array.from(bySvc.entries()).map(([serviceId, garment]) => ({ serviceId, garment }));
}

interface B2BQcGarmentEditorProps {
  order: B2BOrderSummary;
  disabled?: boolean;
  // Called whenever the working cart changes. Pass stable callbacks (e.g.
  // useState setters or useCallback-wrapped functions) from the parent —
  // this fires from an effect keyed on the computed values.
  onChange: (items: B2BQcItemPayload[], correctedServiceCharges: number, correctedTotal: number) => void;
}

export function B2BQcGarmentEditor({ order, disabled, onChange }: B2BQcGarmentEditorProps) {
  const [services, setServices] = useState<B2BFullServiceCategory[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeServiceId, setActiveServiceId] = useState<number | null>(null);
  const [cart, setCart] = useState<QcCartItem[]>([]);
  const seededOrderId = useRef<string | null>(null);

  // Tap-to-edit state for typing a quantity directly (mirrors the portal's
  // New Order interaction for bulk B2B counts).
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingServices(true);
      setLoadError('');
      try {
        const data = await getB2BServices();
        if (cancelled) return;
        setServices(data);
        setActiveServiceId((prev) => prev ?? data[0]?.service_id ?? null);
      } catch {
        if (!cancelled) setLoadError('Could not load the garment catalog. Try again.');
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-seed the working cart from the order's current items — once per order.
  useEffect(() => {
    if (seededOrderId.current === order._id) return;
    seededOrderId.current = order._id;
    const seeded: QcCartItem[] = [];
    for (const group of order.items || []) {
      const serviceId = Number(group.serviceId);
      for (const g of group.garment) {
        seeded.push({ serviceId, garmentId: g.garmentId, qty: g.qty });
      }
    }
    setCart(seeded);
    setActiveServiceId(seeded[0]?.serviceId ?? null);
  }, [order]);

  const findGarment = useCallback(
    (serviceId: number, garmentId: string) => {
      const svc = services.find((s) => s.service_id === serviceId);
      const garment = svc?.garment_details.find((g) => g._id === garmentId);
      return svc && garment ? { svc, garment } : null;
    },
    [services],
  );

  const setQty = useCallback(
    (serviceId: number, garmentId: string, qty: number) => {
      if (disabled) return;
      const clamped = Math.max(0, Math.floor(qty) || 0);
      setCart((prev) => {
        const existing = prev.find((c) => c.serviceId === serviceId && c.garmentId === garmentId);
        if (clamped === 0) {
          return prev.filter((c) => !(c.serviceId === serviceId && c.garmentId === garmentId));
        }
        if (!existing) return [...prev, { serviceId, garmentId, qty: clamped }];
        return prev.map((c) =>
          c.serviceId === serviceId && c.garmentId === garmentId ? { ...c, qty: clamped } : c,
        );
      });
    },
    [disabled],
  );

  const updateQty = (serviceId: number, garmentId: string, delta: number) => {
    const existing = cart.find((c) => c.serviceId === serviceId && c.garmentId === garmentId);
    setQty(serviceId, garmentId, (existing?.qty ?? 0) + delta);
  };

  const startEditingQty = (serviceId: number, garmentId: string, currentQty: number) => {
    if (disabled) return;
    setEditingKey(`${serviceId}-${garmentId}`);
    setEditValue(currentQty > 0 ? String(currentQty) : '');
  };

  const commitEditingQty = (serviceId: number, garmentId: string) => {
    setQty(serviceId, garmentId, Number(editValue));
    setEditingKey(null);
  };

  const correctedServiceCharges = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const found = findGarment(item.serviceId, item.garmentId);
        return sum + (found ? Number(found.garment.price) * item.qty : 0);
      }, 0),
    [cart, findGarment],
  );

  // QC doesn't let admin touch slot/delivery/offer — only garment lines.
  // Preview only: server recomputes and clamps this the same way on submit.
  const slotCharges = order.slotCharges ?? 0;
  const deliveryCharge = order.deliveryCharge ?? 0;
  const safeOfferAmount = Math.min(Math.max(0, order.offerAmount ?? 0), correctedServiceCharges);
  const correctedTotal = correctedServiceCharges + slotCharges + deliveryCharge - safeOfferAmount;
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    onChange(cartToQcPayload(cart), correctedServiceCharges, correctedTotal);
    // `onChange` is expected to be a stable identity from the parent (a
    // useState setter or useCallback) — depending on the computed values
    // here is what should drive re-reporting, not identity churn on onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, correctedServiceCharges, correctedTotal]);

  const originalTotal = order.totalBilling ?? 0;
  const totalDiff = correctedTotal - originalTotal;

  if (loadingServices) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading garment catalog…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (services.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No B2B services configured in the catalog yet.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={String(activeServiceId)} onValueChange={(v) => setActiveServiceId(Number(v))}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1.5 rounded-full bg-muted/60 p-1.5">
          {services.map((svc) => {
            const svcCount = cart
              .filter((c) => c.serviceId === svc.service_id)
              .reduce((sum, c) => sum + c.qty, 0);
            return (
              <TabsTrigger
                key={svc.service_id}
                value={String(svc.service_id)}
                className="gap-1.5 rounded-full data-[state=active]:shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {svc.service}
                {svcCount > 0 && (
                  <Badge className="h-5 min-w-5 justify-center px-1 rounded-full bg-background/20 text-inherit hover:bg-background/20">
                    {svcCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {services.map((svc) => {
          if (svc.service_id !== activeServiceId) return null;
          return (
            <div key={svc.service_id} className="mt-3 max-h-[38vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {svc.garment_details.map((garment) => {
                  const inCart = cart.find(
                    (c) => c.serviceId === svc.service_id && c.garmentId === garment._id,
                  );
                  const editKey = `${svc.service_id}-${garment._id}`;
                  const isEditing = editingKey === editKey;
                  return (
                    <div
                      key={garment._id}
                      className={cn(
                        'relative flex items-center justify-between gap-2 p-3 rounded-xl border transition-colors',
                        inCart ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-primary/30 hover:bg-muted/50',
                      )}
                    >
                      {inCart && (
                        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{garment.name}</p>
                        <p className="text-xs text-muted-foreground">₹{garment.price}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {inCart ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={disabled}
                              onClick={() => updateQty(svc.service_id, garment._id, -1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => commitEditingQty(svc.service_id, garment._id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitEditingQty(svc.service_id, garment._id);
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingKey(null);
                                  }
                                }}
                                className="w-14 h-7 text-center px-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <button
                                type="button"
                                title="Tap to type a quantity"
                                disabled={disabled}
                                onClick={() => startEditingQty(svc.service_id, garment._id, inCart.qty)}
                                className="w-9 h-7 text-center text-sm font-medium rounded-md border border-input bg-background hover:border-primary hover:bg-accent active:bg-accent transition-colors disabled:opacity-50"
                              >
                                {inCart.qty}
                              </button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={disabled}
                              onClick={() => updateQty(svc.service_id, garment._id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            disabled={disabled}
                            onClick={() => setQty(svc.service_id, garment._id, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Tabs>

      <Separator />

      <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> Garments in corrected order
          </span>
          <span className="font-medium text-foreground">{cartItemCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Original total</span>
          <span className="font-medium">₹{originalTotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Corrected total</span>
          <span className="font-semibold text-base">₹{correctedTotal.toLocaleString('en-IN')}</span>
        </div>
        {totalDiff !== 0 && (
          <div className={cn('flex justify-between font-medium', totalDiff > 0 ? 'text-amber-600' : 'text-green-600')}>
            <span>{totalDiff > 0 ? 'Additional billing' : 'Wallet credit'}</span>
            <span>{totalDiff > 0 ? '+' : '-'}₹{Math.abs(totalDiff).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
