'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FullServiceCategory } from '@/lib/types/booking';
import { reorderServices } from '@/lib/api/service';
import { useToast } from '@/hooks/use-toast';
import { serviceImageUrl } from '@/lib/utils';

interface ServiceOrderPanelProps {
  services: FullServiceCategory[];
  onSaved: (ordered: FullServiceCategory[]) => void;
  onCancel: () => void;
}

// Arrange services with ↑ / ↓. The saved order is what the app shows — Home
// tiles and the service-screen tabs both follow it.
export function ServiceOrderPanel({ services, onSaved, onCancel }: ServiceOrderPanelProps) {
  const { toast } = useToast();
  const [list, setList] = useState(services);
  const [saving, setSaving] = useState(false);

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  }

  async function save() {
    setSaving(true);
    const result = await reorderServices(list.map((s) => s.service_id));
    setSaving(false);
    if (!result.success) {
      toast({ title: 'Order not saved', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Service order saved — the app will show this order' });
    onSaved(list.map((s, idx) => ({ ...s, sort_order: idx + 1 })));
  }

  const changed = list.some((s, idx) => s.service_id !== services[idx]?.service_id);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use ↑ ↓ to arrange. #1 shows first on the app&apos;s Home screen and in the service tabs.
        Inactive services keep their place but stay hidden in the app.
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
        {list.map((service, idx) => {
          const imageUrl = serviceImageUrl(service.image_url);
          return (
            <div key={service.service_id} className="flex items-center gap-3 p-3">
              <span className="w-7 text-sm font-semibold text-gray-500 dark:text-gray-400">#{idx + 1}</span>
              <div className="h-10 w-10 shrink-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={service.service} className="h-full w-full object-contain" />
                ) : (
                  <ImageOff className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">{service.service}</p>
                <p className="text-xs text-muted-foreground">
                  {service.is_active ? 'Active' : 'Inactive'}
                  {service.is_active && !service.show_on_home ? ' · not on Home' : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={idx === 0 || saving}
                  onClick={() => move(idx, -1)}
                  aria-label={`Move ${service.service} up`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={idx === list.length - 1 || saving}
                  onClick={() => move(idx, 1)}
                  aria-label={`Move ${service.service} down`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={save}
          disabled={saving || !changed}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Order'
          )}
        </Button>
      </div>
    </div>
  );
}
