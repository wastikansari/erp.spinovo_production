'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserCheck, Wifi, WifiOff, Search, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssignApiService, VendorApiService, Vendor } from '@/lib/api';

// ── Vendor capability matcher ──────────────────────────────────────────────────

function vendorMatchesService(vendor: Vendor, serviceName: string): boolean {
    const n = serviceName.toLowerCase();
    if (vendor.selectedServices && vendor.selectedServices.length > 0) {
        return vendor.selectedServices.some((s) => {
            const sn = s.service.toLowerCase();
            return sn.includes(n) || n.includes(sn);
        });
    }
    if (n.includes('quick') && n.includes('iron')) return vendor.can_ironing === 1;
    if (n.includes('wash') && (n.includes('iron') || n.includes('+'))) return vendor.can_wash_and_ironing === 1;
    if (n.includes('steam')) return vendor.can_stream_ironing === 1;
    if (n.includes('dry')) return vendor.can_dryclean === 1;
    if (n.includes('iron')) return vendor.can_ironing === 1;
    if (n.includes('wash')) return vendor.can_wash_and_fold === 1;
    if (n.includes('tail')) return vendor.can_tailoring === 1;
    return true;
}

// ── Vendor card ────────────────────────────────────────────────────────────────

function VendorCard({
    vendor,
    selected,
    onSelect,
}: {
    vendor: Vendor;
    selected: boolean;
    onSelect: () => void;
}) {
    const isOnline = vendor.isOnline === true;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left rounded-xl border-2 p-3.5 transition-all duration-150 focus:outline-none ${selected
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : isOnline
                    ? 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    : 'border-gray-100 hover:border-gray-300 bg-gray-50/60 opacity-70'
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`relative shrink-0 h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {(vendor.name?.[0] ?? 'V').toUpperCase()}
                    {/* Online dot */}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-sm truncate ${selected ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {vendor.name}
                        </span>
                        <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isOnline
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                            {isOnline
                                ? <><Wifi className="h-2.5 w-2.5" /> Online</>
                                : <><WifiOff className="h-2.5 w-2.5" /> Offline</>
                            }
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {vendor.mobile && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {vendor.mobile}
                            </span>
                        )}
                        {vendor.cityName && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {vendor.cityName}
                            </span>
                        )}
                    </div>
                </div>

                {selected && <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />}
            </div>
        </button>
    );
}

// ── Main form ──────────────────────────────────────────────────────────────────

interface ProcessAssignFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string | null;
    subOrderId: string | null;
    serviceName?: string | null;
    onSuccess: () => void;
}

export function ProcessAssignForm({
    open,
    onOpenChange,
    orderId,
    subOrderId,
    serviceName,
    onSuccess,
}: ProcessAssignFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [search, setSearch] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setSelectedVendorId('');
            setSearch('');
            fetchVendors();
        }
    }, [open]);

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            // Fetch up to 200 vendors (enough for any real deployment)
            const res = await VendorApiService.getVendors(1, 200);
            if (res.status && res.data) {
                let list = res.data.vendorList.filter((v) => v.accountIsActive === true);
                if (serviceName) {
                    list = list.filter((v) => vendorMatchesService(v, serviceName));
                }
                // Sort: online first, then offline
                list.sort((a, b) => {
                    const aOn = a.isOnline === true ? 1 : 0;
                    const bOn = b.isOnline === true ? 1 : 0;
                    return bOn - aOn;
                });
                setVendors(list);
            } else {
                toast({ title: 'Could not load vendors', description: res.msg, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', description: 'Failed to load vendor list.', variant: 'destructive' });
        } finally {
            setLoadingVendors(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return vendors;
        return vendors.filter(
            (v) =>
                v.name?.toLowerCase().includes(q) ||
                String(v.mobile).includes(q) ||
                v.cityName?.toLowerCase().includes(q),
        );
    }, [vendors, search]);

    const onlineCount = vendors.filter((v) => v.isOnline === true).length;
    const offlineCount = vendors.length - onlineCount;

    const handleAssign = async () => {
        if (!selectedVendorId || !orderId || !subOrderId) return;
        setSubmitting(true);
        try {
            const res = await AssignApiService.processAssign({
                order_id: orderId,
                sub_order_id: subOrderId,
                vendor_id: selectedVendorId,
            });
            if (res.status) {
                toast({ title: 'Assigned', description: 'Process assigned to vendor successfully.' });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({ title: 'Assignment failed', description: res.msg || 'Try again.', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', description: 'Could not assign. Try again.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedVendor = vendors.find((v) => v._id === selectedVendorId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-indigo-600" />
                        </div>
                        Assign Process Vendor
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1">
                        {serviceName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium mr-2">
                                {serviceName}
                            </span>
                        )}
                        {loadingVendors ? 'Loading vendors…' : (
                            <>
                                <span className="text-green-600 font-semibold">{onlineCount} online</span>
                                {' · '}
                                <span className="text-gray-400">{offlineCount} offline</span>
                                {' · '}
                                {vendors.length} total eligible vendors
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="px-4 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, or city…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        />
                    </div>
                </div>

                {/* Vendor list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                    {loadingVendors ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Loading vendors…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                            <UserCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">
                                {vendors.length === 0
                                    ? 'No active vendors available for this service'
                                    : 'No vendors match your search'}
                            </p>
                            {vendors.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Online section header */}
                            {filtered.some((v) => v.isOnline) && (
                                <div className="flex items-center gap-2 py-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                        Online — Ready to Accept
                                    </span>
                                </div>
                            )}
                            {filtered.filter((v) => v.isOnline).map((v) => (
                                <VendorCard
                                    key={v._id}
                                    vendor={v}
                                    selected={selectedVendorId === v._id}
                                    onSelect={() => setSelectedVendorId(v._id)}
                                />
                            ))}

                            {/* Offline section header */}
                            {filtered.some((v) => !v.isOnline) && (
                                <div className="flex items-center gap-2 py-1 mt-3">
                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        Offline — Order will wait for them to come online
                                    </span>
                                </div>
                            )}
                            {filtered.filter((v) => !v.isOnline).map((v) => (
                                <VendorCard
                                    key={v._id}
                                    vendor={v}
                                    selected={selectedVendorId === v._id}
                                    onSelect={() => setSelectedVendorId(v._id)}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Selected vendor preview + action */}
                <DialogFooter className="px-4 pt-3 pb-4 border-t shrink-0 flex-col sm:flex-col gap-2">
                    {selectedVendor && (
                        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {(selectedVendor.name?.[0] ?? 'V').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-indigo-800 truncate">{selectedVendor.name}</p>
                                <p className="text-xs text-indigo-600 truncate">
                                    {selectedVendor.cityName}{selectedVendor.mobile ? ` · ${selectedVendor.mobile}` : ''}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selectedVendor.isOnline
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                {selectedVendor.isOnline
                                    ? <><Wifi className="h-3 w-3" /> Online</>
                                    : <><WifiOff className="h-3 w-3" /> Offline</>
                                }
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="flex-1 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedVendorId || submitting || loadingVendors}
                            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {submitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning…</>
                            ) : (
                                <><UserCheck className="mr-2 h-4 w-4" /> Assign to Vendor</>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function ProcessAssignFormforIroning({
    open,
    onOpenChange,
    orderId,
    subOrderId,
    serviceName,
    onSuccess,
}: ProcessAssignFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [search, setSearch] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setSelectedVendorId('');
            setSearch('');
            fetchVendors();
        }
    }, [open]);

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const res = await VendorApiService.getIroningVendors();
            if (res.status && res.data) {
                let list = res.data.vendorList.filter((v) => v.accountIsActive === true);
                if (serviceName) {
                    list = list.filter((v) => vendorMatchesService(v, serviceName));
                }
                // Sort: online first, then offline
                // list.sort((a, b) => {
                //     const aOn = a.isOnline === true ? 1 : 0;
                //     const bOn = b.isOnline === true ? 1 : 0;
                //     return bOn - aOn;
                // });
                setVendors(list);
            } else {
                toast({ title: 'Could not load vendors', description: res.msg, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', description: 'Failed to load vendor list.', variant: 'destructive' });
        } finally {
            setLoadingVendors(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return vendors;
        return vendors.filter(
            (v) =>
                v.name?.toLowerCase().includes(q) ||
                String(v.mobile).includes(q) ||
                v.cityName?.toLowerCase().includes(q),
        );
    }, [vendors, search]);

    const onlineCount = vendors.filter((v) => v.isOnline === true).length;
    const offlineCount = vendors.length - onlineCount;

    const handleAssign = async () => {
        if (!selectedVendorId || !orderId || !subOrderId) return;
        setSubmitting(true);
        try {
            const res = await AssignApiService.processAssign({
                order_id: orderId,
                sub_order_id: subOrderId,
                vendor_id: selectedVendorId,
            });
            if (res.status) {
                toast({ title: 'Assigned', description: 'Process assigned to vendor successfully.' });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({ title: 'Assignment failed', description: res.msg || 'Try again.', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', description: 'Could not assign. Try again.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedVendor = vendors.find((v) => v._id === selectedVendorId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-indigo-600" />
                        </div>
                        Assign Process Vendor
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1">
                        {serviceName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium mr-2">
                                {serviceName}
                            </span>
                        )}
                        {loadingVendors ? 'Loading vendors…' : (
                            <>
                                <span className="text-green-600 font-semibold">{onlineCount} online</span>
                                {' · '}
                                <span className="text-gray-400">{offlineCount} offline</span>
                                {' · '}
                                {vendors.length} total eligible vendors
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="px-4 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, or city…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        />
                    </div>
                </div>

                {/* Vendor list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                    {loadingVendors ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm">Loading vendors…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                            <UserCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">
                                {vendors.length === 0
                                    ? 'No active vendors available for this service'
                                    : 'No vendors match your search'}
                            </p>
                            {vendors.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Online section header */}
                            {filtered.some((v) => v.isOnline) && (
                                <div className="flex items-center gap-2 py-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                        Online — Ready to Accept
                                    </span>
                                </div>
                            )}
                            {filtered.filter((v) => v.isOnline).map((v) => (
                                <VendorCard
                                    key={v._id}
                                    vendor={v}
                                    selected={selectedVendorId === v._id}
                                    onSelect={() => setSelectedVendorId(v._id)}
                                />
                            ))}

                            {/* Offline section header */}
                            {filtered.some((v) => !v.isOnline) && (
                                <div className="flex items-center gap-2 py-1 mt-3">
                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        Offline — Order will wait for them to come online
                                    </span>
                                </div>
                            )}
                            {filtered.filter((v) => !v.isOnline).map((v) => (
                                <VendorCard
                                    key={v._id}
                                    vendor={v}
                                    selected={selectedVendorId === v._id}
                                    onSelect={() => setSelectedVendorId(v._id)}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Selected vendor preview + action */}
                <DialogFooter className="px-4 pt-3 pb-4 border-t shrink-0 flex-col sm:flex-col gap-2">
                    {selectedVendor && (
                        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {(selectedVendor.name?.[0] ?? 'V').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-indigo-800 truncate">{selectedVendor.name}</p>
                                <p className="text-xs text-indigo-600 truncate">
                                    {selectedVendor.cityName}{selectedVendor.mobile ? ` · ${selectedVendor.mobile}` : ''}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selectedVendor.isOnline
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                {selectedVendor.isOnline
                                    ? <><Wifi className="h-3 w-3" /> Online</>
                                    : <><WifiOff className="h-3 w-3" /> Offline</>
                                }
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="flex-1 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedVendorId || submitting || loadingVendors}
                            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {submitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning…</>
                            ) : (
                                <><UserCheck className="mr-2 h-4 w-4" /> Assign to Vendor</>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
