'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { VendorApiService } from '@/lib/api/vender';
import { useToast } from '@/hooks/use-toast';
import VendorForm from '@/components/forms/vender-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function VendorsPage() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await VendorApiService.getVendorList();
      if (res?.status) {
        setVendors(res.data?.venderList || []);
      }
    } catch {
      toast({ title: 'Failed to load vendors', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  if (loading) return <LoadingSpinner text="Loading vendors..." />;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Vendor
        </Button>
      </div>

      {/* LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendors.map((v) => (
            <div
              key={v._id}
              className="flex justify-between items-center border rounded p-3"
            >
              <div>
                <div className="font-semibold">{v.name}</div>
                <div className="text-sm text-muted-foreground">
                  {v.mobile} • {v.cityName}, {v.stateName}
                </div>
              </div>

              <Badge variant={v.accountIsActive ? 'default' : 'secondary'}>
                {v.accountIsActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MODAL */}
      {openForm && (
        <VendorForm
          onClose={() => setOpenForm(false)}
          onSuccess={fetchVendors}
        />
      )}
    </div>
  );
}
