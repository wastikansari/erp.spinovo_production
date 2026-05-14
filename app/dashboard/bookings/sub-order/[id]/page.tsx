// app/dashboard/bookings/sub-orders/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Package,
    Shirt,
    UserCheck,
    Loader2,
    AlertCircle,
    IndianRupee,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Alert,
    AlertDescription,
} from '@/components/ui/alert';

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL;

export default function SubOrderDetailsPage() {
    const params = useParams();

    const router = useRouter();

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [data, setData] = useState<any>(null);

    const subOrderId = params?.id;

    useEffect(() => {
        if (subOrderId) {
            fetchSubOrderDetails();
        }
    }, [subOrderId]);

    const fetchSubOrderDetails = async () => {
        try {
            setLoading(true);

            setError('');

            const response = await fetch(
                `${BASE_URL}/api/v1/admin/order/sub/details/v2/${subOrderId}`
            );

            const result = await response.json();

            if (result.status) {
                setData(result.data);
            } else {
                setError(
                    result.msg ||
                    'Failed to fetch sub order details'
                );
            }
        } catch (error) {
            console.error(error);

            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const subOrder = data?.subOrder;

    const address = data?.address;

    const pickupAssignment =
        data?.pickupAssignment;

    const processAssignment =
        data?.processAssignment;

    const deliveryAssignment =
        data?.deliveryAssignment;

    const garmentDetails = subOrder?.garment_details
        ? JSON.parse(subOrder.garment_details)
        : null;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';

            case 'processing':
                return 'bg-blue-100 text-blue-700 border-blue-200';

            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200';

            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';

            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* HEADER */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <Button
                        variant="ghost"
                        className="mb-3"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-3xl font-bold">
                        Sub Order Details
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        Manage sub order information and
                        assignments
                    </p>
                </div>

                <div>
                    <span
                        className={`px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor(
                            subOrder?.ord_status
                        )}`}
                    >
                        {subOrder?.ord_status}
                    </span>
                </div>
            </div>

            {/* ERROR */}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />

                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* TOP CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* ORDER */}

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Sub Order No
                                </p>

                                <h2 className="text-xl font-bold mt-2">
                                    {subOrder?.sub_order_no}
                                </h2>
                            </div>

                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SERVICE */}

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Service
                                </p>

                                <h2 className="text-xl font-bold mt-2">
                                    {subOrder?.service_name}
                                </h2>
                            </div>

                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Shirt className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* QUANTITY */}

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Garment Qty
                                </p>

                                <h2 className="text-xl font-bold mt-2">
                                    {subOrder?.garment_qty}
                                </h2>
                            </div>

                            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-yellow-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* AMOUNT */}

                <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Amount
                                </p>

                                <h2 className="text-xl font-bold mt-2 flex items-center">
                                    <IndianRupee className="h-5 w-5" />
                                    {subOrder?.garment_amount}
                                </h2>
                            </div>

                            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <IndianRupee className="h-6 w-6 text-green-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN GRID */}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT */}

                <div className="xl:col-span-2 space-y-6">
                    {/* ORDER INFO */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Order Information
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Main Order No
                                </p>

                                <h3 className="font-semibold mt-1">
                                    {subOrder?.order_no}
                                </h3>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Booking Date
                                </p>

                                <h3 className="font-semibold mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {subOrder?.booking_date}
                                </h3>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Booking Time
                                </p>

                                <h3 className="font-semibold mt-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {subOrder?.booking_time}
                                </h3>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Service
                                </p>

                                <h3 className="font-semibold mt-1">
                                    {subOrder?.service_name}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GARMENT DETAILS */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Garment Details
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {garmentDetails?.categorys?.map(
                                (
                                    category: any,
                                    index: number
                                ) => (
                                    <div
                                        key={index}
                                        className="border rounded-2xl p-5"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    {
                                                        category.category
                                                    }
                                                </h3>

                                                <p className="text-sm text-muted-foreground">
                                                    {
                                                        category.items
                                                    }{' '}
                                                    Items
                                                </p>
                                            </div>

                                            <div className="text-lg font-bold">
                                                ₹
                                                {
                                                    category.category_prices
                                                }
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {category.types_of_Clothes.map(
                                                (
                                                    item: string,
                                                    i: number
                                                ) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 rounded-full bg-muted text-sm"
                                                    >
                                                        {item}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* ADDRESS */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Pickup Address
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>

                                <div>
                                    <h3 className="font-semibold">
                                        {address?.address_type}
                                    </h3>

                                    <p className="text-muted-foreground mt-1">
                                        {
                                            address?.format_address
                                        }
                                    </p>

                                    <p className="text-sm mt-2">
                                        Pincode :{' '}
                                        {address?.pincode}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT */}

                <div className="space-y-6">
                    {/* PICKUP */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Pickup Assignment
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {pickupAssignment ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-blue-700" />
                                        </div>

                                        <div>
                                            <p className="font-medium">
                                                Pickup Assigned
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                Status :{' '}
                                                {
                                                    pickupAssignment.status
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    No pickup assigned
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* PROCESS */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Processing Assignment
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {processAssignment ? (
                                <p>Assigned</p>
                            ) : (
                                <p className="text-muted-foreground">
                                    No processing assigned
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* DELIVERY */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Delivery Assignment
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {deliveryAssignment ? (
                                <p>Assigned</p>
                            ) : (
                                <p className="text-muted-foreground">
                                    No delivery assigned
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* ACTIONS */}

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle>
                                Actions
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <Button className="w-full rounded-xl">
                                Assign Pickup Partner
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                            >
                                Assign Processing
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                            >
                                Assign Delivery
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}