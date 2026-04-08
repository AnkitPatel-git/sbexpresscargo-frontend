"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form";
import {
    FloatingFormItem,
    FLOATING_INNER_COMBO,
    FLOATING_INNER_SELECT_TRIGGER,
    FLOATING_INNER_TEXTAREA,
} from "@/components/ui/floating-form-item";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackingService } from "@/services/transactions/tracking-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { Combobox } from "@/components/ui/combobox";

const formSchema = z.object({
    status: z.string().min(1, "Status is required"),
    remark: z.string().optional(),
    serviceCenterId: z.number().optional(),
});

interface ManualUpdateDialogProps {
    awbNo: string;
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        status: string;
        remark?: string;
        serviceCenterId?: number;
    };
}

const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "Picked", value: "PICKED" },
    { label: "In Scan", value: "IN_SCAN" },
    { label: "Manifested", value: "MANIFESTED" },
    { label: "Bag Prepared", value: "BAG_PREPARED" },
    { label: "In Transit", value: "IN_TRANSIT" },
    { label: "Out Scan", value: "OUT_SCAN" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Returned", value: "RETURNED" },
    { label: "Exception", value: "EXCEPTION" },
];

export function ManualUpdateDialog({ awbNo, isOpen, onClose, initialData }: ManualUpdateDialogProps) {
    const queryClient = useQueryClient();

    const { data: serviceCentersData } = useQuery({
        queryKey: ["service-centers"],
        queryFn: () => serviceCenterService.getServiceCenters(),
    });

    const serviceCenterOptions = serviceCentersData?.data?.map(sc => ({
        label: sc.name,
        value: sc.id
    })) || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: initialData?.status || "",
            remark: initialData?.remark || "",
            serviceCenterId: initialData?.serviceCenterId,
        },
    });

    // Reset form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen && initialData) {
            form.reset({
                status: initialData.status,
                remark: initialData.remark || "",
                serviceCenterId: initialData.serviceCenterId,
            });
        }
    }, [isOpen, initialData, form]);

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) =>
            trackingService.manualUpdateStatus({
                awbNo,
                ...values,
            }),
        onSuccess: (data) => {
            toast.success(data.message || "Status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["trackingDetail", awbNo] });
            queryClient.invalidateQueries({ queryKey: ["trackingSearch"] });
            onClose();
            form.reset();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update status");
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manual Status Update</DialogTitle>
                    <DialogDescription>
                        Update the tracking status for AWB: <span className="font-semibold">{awbNo}</span>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FloatingFormItem label="Status">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="serviceCenterId"
                            render={({ field }) => (
                                <FloatingFormItem label="Service Center">
                                    <FormControl>
                                        <Combobox
                                            options={serviceCenterOptions}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Service Center"
                                            className={FLOATING_INNER_COMBO}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FloatingFormItem label="Remark">
                                    <FormControl>
                                        <Textarea
                                            placeholder="Reason for manual update"
                                            {...field}
                                            className={FLOATING_INNER_TEXTAREA}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Status
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
