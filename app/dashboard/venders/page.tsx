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
  Calendar
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
  const router = useRouter();
  const { toast } = useToast();

  const fetchVendors = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING VENDORS ===');
      console.log('Page:', page);

      const response = await VendorApiService.getVendors(page, 20);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);

      if (response.status && response.data) {
        console.log('=== PROCESSING DATA ===');
        console.log('Vendor list:', response.data.vendorList);
        console.log('Total vendors:', response.data.totalVendor);

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
    console.log('=== COMPONENT MOUNTED ===');
    fetchVendors(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: number) => {
    return status === 1
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case 0:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 1:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getRoleText = (role: number) => {
    switch (role) {
      case 0:
        return 'Vendor';
      case 1:
        return 'Senior Vendor';
      default:
        return 'Unknown';
    }
  };

  const handleViewDetails = (vendorId: string) => {
    router.push(`/dashboard/vendor/${vendorId}`);
  };

  const handleRefresh = () => {
    console.log('=== MANUAL REFRESH ===');
    fetchVendors(currentPage);
  };

  const handleCreateSuccess = () => {
    fetchVendors(currentPage);
  };

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
    // {
    //   key: 'role',
    //   header: 'Role',
    //   render: (vendor: Vendor) => (
    //     <Badge className={getRoleColor(vendor.cityName)}>
    //       {getRoleText(vendor.cityName)}
    //     </Badge>
    //   ),
    //   searchable: false,
    // },
    // {
    //   key: 'status',
    //   header: 'Status',
    //   render: (vendor: Vendor) => (
    //     // <Badge className={getStatusColor(vendor.accountIsActive)}>
    //     // { vendor.accountIsActive === true ? 'Active' : 'Inactive' }
    //     // </Badge>
    //   ),
    //   searchable: false,
    // },
    {
      key: 'city_id',
      header: 'City ID',
      render: (vendor: Vendor) => (
        <span className="text-muted-foreground">{vendor.cityName || 'Not assigned'}</span>
      ),
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
        {/* <DropdownMenuItem onClick={() => handleViewDetails(vendor._id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem> */}
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
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Vendor
          </Button>
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

          <DataTable
            data={vendors}
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
