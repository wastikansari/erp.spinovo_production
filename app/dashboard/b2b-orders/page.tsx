'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getB2BOrders } from '@/lib/api/b2bOrder';
import { B2BOrder, B2BOrderStatus } from '@/lib/types/b2bOrder';

const statusVariant: Record<B2BOrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Pending: 'secondary',
  'Pickup Assigned': 'outline',
  Processing: 'outline',
  'Out for Delivery': 'outline',
  Delivered: 'default',
  Cancelled: 'destructive',
};

export default function B2BOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getB2BOrders());
    } catch (err) {
      toast({
        title: 'Failed to load orders',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <HeaderSection title="B2B Orders" handleRefresh={load} loading={loading} />

      <Card className="border-none shadow-sm p-4 sm:p-6">
        <CardContent className="p-0">
          <DataTable<B2BOrder>
            data={orders}
            loading={loading}
            emptyMessage="No B2B orders placed yet."
            searchPlaceholder="Search orders..."
            columns={[
              { key: 'orderNo', header: 'Order No', render: (o) => <span className="font-medium">{o.orderNo}</span> },
              {
                key: 'company',
                header: 'Company',
                render: (o) => o.company.companyName,
              },
              {
                key: 'items',
                header: 'Service',
                render: (o) => o.items.map((i) => `${i.serviceName} (${i.categoryName})`).join(', '),
              },
              { key: 'bookingDate', header: 'Pickup Date' },
              {
                key: 'totalBilling',
                header: 'Amount',
                render: (o) => <span className="font-medium">₹{o.totalBilling.toLocaleString('en-IN')}</span>,
              },
              { key: 'paymentMode', header: 'Payment Mode' },
              {
                key: 'paymentStatus',
                header: 'Payment',
                render: (o) => (
                  <Badge variant={o.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                    {o.paymentStatus}
                  </Badge>
                ),
              },
              {
                key: 'orderStatus',
                header: 'Status',
                render: (o) => <Badge variant={statusVariant[o.orderStatus]}>{o.orderStatus}</Badge>,
              },
            ]}
            actions={(o) => (
              <Link href={`/dashboard/b2b-orders/${o.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
