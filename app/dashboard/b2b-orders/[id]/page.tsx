'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getB2BOrderById, updateB2BOrderStatus } from '@/lib/api/b2bOrder';
import { B2BOrder, B2BOrderStatus } from '@/lib/types/b2bOrder';

const ORDER_STATUSES: B2BOrderStatus[] = [
  'Pending',
  'Pickup Assigned',
  'Processing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function B2BOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<B2BOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setOrder(await getB2BOrderById(params.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleStatusChange = async (status: B2BOrderStatus) => {
    if (!order) return;
    setUpdating(true);
    const result = await updateB2BOrderStatus(order.id, status);
    setUpdating(false);

    if (!result.success) {
      toast({ title: 'Update failed', description: result.message, variant: 'destructive' });
      return;
    }
    setOrder(result.order ?? order);
    toast({ title: 'Order status updated', description: `Now marked as ${status}.` });
  };

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
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.serviceName} · {item.categoryName}</p>
                  <p className="text-muted-foreground">Qty: {item.qty}</p>
                </div>
                <p className="font-medium">₹{item.amount.toLocaleString('en-IN')}</p>
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
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={order.orderStatus} onValueChange={handleStatusChange} disabled={updating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
