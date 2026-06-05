'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addNewCategory } from '@/lib/api/service';

export default function AddCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = params.serviceId as string;
  const serviceName = searchParams.get('serviceName') ?? '';

  const [categoryName, setCategoryName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [garments, setGarments] = useState<string[]>([]);
  const [newGarment, setNewGarment] = useState('');

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function addGarment() {
    const trimmed = newGarment.trim();
    if (!trimmed || garments.includes(trimmed)) return;
    setGarments((prev) => [...prev, trimmed]);
    setNewGarment('');
    inputRef.current?.focus();
  }

  function removeGarment(index: number) {
    setGarments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleGarmentKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addGarment(); }
  }

  async function handleSave() {
    if (!categoryName.trim()) {
      setAlert({ type: 'error', message: 'Category name is required.' });
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setAlert({ type: 'error', message: 'Enter a valid price.' });
      return;
    }
    if (garments.length === 0) {
      setAlert({ type: 'error', message: 'Add at least one garment type.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    const result = await addNewCategory(serviceId, {
      category: categoryName.trim(),
      description: description.trim(),
      price: price.trim(),
      types_of_Clothes: garments,
    });

    setSaving(false);
    if (result.success) {
      setAlert({ type: 'success', message: 'Category added successfully!' });
      setTimeout(() => router.push('/dashboard/services'), 1500);
    } else {
      setAlert({ type: 'error', message: result.message || 'Failed to add category. Please try again.' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* BACK */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Button>

      {/* TITLE */}
      <div>
        <p className="text-sm text-muted-foreground capitalize">{serviceName}</p>
        <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
          <Tag className="h-5 w-5 text-indigo-500" />
          Add New Category
        </h1>
      </div>

      {/* ALERT */}
      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={alert.type === 'success' ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' : ''}
        >
          {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* FORM CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name <span className="text-red-500">*</span></Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Regular, Premium, Express"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this category"
            />
          </div>

        </CardContent>
      </Card>

      {/* GARMENTS CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Garment Types <span className="text-red-500">*</span></CardTitle>
          <p className="text-sm text-muted-foreground">Add garment types supported by this category.</p>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {garments.length === 0 && (
              <span className="text-sm text-muted-foreground italic">No garments added yet.</span>
            )}
            {garments.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full
                           bg-indigo-50 dark:bg-indigo-950
                           border border-indigo-200 dark:border-indigo-800
                           text-indigo-800 dark:text-indigo-200"
              >
                {item}
                <button type="button" onClick={() => removeGarment(index)} className="hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newGarment}
              onChange={(e) => setNewGarment(e.target.value)}
              onKeyDown={handleGarmentKeyDown}
              placeholder="Type garment name and press Enter or Add"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addGarment} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {garments.length} garment type{garments.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex gap-3 pb-8">
        <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
          ) : (
            'Add Category'
          )}
        </Button>
      </div>
    </div>
  );
}
