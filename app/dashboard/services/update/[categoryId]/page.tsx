'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, X, Loader2, CheckCircle,
  AlertCircle, Pencil, Tag, IndianRupee, Shirt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getServiceCategories, updateCategory } from '@/lib/api/service';

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="rounded-xl border p-6 space-y-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UpdateCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId   = Number(params.categoryId);
  const serviceId    = searchParams.get('serviceId') ?? '';
  const serviceName  = searchParams.get('serviceName') ?? '';

  // Form state
  const [categoryName, setCategoryName]   = useState('');
  const [price, setPrice]                 = useState('');
  const [description, setDescription]     = useState('');
  const [garments, setGarments]           = useState<string[]>([]);
  const [newGarment, setNewGarment]       = useState('');

  // UI state
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch existing category data ──────────────────────────────────────────
  useEffect(() => {
    if (!serviceId) { setLoading(false); setNotFound(true); return; }

    async function fetchCategory() {
      setLoading(true);
      const services = await getServiceCategories();
      const service = services.find((s) => s._id === serviceId);
      if (service) {
        const cat = service.category_list.find((c) => c.category_id === categoryId);
        if (cat) {
          setCategoryName(cat.category);
          setPrice(cat.price);
          setDescription(cat.description ?? '');
          setGarments([...cat.types_of_Clothes]);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchCategory();
  }, [serviceId, categoryId]);

  // ── Garment helpers ───────────────────────────────────────────────────────
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

  // ── Save ──────────────────────────────────────────────────────────────────
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

    const result = await updateCategory(serviceId, categoryId, {
      category: categoryName.trim(),
      price: price.trim(),
      types_of_Clothes: garments,
    });

    setSaving(false);
    if (result.success) {
      setAlert({ type: 'success', message: 'Category updated successfully!' });
      setTimeout(() => router.push('/dashboard/services'), 1500);
    } else {
      setAlert({ type: 'error', message: result.message || 'Update failed. Please try again.' });
    }
  }

  // ── Loading / not-found states ────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Button>
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-6 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="font-semibold text-red-700 dark:text-red-300">Category not found</p>
          <p className="text-sm text-red-600 dark:text-red-400">
            This category may have been deleted or the link is invalid.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/dashboard/services')}>
            Go to Services
          </Button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">

      {/* BACK */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Button>

      {/* PAGE TITLE */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400
                             bg-indigo-50 dark:bg-indigo-950 border border-indigo-200
                             dark:border-indigo-800 px-2 py-0.5 rounded-full capitalize">
              {serviceName}
            </span>
            <span className="text-xs text-muted-foreground">Category #{categoryId}</span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Pencil className="h-5 w-5 text-indigo-500" />
            Edit Category
          </h1>
        </div>
      </div>

      {/* ALERT */}
      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={alert.type === 'success'
            ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300'
            : ''}
        >
          {alert.type === 'success'
            ? <CheckCircle className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* ── CATEGORY DETAILS CARD ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-500" />
            Category Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* CATEGORY NAME */}
          <div className="space-y-1.5">
            <Label htmlFor="categoryName">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Regular, Premium, Express"
              disabled={saving}
              className="focus-visible:ring-indigo-500"
            />
          </div>

          {/* PRICE */}
          <div className="space-y-1.5">
            <Label htmlFor="price">
              Price (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9 focus-visible:ring-indigo-500"
                placeholder="0.00"
                disabled={saving}
              />
            </div>
          </div>

          {/* DESCRIPTION (read-only info) */}
          {description && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Description</Label>
              <div className="rounded-md border bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── GARMENTS CARD ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shirt className="h-4 w-4 text-indigo-500" />
              Garment Types
              <span className="text-red-500">*</span>
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">
              {garments.length} type{garments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Click a garment chip to remove it, or add new ones below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* CHIPS */}
          <div className="min-h-[48px] flex flex-wrap gap-2 rounded-lg border border-dashed
                          border-gray-200 dark:border-gray-700 p-3
                          bg-gray-50/50 dark:bg-gray-800/30">
            {garments.length === 0 ? (
              <span className="text-sm text-muted-foreground italic self-center">
                No garments — add one below.
              </span>
            ) : (
              garments.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={saving}
                  onClick={() => removeGarment(index)}
                  className="group inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full
                             bg-indigo-50 dark:bg-indigo-950
                             border border-indigo-200 dark:border-indigo-800
                             text-indigo-800 dark:text-indigo-200
                             hover:bg-red-50 dark:hover:bg-red-950
                             hover:border-red-200 dark:hover:border-red-800
                             hover:text-red-700 dark:hover:text-red-300
                             transition-all duration-150 disabled:opacity-50"
                >
                  {item}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>

          {/* ADD INPUT */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newGarment}
              onChange={(e) => setNewGarment(e.target.value)}
              onKeyDown={handleGarmentKeyDown}
              placeholder="Type garment name and press Enter"
              className="flex-1 focus-visible:ring-indigo-500"
              disabled={saving}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addGarment}
              disabled={saving || !newGarment.trim()}
              className="gap-1.5 shrink-0 border-indigo-200 dark:border-indigo-800
                         text-indigo-600 dark:text-indigo-400
                         hover:bg-indigo-50 dark:hover:bg-indigo-950"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* ── ACTIONS ── */}
      <div className="flex gap-3 pb-8">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
          ) : (
            <><CheckCircle className="h-4 w-4" />Save Changes</>
          )}
        </Button>
      </div>

    </div>
  );
}
