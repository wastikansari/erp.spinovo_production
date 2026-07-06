'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  BadgePercent,
  Gift,
  Hand,
  Heart,
  IndianRupee,
  Package,
  Receipt,
  ReceiptText,
  Truck,
  Wallet,
} from 'lucide-react';

import { DashboardApiService, RevenueSummary } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeaderSection } from '@/components/ui/header-section';

function formatCurrency(value: number) {
  return `₹${(value || 0).toLocaleString('en-IN')}`;
}

interface RevenueTile {
  label: string;
  subtitle?: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function RevenuePage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchRevenueSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await DashboardApiService.getRevenueSummary();
      if (response.status && response.data) {
        setSummary(response.data);
      } else {
        setError(response.msg || 'Failed to fetch revenue summary');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({
        title: 'Error',
        description: 'Failed to fetch revenue summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRevenueSummary();
  }, [fetchRevenueSummary]);

  const primaryTiles: RevenueTile[] = summary
    ? [
        {
          label: 'Garment Order Amount',
          subtitle: 'Expected amount, before charges & discounts',
          value: summary.totalRevenue,
          icon: <IndianRupee className="h-5 w-5" />,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
        },
        {
          label: 'Total Revenue (Billed)',
          subtitle: 'Final amount after charges & discounts',
          value: summary.totalBilling,
          icon: <Receipt className="h-5 w-5" />,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
        },
        {
          label: 'Total Paid Amount',
          value: summary.totalPaidAmount,
          icon: <Wallet className="h-5 w-5" />,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        {
          label: 'Total Unpaid Amount',
          value: summary.totalUnpaidAmount,
          icon: <ReceiptText className="h-5 w-5" />,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
        },
      ]
    : [];

  const breakdownTiles: RevenueTile[] = summary
    ? [
        {
          label: 'Tip Amount',
          value: summary.totalTipAmount,
          icon: <Heart className="h-5 w-5" />,
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-600',
        },
        {
          label: 'Offer Amount',
          value: summary.totalOfferAmount,
          icon: <Gift className="h-5 w-5" />,
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
        {
          label: 'Slot Charges',
          value: summary.totalSlotCharges,
          icon: <BadgePercent className="h-5 w-5" />,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        {
          label: 'Handling Charges',
          value: summary.totalHandlingCharges,
          icon: <Hand className="h-5 w-5" />,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          label: 'Service Charges',
          value: summary.totalServiceCharges,
          icon: <Package className="h-5 w-5" />,
          iconBg: 'bg-teal-100',
          iconColor: 'text-teal-600',
        },
        {
          label: 'Delivery Charge',
          value: summary.totalDeliveryCharge,
          icon: <Truck className="h-5 w-5" />,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Revenue"
        loading={loading}
        handleRefresh={fetchRevenueSummary}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <span className="text-sm text-muted-foreground">Loading revenue summary...</span>
          </CardContent>
        </Card>
      ) : summary ? (
        <>
          <p className="text-sm text-muted-foreground">
            Aggregated across all <span className="font-medium text-foreground">{summary.totalOrders.toLocaleString('en-IN')}</span> orders (all-time)
          </p>

          {/* Primary revenue tiles */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {primaryTiles.map((tile) => (
              <Card key={tile.label} className="rounded-2xl border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={tile.iconColor}>{tile.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{tile.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-0.5">{formatCurrency(tile.value)}</p>
                    {tile.subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tile.subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charge breakdown */}
          <div>
            <h2 className="text-lg font-semibold tracking-tight mb-3">Charges Breakdown</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
              {breakdownTiles.map((tile) => (
                <Card key={tile.label} className="rounded-2xl border shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0`}>
                      <span className={tile.iconColor}>{tile.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{tile.label}</p>
                      <p className="text-lg sm:text-xl font-bold mt-0.5">{formatCurrency(tile.value)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
