'use client';

import { useEffect, useState } from 'react';
import { getServiceCategories } from '@/lib/api/service';
import { FullServiceCategory } from '@/lib/types/booking';
import { ServiceCard } from '@/app/dashboard/services/service-card';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<FullServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const data = await getServiceCategories();
    console.log(data);
    console.log(data[0].category_list[0]);
    setServices(data);
    setLoading(false);
  }
  useEffect(() => {

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-300">
        Loading services...
      </div>
    );
  }

  const handleRefresh = () => {
    console.log('=== MANUAL REFRESH ===');
    load();
    // fetchCustomers(currentPage);
  };

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Services & Garments"
        handleRefresh={handleRefresh}
        loading={loading}
      />
      <Card>
        {/* PAGE HEADER */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Garments Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Manage service categories, prices and garment types
          </div>
        </CardHeader>
        {/* SERVICE GRID */}
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.service_id}
                service={service}
              />
            ))}
          </div>
        </CardContent>

      </Card>
    </div>
  );
}
