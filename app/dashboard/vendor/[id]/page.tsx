'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FileText,
  CheckCircle2,
  XCircle,
  Briefcase,
  IndianRupee,
  ImageOff,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  VendorKycDetailData,
  VendorServicePrice,
  VendorApiService,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vendorKycImageUrl } from '@/lib/utils';
import { VendorOrderApiService } from '@/lib/api/vendorOrders';
import { VendorOrderSummaryData, VendorOrder } from '@/lib/types/vendor-orders';

export default function VendorKycDetailsPage() {
  const params = useParams();
  const vendorId = params.id as string;
  const { toast } = useToast();

  const [data, setData] = useState<VendorKycDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderSummary, setOrderSummary] = useState<VendorOrderSummaryData | null>(null);

  // action state
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // per-price-entry actions
  const [priceActionId, setPriceActionId] = useState<string | null>(null);
  const [priceRejectOpen, setPriceRejectOpen] = useState(false);
  const [priceRemark, setPriceRemark] = useState('');
  const [priceRejecting, setPriceRejecting] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      if (!vendorId) {
        setError('Vendor ID is missing');
        return;
      }
      const res = await VendorApiService.getVendorKycDetail(vendorId);
      if (res.status && res.data) {
        setData(res.data);
      } else {
        setError(res.msg || 'Failed to fetch vendor KYC details');
        toast({ title: 'Error', description: res.msg || 'Failed to load', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({ title: 'Error', description: 'Failed to load vendor details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId && vendorId !== 'undefined') {
      fetchDetail();
      VendorOrderApiService.getVendorOrderSummary(vendorId)
        .then(res => { if (res.status && res.data) setOrderSummary(res.data); })
        .catch(() => {});
    } else {
      setError('Invalid vendor ID');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await VendorApiService.approveKyc(vendorId);
      if (res.status) {
        toast({ title: 'Approved', description: 'Vendor account is now active.' });
        fetchDetail();
      } else {
        toast({ title: 'Error', description: res.msg || 'Approval failed', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 5) {
      toast({ title: 'Reason required', description: 'Please enter at least 5 characters explaining why.', variant: 'destructive' });
      return;
    }
    try {
      setRejecting(true);
      const res = await VendorApiService.rejectKyc(vendorId, rejectReason.trim());
      if (res.status) {
        toast({ title: 'Rejected', description: 'Vendor has been notified with your reason.' });
        setRejectOpen(false);
        setRejectReason('');
        fetchDetail();
      } else {
        toast({ title: 'Error', description: res.msg || 'Rejection failed', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setRejecting(false);
    }
  };

  const handleApprovePrice = async (priceId: string) => {
    try {
      setPriceActionId(priceId);
      const res = await VendorApiService.approveSinglePrice(priceId);
      if (res.status) {
        toast({ title: 'Price approved.' });
        fetchDetail();
      } else {
        toast({ title: 'Error', description: res.msg || 'Failed to approve price', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to approve price', variant: 'destructive' });
    } finally {
      setPriceActionId(null);
    }
  };

  const handleRejectPrice = async () => {
    if (priceRemark.trim().length < 3) {
      toast({ title: 'Remark required', description: 'Enter at least 3 characters.', variant: 'destructive' });
      return;
    }
    try {
      setPriceRejecting(true);
      const res = await VendorApiService.rejectSinglePrice(priceActionId!, priceRemark.trim());
      if (res.status) {
        toast({ title: 'Price rejected.' });
        setPriceRejectOpen(false);
        setPriceRemark('');
        setPriceActionId(null);
        fetchDetail();
      } else {
        toast({ title: 'Error', description: res.msg || 'Failed to reject price', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reject price', variant: 'destructive' });
    } finally {
      setPriceRejecting(false);
    }
  };

  const formatDate = (s: string) => {
    try { return format(new Date(s), 'MMMM do, yyyy'); } catch { return s; }
  };

  const kycBadge = (status: string) => {
    switch (status) {
      case 'approved': return { label: 'Approved', className: 'bg-green-100 text-green-800' };
      case 'submitted': return { label: 'Pending Review', className: 'bg-amber-100 text-amber-800' };
      case 'rejected': return { label: 'Rejected', className: 'bg-red-100 text-red-800' };
      default: return { label: 'Not Submitted', className: 'bg-gray-100 text-gray-700' };
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <BackHeader />
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading vendor details...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <BackHeader />
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Vendor not found'}
                <div className="mt-2">
                  <Button onClick={fetchDetail} variant="outline" size="sm">
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

  const { vendor, prices } = data;
  const badge = kycBadge(vendor.kycStatus);
  const canReview = vendor.kycStatus === 'submitted';

  const profileUrl = vendorKycImageUrl(vendor.profilePic);
  const idProofUrl = vendorKycImageUrl(vendor.idProofPic);

  // group prices by service
  const pricesByService = prices.reduce<Record<string, VendorServicePrice[]>>((acc, p) => {
    (acc[p.service] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard/vendor">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Vendor KYC Review</h1>
        <Badge className={badge.className}>{badge.label}</Badge>
        <Button onClick={fetchDetail} variant="outline" size="sm" className="ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Rejection reason banner (if previously rejected) */}
      {vendor.kycStatus === 'rejected' && vendor.kycRejectionReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Previously rejected: </span>
            {vendor.kycRejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Vendor Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoRow icon={<User className="h-4 w-4" />} label="Name" value={vendor.name} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile" value={String(vendor.mobile)} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={vendor.email || 'Not provided'} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Gender" value={vendor.gender || '—'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={vendor.dob || '—'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="City" value={vendor.cityName || '—'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Pincode" value={vendor.pincode || '—'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={vendor.address || '—'} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Registered" value={formatDate(vendor.createdAt)} />
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> KYC Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <InfoRow icon={<FileText className="h-4 w-4" />} label="ID Proof Type" value={vendor.idProofType || '—'} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="ID Proof Number" value={vendor.idProofName || '—'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DocImage title="Profile Photo" url={profileUrl} onClick={setPreviewUrl} />
            <DocImage title="ID Proof Photo" url={idProofUrl} onClick={setPreviewUrl} />
          </div>
        </CardContent>
      </Card>

      {/* Selected Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Selected Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.selectedServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services selected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vendor.selectedServices.map((s) => (
                <Badge key={s.service_id} variant="secondary" className="text-sm">
                  {s.service}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" /> Vendor Service Prices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prices submitted.</p>
          ) : (
            Object.entries(pricesByService).map(([service, items]) => (
              <div key={service}>
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  {service}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Garments</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium align-top">{p.category}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {(p.types_of_Clothes ?? []).length > 0
                              ? (p.types_of_Clothes ?? []).map((g) => (
                                  <span
                                    key={g}
                                    className="inline-block px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border"
                                  >
                                    {g}
                                  </span>
                                ))
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                          {p.admin_remark && p.status === 'rejected' && (
                            <p className="text-xs text-red-600 mt-1 italic">
                              Remark: {p.admin_remark}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium align-top">₹{p.price}</TableCell>
                        <TableCell className="text-center align-top">
                          <Badge
                            className={
                              p.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : p.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center align-top">
                          {p.status === 'pending' ? (
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 border-green-500 text-green-700 hover:bg-green-50"
                                disabled={priceActionId === p._id}
                                onClick={() => handleApprovePrice(p._id)}
                                title="Approve price"
                              >
                                {priceActionId === p._id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Check className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 border-red-400 text-red-600 hover:bg-red-50"
                                disabled={priceActionId === p._id}
                                onClick={() => {
                                  setPriceActionId(p._id);
                                  setPriceRemark('');
                                  setPriceRejectOpen(true);
                                }}
                                title="Reject price"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="mt-4" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Review actions */}
      {canReview && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
              {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Approve & Activate
            </Button>
            <Button onClick={() => setRejectOpen(true)} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Price reject dialog */}
      <Dialog open={priceRejectOpen} onOpenChange={(o) => { if (!o) { setPriceRejectOpen(false); setPriceActionId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Price Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="price-remark">Reason for rejection</Label>
            <Textarea
              id="price-remark"
              placeholder="e.g. Price is too high for this category. Please resubmit at market rate."
              value={priceRemark}
              onChange={(e) => setPriceRemark(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              The vendor will see this remark and can update the price.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPriceRejectOpen(false); setPriceActionId(null); }} disabled={priceRejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectPrice} disabled={priceRejecting}>
              {priceRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              placeholder="e.g. ID proof photo is blurry, or submitted prices are too high for the Ironing category."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This message is shown to the vendor so they can fix and resubmit.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Order Summary Section ─────────────────────────────────────── */}
      {orderSummary && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Order Activity</CardTitle>
              <Link href={`/dashboard/orders/vendor-assigned?vendor=${vendorId}`}>
                <Button variant="outline" size="sm" className="text-xs">View all orders</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats row */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              {[
                { label: 'Total', value: orderSummary.stats.total, color: 'text-gray-700' },
                { label: 'Assigned', value: orderSummary.stats.assigned, color: 'text-amber-600' },
                { label: 'Accepted', value: orderSummary.stats.accepted, color: 'text-blue-600' },
                { label: 'In Progress', value: orderSummary.stats.in_progress, color: 'text-purple-600' },
                { label: 'Completed', value: orderSummary.stats.completed, color: 'text-green-600' },
                { label: 'Rejected', value: orderSummary.stats.rejected, color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-gray-50">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            {orderSummary.recent_orders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs font-medium text-gray-500 uppercase">
                      <th className="py-2 text-left">Order</th>
                      <th className="py-2 text-left">Service</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orderSummary.recent_orders.slice(0, 8).map((o: VendorOrder) => {
                      const statusColors: Record<string, string> = {
                        assigned: 'bg-amber-100 text-amber-700',
                        accepted: 'bg-blue-100 text-blue-700',
                        picked_up: 'bg-purple-100 text-purple-700',
                        processing: 'bg-sky-100 text-sky-700',
                        completed: 'bg-green-100 text-green-700',
                        rejected: 'bg-red-100 text-red-700',
                      };
                      return (
                        <tr key={o._id} className="hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-800">
                            #{o.order_number || o._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-2 text-gray-600">{o.service}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                              {o.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-gray-400">
                            {format(new Date(o.assigned_at), 'MMM d, h:mm a')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative w-full h-[60vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Document" className="absolute inset-0 w-full h-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────

function BackHeader() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard/vendor">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vendors
        </Button>
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Vendor KYC Review</h1>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function DocImage({
  title,
  url,
  onClick,
}: {
  title: string;
  url: string | null;
  onClick: (url: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      {url ? (
        <button
          type="button"
          onClick={() => onClick(url)}
          className="relative block w-full h-48 rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-48 rounded-lg border border-dashed text-muted-foreground">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-sm">Not uploaded</span>
        </div>
      )}
    </div>
  );
}
