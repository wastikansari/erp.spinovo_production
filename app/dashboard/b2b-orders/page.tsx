'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function B2BOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">B2B Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Corporate Orders
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Manage orders placed by B2B company/client accounts here.
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-10 text-center text-muted-foreground">
            Coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
