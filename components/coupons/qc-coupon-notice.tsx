'use client';

import { useEffect, useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import { OfferApiService } from '@/lib/api/offer';
import { OfferQcCheck } from '@/lib/types/booking';

// Shown in the "Complete QC" confirm dialog: what QC completion will do to the
// order's coupon (same rule as checkout, on the garments actually picked up).
export function QcCouponNotice({ orderId, open }: { orderId: string; open: boolean }) {
    const [check, setCheck] = useState<OfferQcCheck | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !orderId) return;
        let cancelled = false;
        setLoading(true);
        OfferApiService.getQcCouponPreview(orderId)
            .then((res) => !cancelled && setCheck(res.status ? res.data?.check ?? null : null))
            .catch(() => !cancelled && setCheck(null))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [open, orderId]);

    if (loading) {
        return (
            <p className="flex items-center gap-2 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking coupon…
            </p>
        );
    }
    if (!check) return null;

    const tone =
        check.action === 'removed'
            ? 'border-red-200 bg-red-50 text-red-800'
            : check.action === 'kept'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-800';
    const title =
        check.action === 'removed'
            ? `Coupon ${check.offer_code} will be removed (−₹${check.before_amount} discount)`
            : check.action === 'kept'
              ? `Coupon ${check.offer_code} stays: ₹${check.after_amount} off`
              : `Coupon ${check.offer_code} discount will change: ₹${check.before_amount} → ₹${check.after_amount}`;

    return (
        <div className={`rounded-xl border px-4 py-3 text-xs space-y-1 ${tone}`}>
            <p className="flex items-center gap-1.5 font-semibold">
                <Tag className="h-3.5 w-3.5" /> {title}
            </p>
            <p>
                Items this coupon covers: ₹{check.eligible_before} booked → ₹{check.eligible_after} after QC
                {check.min_order_amount > 0 ? ` (minimum ₹${check.min_order_amount})` : ''}
            </p>
            {check.reason && <p>{check.reason}</p>}
            {check.action !== 'kept' && (
                <p className="font-medium">The customer is notified and the wallet is settled with the difference.</p>
            )}
        </div>
    );
}

// Coupon history on an order: what was applied at booking and what QC did.
export function OrderCouponQcRecord({ check }: { check?: OfferQcCheck }) {
    if (!check || check.action === 'kept') return null;
    const removed = check.action === 'removed';
    return (
        <div
            className={`my-2 rounded-lg border px-3 py-2 text-xs space-y-0.5 ${
                removed ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
        >
            <p className="font-medium">
                {removed
                    ? `Coupon ${check.offer_code} removed at QC (was ₹${check.before_amount})`
                    : `Coupon ${check.offer_code} ${check.action} at QC: ₹${check.before_amount} → ₹${check.after_amount}`}
            </p>
            <p>{check.reason}</p>
            <p className="opacity-80">
                Covered items ₹{check.eligible_before} → ₹{check.eligible_after}
                {check.min_order_amount > 0 ? ` · minimum ₹${check.min_order_amount}` : ''} ·{' '}
                {new Date(check.checked_at).toLocaleString('en-IN')}
                {check.checked_by ? ` · by ${check.checked_by}` : ''}
            </p>
        </div>
    );
}
