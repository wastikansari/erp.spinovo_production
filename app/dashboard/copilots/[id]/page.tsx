'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Shield,
  Key,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CopilotApiService, CopilotDetailsData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CopilotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const copilotId = params.id as string;
  const { toast } = useToast();

  const [copilotData, setCopilotData] = useState<CopilotDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCopilotDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('=== COPILOT DETAILS PAGE ===');
      console.log('Copilot ID from params:', copilotId);
      
      if (!copilotId) {
        setError('Copilot ID is missing');
        return;
      }
      
      const response = await CopilotApiService.getCopilotDetails(copilotId);
      
      console.log('=== COPILOT DETAILS RESPONSE ===');
      console.log('Response:', response);
      
      if (response.status && response.data) {
        setCopilotData(response.data);
        console.log('Copilot details loaded successfully');
        toast({
          title: 'Success',
          description: 'Copilot details loaded successfully',
        });
      } else {
        const errorMsg = response.msg || 'Failed to fetch copilot details';
        setError(errorMsg);
        console.error('API Error:', errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('=== COPILOT DETAILS ERROR ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load copilot details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== COPILOT DETAILS COMPONENT MOUNTED ===');
    console.log('Copilot ID:', copilotId);
    
    if (copilotId && copilotId !== 'undefined') {
      fetchCopilotDetails();
    } else {
      setError('Invalid copilot ID');
      setLoading(false);
    }
  }, [copilotId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/copilots">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Copilots
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Copilot Details</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading copilot details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !copilotData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/copilots">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Copilots
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Copilot Details</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Copilot not found'}
                <div className="mt-2">
                  <Button onClick={fetchCopilotDetails} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { copilotUser } = copilotData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/copilots">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Copilots
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Copilot Details</h1>
        <Button onClick={fetchCopilotDetails} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Copilot Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Copilot Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{copilotUser.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{copilotUser.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{copilotUser.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className={getRoleColor(copilotUser.role)}>
                    {getRoleText(copilotUser.role)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(copilotUser.status)}>
                  {copilotUser.status === 1 ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">City ID</p>
                  <p className="font-medium">{copilotUser.city_id || 'Not assigned'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(copilotUser.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(copilotUser.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deleted</p>
                <Badge variant={copilotUser.is_deleted === 0 ? "default" : "destructive"}>
                  {copilotUser.is_deleted === 0 ? 'No' : 'Yes'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {copilotUser._id}
                  </code>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">FCM Token</p>
                <p className="font-medium text-xs break-all">
                  {copilotUser.fcmToken || 'Not available'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Access Token</p>
                <p className="font-medium text-xs break-all">
                  {copilotUser.access_token ? `${copilotUser.access_token.substring(0, 20)}...` : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profile Picture</p>
                <p className="font-medium">
                  {copilotUser.profile_pic || 'Not uploaded'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <p>Copilot ID: {copilotId}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
          <p>Copilot Data: {copilotData ? 'Loaded' : 'Not loaded'}</p>
          <p>Name: {copilotUser?.name || 'N/A'}</p>
          <p>Role: {copilotUser?.role || 'N/A'}</p>
          <p>Status: {copilotUser?.status || 'N/A'}</p>
        </div>
      )}
    </div>
  );
}