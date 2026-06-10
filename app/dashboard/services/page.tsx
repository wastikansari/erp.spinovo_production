'use client';

import { useEffect, useState } from 'react';
import { getServiceCategories } from '@/lib/api/service';
import { FullServiceCategory } from '@/lib/types/booking';
import { ServiceCard } from '@/app/dashboard/services/service-card';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<FullServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getServiceCategories();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
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
    load();
  };

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Services & Garments"
        handleRefresh={handleRefresh}
        loading={loading}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Garments Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Manage service categories, prices and garment types
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : services.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No services found.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.service_id}
                  service={service}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
