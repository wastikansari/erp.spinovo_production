'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, RotateCcw, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getB2BCompanies } from '@/lib/api/b2bCompany';
import {
  getB2BCompanyPricing,
  proposeB2BPrice,
  getB2BPendingPricing,
  approveB2BPrice,
  rejectB2BPrice,
  resetB2BPrice,
} from '@/lib/api/b2bPricing';
import { B2BCompany } from '@/lib/types/b2bCompany';
import { B2BCompanyPricingResponse, B2BPendingPricing, B2BPricingStatus } from '@/lib/types/b2bPricing';
import { AuthService } from '@/lib/auth';
import { canApproveB2BPricing } from '@/lib/permissions';

const STATUS_BADGE: Record<B2BPricingStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  none: { label: 'Default', variant: 'outline' },
  pending: { label: 'Pending Approval', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function B2BPricingPage() {
  const { toast } = useToast();
  const user = AuthService.getUser();
  const canApprove = canApproveB2BPricing(user);

  const [companies, setCompanies] = useState<B2BCompany[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [pricing, setPricing] = useState<B2BCompanyPricingResponse | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [pending, setPending] = useState<B2BPendingPricing[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    getB2BCompanies().then(setCompanies).catch(() => {});
  }, []);

  const loadPricing = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingPricing(true);
    const res = await getB2BCompanyPricing(id);
    setPricing(res);
    setLoadingPricing(false);
  }, []);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    setPending(await getB2BPendingPricing());
    setLoadingPending(false);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (companyId) loadPricing(companyId);
  }, [companyId, loadPricing]);

  const propose = async (serviceId: number, garmentId: string, defaultPrice: string) => {
    const key = `${serviceId}:${garmentId}`;
    const price = (editValues[key] ?? defaultPrice).trim();
    if (!price) return;

    setSavingKey(key);
    const result = await proposeB2BPrice(companyId, { serviceId, garmentId, price });
    setSavingKey(null);

    if (!result.success) {
      toast({ title: 'Failed to propose price', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Price proposed', description: 'Pending admin approval.' });
    loadPricing(companyId);
    loadPending();
  };

  const doReset = async (pricingId: string) => {
    setSavingKey(pricingId);
    const result = await resetB2BPrice(pricingId);
    setSavingKey(null);
    if (!result.success) {
      toast({ title: 'Failed to reset', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Reverted to default pricing' });
    loadPricing(companyId);
  };

  const act = async (pricingId: string, action: 'approve' | 'reject') => {
    setSavingKey(pricingId);
    const result = action === 'approve' ? await approveB2BPrice(pricingId) : await rejectB2BPrice(pricingId);
    setSavingKey(null);
    if (!result.success) {
      toast({ title: `Failed to ${action}`, description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: action === 'approve' ? 'Price approved and is now live' : 'Proposal rejected' });
    loadPending();
    if (companyId) loadPricing(companyId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">B2B Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Company-specific service pricing overrides — proposed prices go live only after admin approval.
        </p>
      </div>

      <Tabs defaultValue="by-company">
        <TabsList>
          <TabsTrigger value="by-company">By Company</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pending.length > 0 && <Badge variant="secondary" className="ml-2">{pending.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-company" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {companyId && (
              <Button variant="outline" size="sm" onClick={() => loadPricing(companyId)} disabled={loadingPricing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingPricing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {!companyId ? (
            <div className="py-16 text-center text-muted-foreground">Select a company to view/edit its pricing.</div>
          ) : loadingPricing ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            pricing?.services.map((svc) => (
              <Card key={svc.serviceId}>
                <CardContent className="pt-6">
                  <h3 className="mb-3 font-semibold">{svc.serviceName}</h3>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Garment</TableHead>
                          <TableHead>Default Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Current / Proposed</TableHead>
                          <TableHead className="w-64">Propose new price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {svc.garments.map((g) => {
                          const key = `${svc.serviceId}:${g.garmentId}`;
                          const badge = STATUS_BADGE[g.status];
                          return (
                            <TableRow key={g.garmentId}>
                              <TableCell className="font-medium">{g.garmentName}</TableCell>
                              <TableCell>₹{g.defaultPrice}</TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {g.status === 'pending' ? (
                                  <span className="text-muted-foreground">₹{g.proposedPrice} (awaiting approval)</span>
                                ) : (
                                  <span className={g.status === 'approved' ? 'font-medium' : ''}>₹{g.currentPrice}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    className="w-28"
                                    placeholder={g.currentPrice}
                                    value={editValues[key] ?? ''}
                                    onChange={(e) =>
                                      setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    disabled={savingKey === key || !(editValues[key] ?? '').trim()}
                                    onClick={() => propose(svc.serviceId, g.garmentId, g.currentPrice)}
                                  >
                                    {savingKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Propose'}
                                  </Button>
                                  {g.status === 'approved' && canApprove && g.pricingId && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      title="Reset to default"
                                      disabled={savingKey === g.pricingId}
                                      onClick={() => doReset(g.pricingId as string)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Garment</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Proposed</TableHead>
                      <TableHead>Proposed By</TableHead>
                      {canApprove && <TableHead className="w-40">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPending ? (
                      <TableRow>
                        <TableCell colSpan={canApprove ? 6 : 5} className="text-center py-10">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : pending.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canApprove ? 6 : 5} className="text-center py-10 text-muted-foreground">
                          No pending price proposals.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pending.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>
                            {typeof p.company_id === 'string' ? p.company_id : p.company_id.companyName}
                          </TableCell>
                          <TableCell>{p.garmentName}</TableCell>
                          <TableCell>₹{p.defaultPriceSnapshot}</TableCell>
                          <TableCell className="font-medium">₹{p.proposedPrice}</TableCell>
                          <TableCell>
                            {typeof p.proposedBy === 'string' ? p.proposedBy : p.proposedBy.name}
                          </TableCell>
                          {canApprove && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  disabled={savingKey === p._id}
                                  onClick={() => act(p._id, 'approve')}
                                >
                                  <Check className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  disabled={savingKey === p._id}
                                  onClick={() => act(p._id, 'reject')}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
