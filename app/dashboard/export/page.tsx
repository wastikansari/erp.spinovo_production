'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Users, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { CustomerApiService } from '@/lib/api';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await CustomerApiService.exportCustomers();
      setSuccess('Customer data exported successfully. Check your downloads folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Get Export</h1>
        <p className="text-muted-foreground mt-1">Download customer data as an Excel file</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Customer Info</p>
            <p className="text-xs text-muted-foreground">Name, mobile, email, city, gender</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Order Count</p>
            <p className="text-xs text-muted-foreground">Total number of orders per customer</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Excel Format</p>
            <p className="text-xs text-muted-foreground">Download as .xlsx ready to open in Excel</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Customer Export
          </CardTitle>
          <CardDescription>
            Exports all customers with their profile details and total order count into a single Excel sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={loading} size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? 'Generating Export...' : 'Download Customer List'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
