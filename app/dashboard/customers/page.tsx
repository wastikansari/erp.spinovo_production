'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertCircle, Users, MoreHorizontal, Eye, Phone, User, Calendar,
  Search, Filter, X, IndianRupee, ShoppingBag,
} from 'lucide-react';
import { format } from 'date-fns';
import { CustomerApiService, CustomerFilters, Customer } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { HeaderSection } from '@/components/ui/header-section';

const EMPTY_FILTERS: CustomerFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  minSpending: '',
  maxSpending: '',
  minOrders: '',
  maxOrders: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string>('');

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter inputs (applied on "Apply" or Enter)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [maxSpending, setMaxSpending] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const fetchCustomers = useCallback(async (page: number, activeFilters: CustomerFilters, limit: number = pageSize) => {
    try {
      setLoading(true);
      setError('');
      const response = await CustomerApiService.getCustomers(page, limit, activeFilters);
      if (response.status && response.data) {
        setCustomers(response.data.customerList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalCustomers(response.data.totalCustomers || 0);
      } else {
        setError(response.msg || 'Failed to fetch customers');
        toast({ title: 'Error', description: response.msg || 'Failed to fetch customers', variant: 'destructive' });
        setCustomers([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({ title: 'Error', description: 'Network error. Please check your connection.', variant: 'destructive' });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [toast, pageSize]);

  // Debounce search input → update filters.search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev: CustomerFilters) => ({ ...prev, search: searchInput }));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when page, filters, or pageSize changes
  useEffect(() => {
    fetchCustomers(currentPage, filters, pageSize);
  }, [currentPage, filters, pageSize, fetchCustomers]);

  const activeFilterCount = [
    filters.dateFrom, filters.dateTo,
    filters.minSpending, filters.maxSpending,
    filters.minOrders, filters.maxOrders,
  ].filter(Boolean).length;

  const applyFilters = () => {
    setFilters({
      search: searchInput,
      dateFrom,
      dateTo,
      minSpending,
      maxSpending,
      minOrders,
      maxOrders,
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setMinSpending('');
    setMaxSpending('');
    setMinOrders('');
    setMaxOrders('');
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
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

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{customer.name}</span>
            <span className="text-xs text-muted-foreground">{customer.total_orders ?? 0} orders</span>
          </div>
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
      key: 'total_spending',
      header: 'Total Spending',
      render: (customer: Customer) => (
        <span className="font-medium text-green-600">₹{customer.total_spending ?? 0}</span>
      ),
      searchable: false,
    },
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

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Customers"
        handleRefresh={() => fetchCustomers(currentPage, filters)}
        loading={loading}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? 'Loading...' : `${totalCustomers} customer${totalCustomers !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          {/* Search + Filter Bar */}
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or mobile..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
              className="gap-2 shrink-0"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-white text-primary text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {(activeFilterCount > 0 || searchInput) && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground shrink-0">
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Date Range */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> CREATED DATE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Spending Range */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> TOTAL SPENDING (₹)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input type="number" min="0" placeholder="0" value={minSpending} onChange={(e) => setMinSpending(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input type="number" min="0" placeholder="Any" value={maxSpending} onChange={(e) => setMaxSpending(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Orders Range */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" /> NUMBER OF ORDERS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input type="number" min="0" placeholder="0" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input type="number" min="0" placeholder="Any" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => {
                  setDateFrom(''); setDateTo('');
                  setMinSpending(''); setMaxSpending('');
                  setMinOrders(''); setMaxOrders('');
                }}>
                  Reset
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.dateFrom && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  From: {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  To: {filters.dateTo}
                </span>
              )}
              {filters.minSpending && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                  Spending ≥ ₹{filters.minSpending}
                </span>
              )}
              {filters.maxSpending && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                  Spending ≤ ₹{filters.maxSpending}
                </span>
              )}
              {filters.minOrders && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200">
                  Orders ≥ {filters.minOrders}
                </span>
              )}
              {filters.maxOrders && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200">
                  Orders ≤ {filters.maxOrders}
                </span>
              )}
            </div>
          )}
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
            emptyMessage={error ? 'Failed to load customers.' : 'No customers found matching your filters.'}
            actions={renderActions}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
