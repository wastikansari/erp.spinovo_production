"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HeaderPageProps {
    title: string;
    handleRefresh: () => void;
    loading: boolean;
}

export function HeaderSection({
    title,
    handleRefresh,
    loading,
}: HeaderPageProps) {
    return (
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

            <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
            >
                <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
            </Button>
        </div>
    );
}
