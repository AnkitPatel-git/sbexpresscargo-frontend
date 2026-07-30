"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    FLOATING_INNER_CONTROL,
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
import { Input } from "@/components/ui/input";
import { optionLabelForSelect } from "@/lib/select-closed-label";
import { Textarea } from "@/components/ui/textarea";
import { trackingService } from "@/services/transactions/tracking-service";
import { SHIPMENT_SUB_STATUS_CODES } from "@/lib/shipment-sub-status-codes";
import { SHIPMENT_STATUS_OPTIONS } from "@/lib/shipment-status-options";

const formSchema = z
    .object({
        status: z.string().min(1, "Status is required"),
        remark: z.string().optional(),
        subStatus: z.string().max(128).optional(),
        location: z.string().max(512).optional(),
        expectedDeliveryDate: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.status === "DELIVERY_ATTEMPTED" && !data.subStatus?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "NDR / reason code is required for delivery attempted",
                path: ["subStatus"],
            });
        }
    });

interface ManualUpdateDialogProps {
    awbNo: string;
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        status: string;
        remark?: string;
        subStatus?: string;
        location?: string;
        expectedDeliveryDate?: string;
    };
}

export function ManualUpdateDialog({ awbNo, isOpen, onClose, initialData }: ManualUpdateDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: initialData?.status || "",
            remark: initialData?.remark || "",
            subStatus: initialData?.subStatus || "",
            location: initialData?.location || "",
            expectedDeliveryDate: initialData?.expectedDeliveryDate || "",
        },
    });

    const watchedStatus = useWatch({ control: form.control, name: "status" });

    useEffect(() => {
        if (isOpen && initialData) {
            form.reset({
                status: initialData.status,
                remark: initialData.remark || "",
                subStatus: initialData.subStatus || "",
                location: initialData.location || "",
                expectedDeliveryDate: initialData.expectedDeliveryDate || "",
            });
        }
    }, [isOpen, initialData, form]);

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) =>
            trackingService.manualUpdateStatus({
                awbNo,
                status: values.status,
                remark: values.remark,
                subStatus: values.subStatus,
                location: values.location,
                expectedDeliveryDate: values.expectedDeliveryDate?.trim()
                    ? values.expectedDeliveryDate.trim()
                    : undefined,
            }),
        onSuccess: (data) => {
            toast.success(data.message || "Status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["trackingDetail", awbNo] });
            queryClient.invalidateQueries({ queryKey: ["trackingSearch"] });
            onClose();
            form.reset();
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to update status");
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
                                    <Select key={`st-${field.value}`} onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select status">
                                                    {optionLabelForSelect(field.value, SHIPMENT_STATUS_OPTIONS)}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SHIPMENT_STATUS_OPTIONS.map((option) => (
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

                        {watchedStatus === "DELIVERY_ATTEMPTED" && (
                            <FormField
                                control={form.control}
                                name="subStatus"
                                render={({ field }) => (
                                    <FloatingFormItem label="NDR / reason code">
                                        <Select key={`sub-${field.value}`} onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select reason code">
                                                        {field.value ? field.value.replace(/_/g, " ") : undefined}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SHIPMENT_SUB_STATUS_CODES.map((code) => (
                                                    <SelectItem key={code} value={code}>
                                                        {code.replace(/_/g, " ")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FloatingFormItem label="Location (optional)">
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hub, city, or PIN area"
                                            {...field}
                                            className={FLOATING_INNER_TEXTAREA}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expectedDeliveryDate"
                            render={({ field }) => (
                                <FloatingFormItem label="Expected date of delivery">
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value || ""}
                                            className={FLOATING_INNER_CONTROL}
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
