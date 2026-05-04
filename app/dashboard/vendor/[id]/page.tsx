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
import { VendorDetailsData, VendorApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VenderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const venderId = params.id as string;
  const { toast } = useToast();

  const [venderData, setVenderData] = useState<VendorDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== VENDER DETAILS PAGE ===');
      console.log('Vender ID from params:', venderId);

      if (!venderId) {
        setError('Vender ID is missing');
        return;
      }

      const response = await VendorApiService.getVendorDetails(venderId);

      console.log('=== VENDER DETAILS RESPONSE ===');
      console.log('Response:', response);

      if (response.status && response.data) {
        setVenderData(response.data);
        console.log('Vender details loaded successfully');
        toast({
          title: 'Success',
          description: 'Vender details loaded successfully',
        });
      } else {
        const errorMsg = response.msg || 'Failed to fetch vender details';
        setError(errorMsg);
        console.error('API Error:', errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('=== VENDER DETAILS ERROR ===');
      console.error('Error details:', error);

      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load vendor details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== VENDER DETAILS COMPONENT MOUNTED ===');
    console.log('Vender ID:', venderId);

    if (venderId && venderId !== 'undefined') {
      fetchVendorDetails();
    } else {
      setError('Invalid vender ID');
      setLoading(false);
    }
  }, [venderId]);

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
          <Link href="/dashboard/venders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Details</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading vendor details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !venderData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendor">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Details</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Vendor not found'}
                <div className="mt-2">
                  <Button onClick={fetchVendorDetails} variant="outline" size="sm">
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

  const { vendorUser } = venderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vendor">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Details</h1>
        <Button onClick={fetchVendorDetails} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Vendor Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Vendor Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{venderData.vendorUser.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{venderData.vendorUser.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{venderData.vendorUser.email || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className={getRoleColor(venderData.vendorUser.mobile)}>
                    {getRoleText(venderData.vendorUser.mobile)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(venderData.vendorUser.mobile)}>
                  {venderData.vendorUser.accountIsActive === true ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">City ID</p>
                  <p className="font-medium">{venderData.vendorUser.cityName || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(venderData.vendorUser.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(venderData.vendorUser.updatedAt)}</p>
              </div>
              <div>
                {/* <p className="text-sm text-muted-foreground">Deleted</p>
                <Badge variant={venderData.vendorUser.is_deleted === 0 ? "default" : "destructive"}>
                  {venderData.vendorUser.is_deleted === 0 ? 'No' : 'Yes'}
                </Badge> */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Profile Picture </p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {venderData.vendorUser.profilePic || "No Profile Pic"}
                  </code>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Id Proof Picture</p>
                <p className="font-medium text-xs break-all">
                  {venderData.vendorUser.idProofPic || 'Not available'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* <div>
                <p className="text-sm text-muted-foreground">Access Token</p>
                <p className="font-medium text-xs break-all">
                  {venderData.vendorUser. ? `${copilotUser.access_token.substring(0, 20)}...` : 'Not available'}
                </p>
              </div> */}
              <div>
                <p className="text-sm text-muted-foreground">Area Cover</p>
                <p className="font-medium">
                  {venderData.vendorUser.areaCover || 'Not uploaded'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}