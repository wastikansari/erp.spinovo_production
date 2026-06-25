// 'use client';

// import { useEffect, useState } from 'react';
// import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Plus } from 'lucide-react';
// import { VendorApiService } from '@/lib/api/vendor';
// import { useToast } from '@/hooks/use-toast';
// import VendorForm from '@/components/forms/vender-form';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';

// export default function VendorsPage() {
//   const { toast } = useToast();
//   const [vendors, setVendors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [openForm, setOpenForm] = useState(false);

//   const fetchVendors = async () => {
//     try {
//       setLoading(true);
//       const res = await VendorApiService.getVendorList();
//       if (res?.status) {
//         setVendors(res.data?.venderList || []);
//       }
//     } catch {
//       toast({ title: 'Failed to load vendors', variant: 'destructive' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVendors();
//   }, []);

//   if (loading) return <LoadingSpinner text="Loading vendors..." />;

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold">Vendors</h1>
//         <Button onClick={() => setOpenForm(true)}>
//           <Plus className="mr-2 h-4 w-4" />
//           Register Vendor
//         </Button>
//       </div>

//       {/* LIST */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Vendor List</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-3">
//           {vendors.map((v) => (
//             <div
//               key={v._id}
//               className="flex justify-between items-center border rounded p-3"
//             >
//               <div>
//                 <div className="font-semibold">{v.name}</div>
//                 <div className="text-sm text-muted-foreground">
//                   {v.mobile} • {v.cityName}, {v.stateName}
//                 </div>
//               </div>

//               <Badge variant={v.accountIsActive ? 'default' : 'secondary'}>
//                 {v.accountIsActive ? 'Active' : 'Inactive'}
//               </Badge>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* MODAL */}
//       {openForm && (
//         <VendorForm
//           onClose={() => setOpenForm(false)}
//           onSuccess={fetchVendors}
//         />
//       )}
//     </div>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  AlertCircle,
  Users,
  Plus,
  MoreHorizontal,
  Eye,
  Phone,
  User,
  Calendar,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { VendorApiService, Vendor } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import VendorForm from '@/components/forms/vendor-form';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');
  const router = useRouter();
  const { toast } = useToast();

  const fetchVendors = async (page: number) => {
    try {
      setLoading(true);
      setError('');

      const response = await VendorApiService.getVendors(page, 20);

      if (response.status && response.data) {

        setVendors(response.data.vendorList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalVendors(response.data.totalVendor || 0);

        if (response.data.vendorList && response.data.vendorList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.vendorList.length} vendors`,
          });
        }
      } else {
        console.error('=== API ERROR ===');
        setError(response.msg || 'Failed to fetch vendors');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch vendors',
          variant: 'destructive',
        });
        setVendors([]);
      }
    } catch (error) {
      console.error('=== FETCH ERROR ===');
      console.error('Error details:', error);

      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' };
      case 'submitted':
        return { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' };
      default:
        return { label: 'Not Submitted', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  const handleViewDetails = (vendorId: string) => {
    router.push(`/dashboard/vendor/${vendorId}`);
  };

  const handleRefresh = () => {
    fetchVendors(currentPage);
  };

  const handleCreateSuccess = () => {
    fetchVendors(currentPage);
  };

  const filteredVendors = vendors.filter(v => {
    if (onlineFilter === 'online') return v.isOnline;
    if (onlineFilter === 'offline') return !v.isOnline;
    return true;
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (vendor: Vendor) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{vendor.name}</span>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (vendor: Vendor) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{vendor.mobile}</span>
        </div>
      ),
    },
    {
      key: 'isOnline',
      header: 'Status',
      render: (vendor: Vendor) => (
        <div className="flex items-center gap-1.5">
          {vendor.isOnline ? (
            <><Wifi className="h-3.5 w-3.5 text-green-500" /><Badge className="bg-green-100 text-green-800 text-xs">Online</Badge></>
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-gray-400" /><Badge className="bg-gray-100 text-gray-600 text-xs">Offline</Badge></>
          )}
        </div>
      ),
      searchable: false,
    },
    {
      key: 'city_id',
      header: 'City',
      render: (vendor: Vendor) => (
        <span className="text-muted-foreground">{vendor.cityName || 'Not assigned'}</span>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC Status',
      render: (vendor: Vendor) => {
        const badge = getKycBadge(vendor.kycStatus);
        return <Badge className={badge.className}>{badge.label}</Badge>;
      },
      searchable: false,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (vendor: Vendor) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(vendor.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (vendor: Vendor) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(vendor._id)}>
          <Eye className="mr-2 h-4 w-4" />
          View / Review KYC
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* <Button onClick={() => setShowCreateForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Vendor
          </Button> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendor Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Vendors: {totalVendors}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Online/Offline filter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {(['all', 'online', 'offline'] as const).map(f => (
              <button
                key={f}
                onClick={() => setOnlineFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  onlineFilter === f
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {f === 'all' ? `All (${vendors.length})` : f === 'online' ? `Online (${vendors.filter(v => v.isOnline).length})` : `Offline (${vendors.filter(v => !v.isOnline).length})`}
              </button>
            ))}
          </div>

          <DataTable
            data={filteredVendors}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search vendors..."
            emptyMessage={error ? "Failed to load vendors." : "No vendors found."}
            actions={renderActions}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>

        </CardContent>
      </Card>

      {/* MODAL
     {openForm && (
      <VendorForm
          onClose={() => setOpenForm(false)}
          onSuccess={fetchVendors}
        />
      )} */}

      {/* // <VendorForm */}
      {/* //   open={showCreateForm} */}
      {/* //   onOpenChange={setShowCreateForm} */}
      {/* //   onSuccess={handleCreateSuccess} */}
      {/* // /> */}
    </div>
  );
}
