'use client';

import { useEffect, useState } from 'react';
import { getServiceCategories } from '@/lib/api/service';
import { ServiceCard } from "@/app/dashboard/services/service-card"

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    async function loadServices() {
      const token = getToken();
      const data = await getServiceCategories();
      setServices(data);
      setLoading(false);
    }

    loadServices();
  }, []);

  if (loading) {
    return <p className="p-6">Loading services...</p>;
  }

  if (!services.length) {
    return <p className="p-6">No services found</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Services & Garments</h1>

      {services.map((service) => (
        <ServiceCard key={service.service_id} service={service} />
      ))}
    </div>
  );
}
