'use client';

import { useRouter } from 'next/navigation';
import { Pencil, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FullServiceCategory } from '@/lib/types/booking';

interface ServiceCardProps {
  service: FullServiceCategory;
}

export function ServiceCard({ service }: ServiceCardProps) {
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
          <div className="flex gap-4 text-sm mt-2 text-gray-600 dark:text-gray-400">
            <span>⏱ {service.duration}</span>
            <span>📦 Min Qty: {service.min_qty}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.service_duration_hours}h
            </span>
          </div>
        </div>

        {/* EDIT SERVICE BUTTON */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() =>
            router.push(
              `/dashboard/services/edit-service/${service.service_id}?serviceName=${encodeURIComponent(service.service)}&duration=${service.service_duration_hours}`
            )
          }
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Service
        </Button>
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
