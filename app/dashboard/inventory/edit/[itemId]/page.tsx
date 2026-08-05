'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { InventoryItemForm } from '@/components/forms/inventory_item_form';
import { getInventoryItemById } from '@/lib/api/inventory';
import { InventoryItem } from '@/lib/types/inventory';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function EditInventoryItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getInventoryItemById(itemId);
      if (!data) {
        setNotFound(true);
      } else {
        setItem(data);
      }
      setLoading(false);
    })();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading item...
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Inventory item not found.</span>
            <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/inventory')}>
              Back to Inventory
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <InventoryItemForm item={item} />;
}
