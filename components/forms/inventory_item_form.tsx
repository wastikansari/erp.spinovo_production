'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createInventoryItem, updateInventoryItem } from '@/lib/api/inventory';
import { InventoryItem } from '@/lib/types/inventory';
import { inventoryItemImageUrl } from '@/lib/utils';

interface InventoryItemFormProps {
  item?: InventoryItem; // present in edit mode
}

const UNIT_OPTIONS = ['piece', 'kg', 'roll', 'box', 'pack'];

export function InventoryItemForm({ item }: InventoryItemFormProps) {
  const router = useRouter();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [unit, setUnit] = useState(item?.unit ?? 'piece');
  const [costPerUnit, setCostPerUnit] = useState(item ? String(item.cost_per_unit) : '');
  const [currentStock, setCurrentStock] = useState(item ? String(item.current_stock) : '0');
  const [reorderLevel, setReorderLevel] = useState(item ? String(item.reorder_level) : '0');
  const [description, setDescription] = useState(item?.description ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const existingImageUrl = inventoryItemImageUrl(item?.image);

  async function handleSave() {
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Item name is required.' });
      return;
    }
    if (costPerUnit !== '' && (isNaN(Number(costPerUnit)) || Number(costPerUnit) < 0)) {
      setAlert({ type: 'error', message: 'Enter a valid cost per unit.' });
      return;
    }
    if (!isEdit && (isNaN(Number(currentStock)) || Number(currentStock) < 0)) {
      setAlert({ type: 'error', message: 'Enter a valid starting quantity.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      unit,
      cost_per_unit: costPerUnit || 0,
      current_stock: currentStock,
      reorder_level: reorderLevel || 0,
      description: description.trim(),
      image: imageFile,
    };

    const result = isEdit
      ? await updateInventoryItem(item!.item_id, payload)
      : await createInventoryItem(payload);

    setSaving(false);
    if (result.success) {
      setAlert({ type: 'success', message: `Item ${isEdit ? 'updated' : 'created'} successfully!` });
      setTimeout(() => router.push('/dashboard/inventory'), 1200);
    } else {
      setAlert({ type: 'error', message: result.message || 'Failed to save item. Please try again.' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.push('/dashboard/inventory')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Button>

      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Boxes className="h-5 w-5 text-indigo-500" />
          {isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </h1>
      </div>

      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={alert.type === 'success' ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' : ''}
        >
          {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laundry Bag, Delivery Logistics Bag, Basket, Butter Paper"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Bags, Packaging, Consumables"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <Input
                  id="costPerUnit"
                  type="number"
                  min={0}
                  step={0.01}
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min={0}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="Low-stock alert threshold"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="currentStock">Starting Quantity</Label>
              <Input
                id="currentStock"
                type="number"
                min={0}
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          {isEdit && (
            <p className="text-xs text-muted-foreground -mt-2">
              Current stock is {item!.current_stock} {item!.unit}. Use the stock adjust action on the list page to change quantity.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this item (size, supplier, usage, etc.)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Photo <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {existingImageUrl && !imageFile && (
              <div className="flex items-center gap-2 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existingImageUrl} alt={item?.name} className="h-12 w-12 rounded-md object-cover border" />
                <p className="text-xs text-muted-foreground">Current photo will be kept unless you choose a new one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-8">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/inventory')} disabled={saving}>
          Cancel
        </Button>
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
          ) : (
            isEdit ? 'Save Changes' : 'Add Item'
          )}
        </Button>
      </div>
    </div>
  );
}
