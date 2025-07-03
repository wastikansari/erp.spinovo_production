'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  AlertCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { TransactionApiService, Transaction } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchTransactions = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING TRANSACTIONS ===');
      console.log('Page:', page);
      
      const response = await TransactionApiService.getTransactions(page, 20);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);
      
      if (response.status && response.data) {
        console.log('=== PROCESSING DATA ===');
        console.log('Transaction list:', response.data.transactionList);
        
        setTransactions(response.data.transactionList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalTransactions(response.data.totalTransaction || 0);
        
        if (response.data.transactionList && response.data.transactionList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.transactionList.length} transactions`,
          });
        }
      } else {
        console.error('=== API ERROR ===');
        setError(response.msg || 'Failed to fetch transactions');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch transactions',
          variant: 'destructive',
        });
        setTransactions([]);
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
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    fetchTransactions(currentPage);
  }, [currentPage]);

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'credit' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getStatusColor = (status: number) => {
    return status === 1
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const handleViewCustomerDetails = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const handleRefresh = () => {
    console.log('=== MANUAL REFRESH ===');
    fetchTransactions(currentPage);
  };

  const columns = [
    {
      key: 'transaction_id',
      header: 'Transaction ID',
      render: (transaction: Transaction) => (
        <span className="font-medium">{transaction.transaction_id}</span>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Type',
      render: (transaction: Transaction) => (
        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
          <div className="flex items-center gap-1">
            {transaction.transaction_type === 'credit' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {transaction.transaction_type.toUpperCase()}
          </div>
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (transaction: Transaction) => (
        <span className={transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}>
          {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
        </span>
      ),
      searchable: false,
    },
    {
      key: 'wallet_type',
      header: 'Wallet Type',
      render: (transaction: Transaction) => (
        <Badge variant="secondary" className="capitalize">
          {transaction.wallet_type}
        </Badge>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (transaction: Transaction) => (
        <div className="max-w-[200px]">
          <p className="font-medium text-sm">{transaction.reason}</p>
          <p className="text-xs text-muted-foreground truncate">{transaction.message}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (transaction: Transaction) => (
        <Badge className={getStatusColor(transaction.status)}>
          {transaction.status === 1 ? 'Success' : 'Failed'}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'gateway_response',
      header: 'Gateway Response',
      render: (transaction: Transaction) => (
        <Badge variant="outline" className="capitalize">
          {transaction.gateway_response}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (transaction: Transaction) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(transaction.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (transaction: Transaction) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewCustomerDetails(transaction.customer_id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Transactions: {totalTransactions}
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
            data={transactions}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search transactions..."
            emptyMessage={error ? "Failed to load transactions." : "No transactions found."}
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

          {/* Debug Information (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
              <p>Transactions Count: {transactions.length}</p>
              <p>Total Transactions: {totalTransactions}</p>
              <p>Current Page: {currentPage}</p>
              <p>Total Pages: {totalPages}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}