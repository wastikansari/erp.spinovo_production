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
import { CopilotApiService, Copilot } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { CopilotForm } from '@/components/forms/copilot-form';

export default function CopilotsPage() {
  const [copilots, setCopilots] = useState<Copilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCopilots, setTotalCopilots] = useState(0);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchCopilots = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING COPILOTS ===');
      console.log('Page:', page);
      
      const response = await CopilotApiService.getCopilots(page, 20);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);
      
      if (response.status && response.data) {
        console.log('=== PROCESSING DATA ===');
        console.log('Copilot list:', response.data.copilotList);
        console.log('Total copilots:', response.data.copilotTotal);
        
        setCopilots(response.data.copilotList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalCopilots(response.data.copilotTotal || 0);
        
        if (response.data.copilotList && response.data.copilotList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.copilotList.length} copilots`,
          });
        }
      } else {
        console.error('=== API ERROR ===');
        setError(response.msg || 'Failed to fetch copilots');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch copilots',
          variant: 'destructive',
        });
        setCopilots([]);
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
      setCopilots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    fetchCopilots(currentPage);
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
        return 'Copilot';
      case 1:
        return 'Senior Copilot';
      default:
        return 'Unknown';
    }
  };

  const handleViewDetails = (copilotId: string) => {
    router.push(`/dashboard/copilots/${copilotId}`);
  };

  const handleRefresh = () => {
    console.log('=== MANUAL REFRESH ===');
    fetchCopilots(currentPage);
  };

  const handleCreateSuccess = () => {
    fetchCopilots(currentPage);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (copilot: Copilot) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{copilot.name}</span>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (copilot: Copilot) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{copilot.mobile}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (copilot: Copilot) => (
        <Badge className={getRoleColor(copilot.role)}>
          {getRoleText(copilot.role)}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'status',
      header: 'Status',
      render: (copilot: Copilot) => (
        <Badge className={getStatusColor(copilot.status)}>
          {copilot.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'city_id',
      header: 'City ID',
      render: (copilot: Copilot) => (
        <span className="text-muted-foreground">{copilot.city_id || 'Not assigned'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (copilot: Copilot) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(copilot.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  const renderActions = (copilot: Copilot) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDetails(copilot._id)}>
          <Eye className="mr-2 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Copilots</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Copilot
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Copilot Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Copilots: {totalCopilots}
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
            data={copilots}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search copilots..."
            emptyMessage={error ? "Failed to load copilots." : "No copilots found."}
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
              <p>Copilots Count: {copilots.length}</p>
              <p>Total Copilots: {totalCopilots}</p>
              <p>Current Page: {currentPage}</p>
              <p>Total Pages: {totalPages}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CopilotForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}