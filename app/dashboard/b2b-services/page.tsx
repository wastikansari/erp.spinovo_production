'use client';

import { useEffect, useState } from 'react';
import { getB2BServiceCategories } from '@/lib/api/b2bService';
import { B2BFullServiceCategory } from '@/lib/types/b2bService';
import { B2BServiceCard } from '@/app/dashboard/b2b-services/service-card';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';

export default function B2BServicesPage() {
  const [services, setServices] = useState<B2BFullServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getB2BServiceCategories();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load B2B services');
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
        Loading B2B services...
      </div>
    );
  }

  const handleRefresh = () => {
    load();
  };

  return (
    <div className="space-y-6">
      <HeaderSection
        title="B2B Services & Pricing"
        handleRefresh={handleRefresh}
        loading={loading}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            B2B Catalog Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Manage service categories, prices and garment types for corporate (B2B) accounts —
            separate from retail pricing.
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
              No B2B services found.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {services.map((service) => (
                <B2BServiceCard
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
