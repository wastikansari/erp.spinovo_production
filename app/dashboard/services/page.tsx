'use client';

import { useEffect, useState } from 'react';
import { getServiceCategories } from '@/lib/api/service';
import { ServiceCard } from '@/app/dashboard/services/service-card';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token');
      const data = await getServiceCategories(token);
      setServices(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-300">
        Loading services...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Services & Garments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage service categories, prices and garment types
          </p>
        </div>
      </div>

      {/* SERVICE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.service_id}
            service={service}
          />
        ))}
      </div>
    </div>
  );
}
