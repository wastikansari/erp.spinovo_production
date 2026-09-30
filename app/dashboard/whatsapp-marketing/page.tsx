'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { hasAccess } from '@/lib/permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactsTab } from '@/components/whatsapp-marketing/ContactsTab';
import { CampaignsTab } from '@/components/whatsapp-marketing/CampaignsTab';

const PAGE_KEY = 'whatsapp-marketing';

export default function WhatsappMarketingPage() {
  const [user] = useState(() => AuthService.getUser());
  const [tab, setTab] = useState('contacts');
  const router = useRouter();

  // Mirrors the backend's verb→level mapping: PATCH (opt-out) needs edit,
  // POST (import/sync/delete/send) needs all.
  const canEdit = hasAccess(user, PAGE_KEY, 'edit');
  const canManage = hasAccess(user, PAGE_KEY, 'all');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <MessageCircle className="h-7 w-7 text-green-600" />
          WhatsApp Marketing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send approved Interakt templates to registered customers and imported numbers.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4">
          <ContactsTab
            canEdit={canEdit}
            canManage={canManage}
            onCampaignCreated={(id) => router.push(`/dashboard/whatsapp-marketing/campaigns/${id}`)}
          />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
