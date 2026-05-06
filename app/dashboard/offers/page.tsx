'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    RefreshCw,
    AlertCircle,
    Tag,
    Plus,
    MoreHorizontal,
    Eye,
    Calendar,
    Percent,
    Hash,
} from 'lucide-react';
import { OfferApiService } from '@/lib/api/offer';
import { Offer } from '@/lib/types/offer';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { OfferForm } from '@/components/forms/offer_form';

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalOffers, setTotalOffers] = useState(0);
    const [error, setError] = useState<string>('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const fetchOffers = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('=== FETCHING OFFERS ===');

            const response = await OfferApiService.getOffers();
            console.log('=== API RESPONSE ===', response);

            if (response.status && response.data) {
                setOffers(response.data.offers || []);
                setTotalOffers(response.data.count || 0);

                if (response.data.offers && response.data.offers.length > 0) {
                    toast({
                        title: 'Success',
                        description: `Loaded ${response.data.offers.length} offers`,
                    });
                }
            } else {
                setError(response.msg || 'Failed to fetch offers');
                toast({
                    title: 'Error',
                    description: response.msg || 'Failed to fetch offers',
                    variant: 'destructive',
                });
                setOffers([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: 'Network error. Please check your connection and try again.',
                variant: 'destructive',
            });
            setOffers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const getStatusColor = (status: boolean) => {
        return status
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    };

    const getOfferTypeText = (type: number) => {
        return type === 0 ? 'Percentage' : 'Fixed Amount';
    };

    const getOfferTypeColor = (type: number) => {
        return type === 0
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    };

    const handleViewDetails = (offerId: string) => {
        router.push(`/dashboard/offers/${offerId}`);
    };

    const columns = [
        {
            key: 'title',
            header: 'Title',
            render: (offer: Offer) => (
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{offer.title}</span>
                </div>
            ),
        },
        {
            key: 'offer_code',
            header: 'Code',
            render: (offer: Offer) => (
                <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{offer.offer_code}</code>
                </div>
            ),
        },
        {
            key: 'offer_type',
            header: 'Type',
            render: (offer: Offer) => (
                <Badge className={getOfferTypeColor(offer.offer_type)}>
                    {getOfferTypeText(offer.offer_type)}
                </Badge>
            ),
            searchable: false,
        },
        {
            key: 'discount',
            header: 'Discount',
            render: (offer: Offer) => (
                <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {offer.offer_type === 0
                            ? `${offer.discount_percentage}%`
                            : `₹${offer.discount_amount}`}
                    </span>
                </div>
            ),
            searchable: false,
        },
        {
            key: 'start_date',
            header: 'Start Date',
            render: (offer: Offer) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{offer.start_date}</span>
                </div>
            ),
            searchable: false,
        },
        {
            key: 'end_date',
            header: 'End Date',
            render: (offer: Offer) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{offer.end_date}</span>
                </div>
            ),
            searchable: false,
        },
        {
            key: 'status',
            header: 'Status',
            render: (offer: Offer) => (
                <Badge className={getStatusColor(offer.status)}>
                    {offer.status ? 'Active' : 'Inactive'}
                </Badge>
            ),
            searchable: false,
        },
    ];

    const renderActions = (offer: Offer) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(offer._id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchOffers} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowCreateForm(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Offer
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Offer Management
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Total Offers: {totalOffers}
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DataTable
                        data={offers}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Search offers..."
                        emptyMessage={error ? 'Failed to load offers.' : 'No offers found.'}
                        actions={renderActions}
                    />
                </CardContent>
            </Card>

            <OfferForm
                open={showCreateForm}
                onOpenChange={setShowCreateForm}
                onSuccess={fetchOffers}
            />
        </div>
    );
}