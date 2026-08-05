'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInventoryItems, toggleInventoryItemStatus } from '@/lib/api/inventory';
import { InventoryItem } from '@/lib/types/inventory';
import { inventoryItemImageUrl } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Boxes,
  Plus,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Pencil,
  Power,
} from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getInventoryItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleStatus(item: InventoryItem) {
    setTogglingId(item.item_id);
    const nextStatus = item.status === 1 ? 0 : 1;
    const result = await toggleInventoryItemStatus(item.item_id, nextStatus);
    setTogglingId(null);
    if (result.success) {
      toast({ title: 'Updated', description: result.message });
      setItems((prev) =>
        prev.map((i) => (i.item_id === item.item_id ? { ...i, status: nextStatus } : i))
      );
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  }

  const totalItems = items.length;
  const lowStockCount = items.filter((i) => i.current_stock <= i.reorder_level).length;
  const totalValue = items.reduce((sum, i) => sum + i.current_stock * i.cost_per_unit, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => load()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/inventory/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <span className="text-muted-foreground text-sm">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Inventory Items
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Laundry bags, delivery/pickup bags, baskets, butter paper and other operational supplies.
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={load}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <DataTable<InventoryItem>
              data={items}
              loading={loading}
              searchPlaceholder="Search by item name..."
              emptyMessage="No inventory items yet. Click 'Add Item' to create one."
              columns={[
                {
                  key: 'image',
                  header: 'Photo',
                  searchable: false,
                  render: (item) => {
                    const url = inventoryItemImageUrl(item.image);
                    return url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={item.name}
                        className="h-10 w-10 rounded-md object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border flex items-center justify-center bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  },
                },
                { key: 'item_id', header: 'ID' },
                { key: 'name', header: 'Name' },
                { key: 'category', header: 'Category' },
                {
                  key: 'current_stock',
                  header: 'Stock',
                  render: (item) => (
                    <span className="flex items-center gap-1.5">
                      {item.current_stock} {item.unit}
                      {item.current_stock <= item.reorder_level && (
                        <Badge variant="destructive" className="text-[10px]">Low</Badge>
                      )}
                    </span>
                  ),
                },
                {
                  key: 'cost_per_unit',
                  header: 'Cost/Unit',
                  render: (item) => `₹${item.cost_per_unit.toLocaleString()}`,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => (
                    <Badge variant={item.status === 1 ? 'default' : 'secondary'}>
                      {item.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  ),
                },
              ]}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/inventory/edit/${item.item_id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={togglingId === item.item_id}
                    onClick={() => handleToggleStatus(item)}
                    title={item.status === 1 ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
