import { cn } from '@/lib/utils';
import { BUNDLE_STATUS_META, type BundleBooking } from '@/lib/types/bundle';

export function BundleStatusBadge({ booking }: { booking: Pick<BundleBooking, 'status' | 'outcome'> }) {
  const meta = BUNDLE_STATUS_META[booking.status];
  const suffix =
    booking.status === 'completed' && booking.outcome
      ? booking.outcome === 'converted'
        ? ' · Converted'
        : ' · Consultation'
      : '';
  return (
    <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap', meta?.className)}>
      {meta?.label || booking.status}
      {suffix}
    </span>
  );
}
