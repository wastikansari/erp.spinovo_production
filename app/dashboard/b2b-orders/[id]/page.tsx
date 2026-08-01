'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { getB2BOrderById } from '@/lib/api/b2bOrder';
import { B2BOrder, B2B_ORDER_STAGE_LABELS } from '@/lib/types/b2bOrder';

// Read-only pipeline timeline — admins can no longer free-jump stages here
// (matches how retail's order detail avoids that). Cancelled (0) is handled
// as a special case, not part of the linear 1-10 flow.
const TIMELINE_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function nextActionFor(order: B2BOrder): { label: string; href: string } | null {
  const stage = order.orderStageId;
  if (stage == null) return null;
  switch (stage) {
    case 1:
      return { label: 'Go to Pickup Pending', href: '/dashboard/b2b-orders/pickup-pending' };
    case 2:
    case 3:
      return { label: 'Go to Pickup Assigned', href: '/dashboard/b2b-orders/pickup-assigned' };
    case 4:
      return order.qualityCheck
        ? { label: 'Go to Process Pending', href: '/dashboard/b2b-orders/process-pending' }
        : { label: 'Go to Quality Check', href: '/dashboard/b2b-orders/quality-check' };
    case 5:
    case 6:
      return { label: 'Go to Process Assigned', href: '/dashboard/b2b-orders/process-assigned' };
    case 7:
      return { label: 'Go to Delivery Pending', href: '/dashboard/b2b-orders/delivery-pending' };
    case 8:
    case 9:
      return { label: 'Go to Delivery Assigned', href: '/dashboard/b2b-orders/delivery-assigned' };
    case 10:
      return { label: 'View in Delivered List', href: '/dashboard/b2b-orders/delivered' };
    default:
      return null;
  }
}

function StageTimeline({ order }: { order: B2BOrder }) {
  const stage = order.orderStageId;

  if (stage === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3">
        <Ban className="h-5 w-5 text-red-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
          <p className="text-xs text-red-600/80 dark:text-red-400/70">This order has been cancelled and will not progress further.</p>
        </div>
      </div>
    );
  }

  if (stage == null) {
    return (
      <p className="text-sm text-muted-foreground">
        Pipeline stage unavailable for this order.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {TIMELINE_STAGES.map((s, i) => {
        const isDone = s < stage;
        const isCurrent = s === stage;
        const isLast = i === TIMELINE_STAGES.length - 1;
        return (
          <div key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border ${
                  isDone
                    ? 'bg-green-600 border-green-600 text-white'
                    : isCurrent
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {!isLast && (
                <div className={`w-px flex-1 min-h-[18px] ${isDone ? 'bg-green-600' : 'bg-border'}`} />
              )}
            </div>
            <div className={`pb-4 ${isCurrent ? '' : 'pt-0.5'}`}>
              <p className={`text-sm ${isCurrent ? 'font-semibold text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                {B2B_ORDER_STAGE_LABELS[s]}
              </p>
              {isCurrent && s === 4 && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Quality check: {order.qualityCheck ? 'Passed' : 'Pending'}
                </p>
              )}
              {isCurrent && <Badge variant="secondary" className="mt-1">Current stage</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function B2BOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<B2BOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setOrder(await getB2BOrderById(params.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const action = nextActionFor(order);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNo}</h1>
        <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
          {order.paymentStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((group, i) => (
              <div key={i} className="py-2 border-b last:border-0 space-y-1.5">
                <p className="font-medium">{group.serviceName}</p>
                {group.garment.map((g, j) => (
                  <div key={j} className="flex items-center justify-between text-sm pl-3">
                    <p className="text-muted-foreground">{g.garmentName} · Qty: {g.qty}</p>
                    <p>₹{g.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            ))}
            <div className="pt-2 text-sm text-muted-foreground">
              Pickup scheduled: {order.bookingDate}, {order.bookingTime}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.company.companyName}</p>
              <p className="text-muted-foreground">{order.company.mobile}</p>
              <p className="text-muted-foreground">{order.company.city}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charges</span>
                <span>₹{order.serviceCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slot Charges</span>
                <span>₹{order.slotCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                <span>₹{order.deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
              {order.offerCode && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Offer ({order.offerCode})</span>
                  <span>-₹{order.offerAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total Billing</span>
                <span>₹{order.totalBilling.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Payment Mode</span>
                <span>{order.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settlement</span>
                <span>{order.settlementStatus}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StageTimeline order={order} />

              {order.qcNote && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-foreground mb-0.5">QC Note</p>
                  <p className="text-muted-foreground">{order.qcNote}</p>
                </div>
              )}

              {action && (
                <Link href={action.href}>
                  <Button className="w-full rounded-xl">
                    {action.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
