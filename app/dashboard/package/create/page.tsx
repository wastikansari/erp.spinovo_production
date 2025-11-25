import { PackageForm } from "@/components/package/package-form";
import { Card } from "@/components/ui/card";

export default function CreatePackagePage() {
    return (
        <div className="p-8">
            <Card className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Create New Package</h1>
                <PackageForm />
            </Card>
        </div>
    );
}