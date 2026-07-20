'use client';

import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { B2BFullServiceCategory } from '@/lib/types/b2bService';

interface B2BServiceCardProps {
  service: B2BFullServiceCategory;
}

export function B2BServiceCard({ service }: B2BServiceCardProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800
                    bg-white dark:bg-gray-900 shadow-sm
                    p-5 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold capitalize text-gray-900 dark:text-gray-100">
            {service.service}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {service.description}
          </p>
        </div>

        {/* EDIT SERVICE BUTTON */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() =>
            router.push(
              `/dashboard/b2b-services/edit-service/${service.service_id}?serviceName=${encodeURIComponent(service.service)}&description=${encodeURIComponent(service.description)}`
            )
          }
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Service
        </Button>
      </div>

      {/* GARMENTS */}
      <div className="space-y-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {service.garment_details.length} garment type(s)
        </span>
        <div className="flex flex-wrap gap-2">
          {service.garment_details.map((garment) => (
            <button
              key={garment._id}
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/b2b-services/update/${garment._id}?serviceId=${service.service_id}&serviceName=${encodeURIComponent(service.service)}&name=${encodeURIComponent(garment.name)}&price=${encodeURIComponent(garment.price)}`
                )
              }
              className="group inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full
                         bg-gray-50 dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-200
                         hover:border-indigo-300 dark:hover:border-indigo-700
                         transition-colors"
            >
              {garment.name}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                ₹{garment.price}
              </span>
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* ADD GARMENT BUTTON */}
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 border-dashed border-indigo-300 dark:border-indigo-700
                   text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
        onClick={() =>
          router.push(
            `/dashboard/b2b-services/add-garment/${service.service_id}?serviceName=${encodeURIComponent(service.service)}`
          )
        }
      >
        <Plus className="h-4 w-4" />
        Add Garment
      </Button>
    </div>
  );
}
