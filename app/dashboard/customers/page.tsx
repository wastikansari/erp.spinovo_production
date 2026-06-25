'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { RefreshCw, AlertCircle, Users, MoreHorizontal, Eye, Phone, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerApiService, Customer } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { HeaderSection } from '@/components/ui/header-section';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchCustomers = async (page: number) => {
    try {
      setLoading(true);
      setError('');

      const response = await CustomerApiService.getCustomers(page, 20);

      if (response.status && response.data) {
        setCustomers(response.data.customerList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalCustomers(response.data.totalCustomers || 0);
      } else {
        setError(response.msg || 'Failed to fetch customers');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch customers',
          variant: 'destructive',
        });
        setCustomers([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleViewDetails = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const handleRefresh = () => {
    fetchCustomers(currentPage);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{customer.name}</span>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{customer.mobile}</span>
        </div>
      ),
    },
    {
      key: 'wallet_balance',
      header: 'Wallet Balance',
      render: (customer: Customer) => (
        <span className="font-medium text-green-600">₹{customer.wallet_balance}</span>
      ),
      searchable: false,
    },
    {
      key: 'living_type',
      header: 'Living Type',
      render: (customer: Customer) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          {customer.living_type || 'Not specified'}
        </span>
      ),
    },
    {
      key: 'city_id',
      header: 'City ID',
      render: (customer: Customer) => (
        <span className="text-muted-foreground">{customer.city_id}</span>
      ),
    },
    //     {
    //   key: 'Device Type',
    //   header: 'Device Type',
    //   render: (customer: Customer) => (
    //     <span className="text-muted-foreground">{customer.device_type || 'Not specified'  }</span>
    //   ),
    // },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(customer.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (customer: Customer) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(customer._id)}>
          <Eye className="mr-2 h-4 w-4" />
          Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Customers"
        handleRefresh={handleRefresh}
        loading={loading}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Customers: {totalCustomers}
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
            data={customers}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search customers..."
            emptyMessage={error ? "Failed to load customers." : "No customers found."}
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
    </div>
  );
}