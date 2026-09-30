import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WaCampaignStatus, WaRecipientStatus } from '@/lib/types/whatsappMarketing';

const COLORS: Record<WaCampaignStatus | WaRecipientStatus, string> = {
  sending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  queued: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  sent: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-300',
  delivered: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  read: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};

export function CampaignStatusBadge({ status }: { status: WaCampaignStatus | WaRecipientStatus }) {
  return (
    // outline variant: no hover background of its own to fight these colors.
    <Badge variant="outline" className={`${COLORS[status]} border-transparent capitalize`}>
      {status === 'sending' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {status}
    </Badge>
  );
}
