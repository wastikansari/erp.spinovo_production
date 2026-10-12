import { IndianRupee, Shirt } from 'lucide-react';
import type { SegregatedCategory } from '@/lib/types/booking';

// QC saves every clothing type of every category, including qty 0 —
// keep only the categories and clothes that actually have garments.
export function getSegregatedCategories(raw: SegregatedCategory[] | undefined | null) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((cat) => ({
            ...cat,
            clothes: (cat.clothes ?? []).filter((c) => Number(c.qty) > 0),
        }))
        .filter((cat) => cat.clothes.length > 0);
}

export function getSegregationTotals(categories: SegregatedCategory[]) {
    return categories.reduce(
        (acc, cat) => {
            const rate = Number(cat.category_prices) || 0;
            cat.clothes.forEach((c) => {
                acc.qty += Number(c.qty) || 0;
                acc.amount += (Number(c.qty) || 0) * rate;
            });
            return acc;
        },
        { qty: 0, amount: 0 }
    );
}

function rupees(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

// Garment-wise table (garment / qty / rate / amount) grouped by category
export function GarmentSegregationTable({ categories }: { categories: SegregatedCategory[] }) {
    const totals = getSegregationTotals(categories);

    return (
        <div className="border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                        <th className="text-left font-medium px-4 py-2">Garment</th>
                        <th className="text-left font-medium px-4 py-2">Qty</th>
                        <th className="text-left font-medium px-4 py-2">Rate</th>
                        <th className="text-left font-medium px-4 py-2">Amount</th>
                    </tr>
                </thead>
                {categories.map((cat) => {
                    const rate = Number(cat.category_prices) || 0;
                    const catQty = cat.clothes.reduce((s, c) => s + (Number(c.qty) || 0), 0);
                    return (
                        <tbody key={cat.category_id} className="border-t">
                            <tr className="bg-muted/20">
                                <td colSpan={4} className="px-4 py-2">
                                    <span className="font-semibold">{cat.category}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {catQty} item{catQty !== 1 ? 's' : ''} · {rupees(rate)}/item
                                    </span>
                                </td>
                            </tr>
                            {cat.clothes.map((c) => (
                                <tr key={c.name} className="border-t border-dashed">
                                    <td className="px-4 py-2 pl-7">{c.name}</td>
                                    <td className="px-4 py-2 font-semibold">{c.qty}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{rupees(rate)}</td>
                                    <td className="px-4 py-2 font-medium">{rupees(Number(c.qty) * rate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    );
                })}
                <tfoot className="border-t bg-primary/5">
                    <tr className="font-semibold">
                        <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5">
                                <Shirt className="h-4 w-4 text-primary" /> Total
                            </span>
                        </td>
                        <td className="px-4 py-2.5">{totals.qty}</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5">
                            <span className="flex items-center gap-0.5">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {totals.amount.toLocaleString('en-IN')}
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
