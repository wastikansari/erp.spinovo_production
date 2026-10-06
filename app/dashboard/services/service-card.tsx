'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Clock, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FullServiceCategory } from '@/lib/types/booking';
import { updateServiceSettings } from '@/lib/api/service';
import { useToast } from '@/hooks/use-toast';
import { cn, serviceImageUrl } from '@/lib/utils';

interface ServiceCardProps {
  service: FullServiceCategory;
  onUpdated: (service: FullServiceCategory) => void;
}

export function ServiceCard({ service, onUpdated }: ServiceCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<'is_active' | 'show_on_home' | null>(null);
  const imageUrl = serviceImageUrl(service.image_url);

  async function toggle(field: 'is_active' | 'show_on_home', value: boolean) {
    setBusy(field);
    const result = await updateServiceSettings(service.service_id, { [field]: value });
    setBusy(null);
    if (!result.success) {
      toast({ title: 'Not updated', description: result.message, variant: 'destructive' });
      return;
    }
    onUpdated({ ...service, [field]: value });
    toast({
      title:
        field === 'is_active'
          ? value
            ? `${service.service} is now Active — visible in the app`
            : `${service.service} is now Inactive — hidden from the app`
          : value
            ? 'Shown on app Home screen'
            : 'Removed from app Home screen',
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800
                    bg-white dark:bg-gray-900 shadow-sm
                    p-5 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={service.service} className="h-full w-full object-contain" />
            ) : (
              <ImageOff className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold capitalize text-gray-900 dark:text-gray-100">
                {service.service}
              </h2>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  service.is_active
                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                )}
              >
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
              {service.badge_text && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
                  {service.badge_text}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {service.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2 text-gray-600 dark:text-gray-400">
              <span>⏱ {service.duration}</span>
              <span>📦 Min Qty: {service.min_qty}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.service_duration_hours}h
              </span>
              {service.service_code && <span>🏷 {service.service_code}</span>}
            </div>
          </div>
        </div>

        {/* EDIT SERVICE BUTTON */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() =>
            router.push(
              `/dashboard/services/edit-service/${service.service_id}`
            )
          }
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Service
        </Button>
      </div>

      {/* APP VISIBILITY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Active in app</p>
            <p className="text-xs text-muted-foreground">
              {service.is_active ? 'Customers can order this' : 'Hidden from customers'}
            </p>
          </div>
          <Switch
            checked={service.is_active}
            disabled={busy !== null}
            onCheckedChange={(v) => toggle('is_active', v)}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Show on Home</p>
            <p className="text-xs text-muted-foreground">Position #{service.sort_order} in app</p>
          </div>
          <Switch
            checked={service.show_on_home}
            disabled={busy !== null}
            onCheckedChange={(v) => toggle('show_on_home', v)}
          />
        </label>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-3">
        {service.category_list.map((cat) => (
          <div
            key={cat.category_id}
            className="rounded-lg border border-gray-200 dark:border-gray-800
                       bg-gray-50 dark:bg-gray-800 p-4"
          >
            {/* CATEGORY HEADER */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {cat.category}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cat.types_of_Clothes.length} garment type(s)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{cat.price}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() =>
                    router.push(
                      `/dashboard/services/update/${cat.category_id}?serviceId=${service.service_id}&serviceName=${encodeURIComponent(service.service)}`
                    )
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>

            {/* GARMENTS */}
            <div className="flex flex-wrap gap-2">
              {cat.types_of_Clothes.map((item, index) => (
                <span
                  key={index}
                  className="text-xs px-3 py-1 rounded-full
                             bg-white dark:bg-gray-700
                             border border-gray-200 dark:border-gray-600
                             text-gray-700 dark:text-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ADD CATEGORY BUTTON */}
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 border-dashed border-indigo-300 dark:border-indigo-700
                   text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
        onClick={() =>
          router.push(
            `/dashboard/services/add-category/${service.service_id}?serviceName=${encodeURIComponent(service.service)}`
          )
        }
      >
        <Plus className="h-4 w-4" />
        Add Category
      </Button>
    </div>
  );
}
