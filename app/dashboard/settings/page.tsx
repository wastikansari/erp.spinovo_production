'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User, Bell, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthService } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };
  const confirmLogout = () => {
    AuthService.logout();
    setShowLogoutDialog(false);
    router.push('/auth/login');
  };

  // const handleLogout = async () => {
  //   try {
  //     setLoading(true);
  //     // Example: Clear tokens or session here
  //     localStorage.removeItem('authToken');
  //     sessionStorage.removeItem('user');

  //     toast({
  //       title: 'Logout Successful',
  //       description: 'You have been logged out successfully.',
  //     });

  //     // Redirect to login page
  //     router.push('/login');
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to logout. Please try again.',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
        </div>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Manage your account preferences and security options.
            </div>

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push('/dashboard/profile')}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Enable or disable notifications for updates and alerts.
            </div>
            <Button variant="outline" className="mt-3">
              Manage Notifications
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Update your password and manage security settings.
            </div>
            <Button variant="outline" className="mt-3">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Logout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Click below to safely logout from your account.
            </div>
            <Button
              onClick={handleLogout}
              className="bg-destructive text-white hover:bg-destructive/90 w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to login again to access the admin panel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLogout}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>



  );
}
