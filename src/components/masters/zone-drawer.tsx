'use client';

import { useEffect, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { zoneService } from '@/services/masters/zone-service';
import { Zone, ZoneFormData } from '@/types/masters/zone';
import { toast } from 'sonner';

const zoneSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    country: z.string().min(1, 'Country is required'),
    zoneType: z.enum(['DOMESTIC', 'VENDOR']),
});

interface ZoneDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    zone?: Zone | null;
}

export function ZoneDrawer({ open, onOpenChange, zone }: ZoneDrawerProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ZoneFormData>({
        resolver: zodResolver(zoneSchema) as Resolver<ZoneFormData>,
        defaultValues: {
            name: '',
            code: '',
            country: 'India',
            zoneType: 'DOMESTIC',
        },
    });

    useEffect(() => {
        if (zone) {
            form.reset({
                name: zone.name,
                code: zone.code,
                country: zone.country,
                zoneType: zone.zoneType,
            });
        } else {
            form.reset({
                name: '',
                code: '',
                country: 'India',
                zoneType: 'DOMESTIC',
            });
        }
    }, [zone, form]);

    const onSubmit = async (data: ZoneFormData) => {
        try {
            setLoading(true);
            if (zone) {
                await zoneService.updateZone(zone.id, data);
                toast.success('Zone updated successfully');
            } else {
                await zoneService.createZone(data);
                toast.success('Zone created successfully');
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[440px]">
                <SheetHeader className="px-6">
                    <SheetTitle>{zone ? 'Edit Zone' : 'Add New Zone'}</SheetTitle>
                </SheetHeader>
                <div className="px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zone Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter zone name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zone Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter zone code" {...field} disabled={!!zone} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter country" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="zoneType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zone Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select zone type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                                <SelectItem value="VENDOR">Vendor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <SheetFooter className="pt-4">
                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {zone ? 'Update Zone' : 'Create Zone'}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
