'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VendorApiService } from '@/lib/api/vendor';
import { useToast } from '@/hooks/use-toast';

/* ----- DUMMY STATE & CITY DATA ----- */
const STATES = [
    {
        id: 1,
        name: 'gg',
        cities: [
            { id: 1, name: 'ahmedabad' },
            { id: 2, name: 'vadodara' },
        ],
    },
];

export default function VendorForm({ onClose, onSuccess }) {
    const { toast } = useToast();

    const [cities, setCities] = useState([]);
    const [form, setForm] = useState({
        name: '',
        mobile: '',
        stateName: '',
        stateId: '',
        cityName: '',
        cityId: '',
        address: '',
        idProofName: '',
    });

    /* ----- VALIDATION ----- */
    const validate = () => {
        if (!form.name.trim()) return 'Name is required';
        if (!/^[0-9]{10}$/.test(form.mobile)) return 'Mobile must be 10 digits';
        if (!form.stateId) return 'State is required';
        if (!form.cityId) return 'City is required';
        if (!form.address.trim()) return 'Address is required';
        if (!form.idProofName.trim()) return 'ID Proof Name is required';
        return null;
    };

    /* ----- SUBMIT ----- */
    const submit = async () => {
        const error = validate();
        if (error) {
            toast({ title: error, variant: 'destructive' });
            return;
        }

        const payload = {
            name: form.name,
            mobile: Number(form.mobile),
            stateName: form.stateName,
            stateId: Number(form.stateId),
            cityName: form.cityName,
            cityId: Number(form.cityId),
            address: form.address,
            idProofName: form.idProofName,
        };

        try {
            const res = await VendorApiService.registerVendor(payload);
            if (res?.status) {
                toast({ title: 'Vendor registered successfully' });
                onClose();
                onSuccess();
            } else {
                toast({ title: res?.msg || 'Registration failed', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Network error', variant: 'destructive' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-background p-5 rounded-lg w-[420px] space-y-3">
                <h2 className="text-lg font-semibold">Register Vendor</h2>

                <Input
                    placeholder="Vendor Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <Input
                    placeholder="Mobile Number"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) =>
                        setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })
                    }
                />

                {/* STATE */}
                <select
                    className="w-full border rounded p-2"
                    value={form.stateId}
                    onChange={(e) => {
                        const state = STATES.find(
                            (s) => s.id === Number(e.target.value)
                        );
                        setForm({
                            ...form,
                            stateId: state.id,
                            stateName: state.name,
                            cityId: '',
                            cityName: '',
                        });
                        setCities(state.cities);
                    }}
                >
                    <option value="">Select State</option>
                    {STATES.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>

                {/* CITY */}
                <select
                    className="w-full border rounded p-2"
                    value={form.cityId}
                    disabled={!form.stateId}
                    onChange={(e) => {
                        const city = cities.find(
                            (c) => c.id === Number(e.target.value)
                        );
                        setForm({
                            ...form,
                            cityId: city.id,
                            cityName: city.name,
                        });
                    }}
                >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <Input
                    placeholder="Address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <Input
                    placeholder="ID Proof Name"
                    value={form.idProofName}
                    onChange={(e) =>
                        setForm({ ...form, idProofName: e.target.value })
                    }
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={submit}>Register</Button>
                </div>
            </div>
        </div>
    );
}
