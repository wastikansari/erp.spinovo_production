import { WaVariable } from '@/lib/types/whatsappMarketing';

// "919876543210" → "+91 98765 43210"; other countries just get a "+".
export function formatMobile(mobile: string): string {
  if (/^91\d{10}$/.test(mobile)) return `+91 ${mobile.slice(2, 7)} ${mobile.slice(7)}`;
  return `+${mobile}`;
}

// What a variable will show in the preview — the contact's name is only
// known per recipient, so show a sample name there.
export function previewValue(v: WaVariable | undefined, sampleName = 'Rahul'): string {
  if (!v) return '';
  if (v.source === 'name') return sampleName || v.value;
  return v.value;
}

// Replaces {{1}}, {{2}}… with the given values; unfilled ones stay visible
// as {{n}} so the admin can see what's still missing.
export function fillTemplate(text: string | null | undefined, values: string[]): string {
  if (!text) return '';
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, n) => {
    const v = values[Number(n) - 1];
    return v ? v : match;
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function percent(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}
