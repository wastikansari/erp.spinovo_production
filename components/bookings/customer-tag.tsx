import type { CustomerType } from '@/lib/api';

// 1 → 1st, 2 → 2nd, 3 → 3rd, 11 → 11th, 22 → 22nd
export function ordinal(n: number) {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

export const CUSTOMER_TYPE_OPTIONS: { value: CustomerType; label: string }[] = [
    { value: 'new', label: 'New Customers' },
    { value: 'second', label: '2nd Order' },
    { value: 'repeat', label: 'Repeat' },
    { value: 'loyal', label: 'Loyal' },
];

export const CUSTOMER_TYPE_STYLES: Record<CustomerType, string> = {
    new: 'bg-green-50 text-green-700 border-green-200',
    second: 'bg-blue-50 text-blue-700 border-blue-200',
    repeat: 'bg-orange-50 text-orange-700 border-orange-200',
    loyal: 'bg-purple-50 text-purple-700 border-purple-200',
};

function typeOf(no: number): CustomerType {
    if (no === 1) return 'new';
    if (no === 2) return 'second';
    if (no <= 4) return 'repeat';
    return 'loyal';
}

function labelOf(no: number) {
    if (no === 1) return 'New Customer';
    if (no === 2) return '2nd Order';
    if (no <= 4) return `Repeat · ${ordinal(no)}`;
    return `Loyal · ${ordinal(no)}`;
}

// Tag showing which order this is for the customer. Renders nothing for
// cancelled orders (no rank) or when the API didn't send a rank.
export function CustomerTag({ orderNo, total }: { orderNo?: number | null; total?: number }) {
    if (!orderNo) return null;
    return (
        <span
            title={`${ordinal(orderNo)} order${total ? ` of ${total} total` : ''}`}
            className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${CUSTOMER_TYPE_STYLES[typeOf(orderNo)]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {labelOf(orderNo)}
        </span>
    );
}
