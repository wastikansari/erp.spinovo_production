import { SALES_CALL_RESPONSE_OPTIONS, type SalesCallResponse } from '@/lib/types/salesCall';

export function ResponseBadge({ response }: { response: SalesCallResponse }) {
  const opt = SALES_CALL_RESPONSE_OPTIONS.find((o) => o.value === response);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        opt?.className ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {opt?.label ?? response}
    </span>
  );
}
