"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { stateService } from '@/services/masters/state-service'
import { zoneService } from '@/services/masters/zone-service'
import { State } from '@/types/masters/state'

const stateSchema = z.object({
    stateCode: z.string().min(2, "State code must be at least 2 characters"),
    stateName: z.string().min(3, "State name must be at least 3 characters"),
    productType: z.string().min(1, "Product type is required"),
    zoneId: z.number().min(1, "Zone is required"),
    gstAlias: z.string().min(2, "GST Alias is required"),
    unionTerritory: z.boolean(),
})

type StateFormValues = z.infer<typeof stateSchema>

interface StateDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    state?: State | null
}

export function StateDrawer({ open, onOpenChange, state }: StateDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!state

    const { data: zonesData } = useQuery({
        queryKey: ['zones-list'],
        queryFn: () => zoneService.getZones({ limit: 100 }),
        enabled: open
    })

    const form = useForm<StateFormValues>({
        resolver: zodResolver(stateSchema) as Resolver<StateFormValues>,
        defaultValues: {
            stateCode: '',
            stateName: '',
            productType: 'DOMESTIC',
            zoneId: 0,
            gstAlias: '',
            unionTerritory: false,
        }
    })

    useEffect(() => {
        if (state) {
            form.reset({
                stateCode: state.stateCode,
                stateName: state.stateName,
                productType: state.productType,
                zoneId: state.zoneId,
                gstAlias: state.gstAlias,
                unionTerritory: state.unionTerritory,
            })
        } else {
            form.reset({
                stateCode: '',
                stateName: '',
                productType: 'DOMESTIC',
                zoneId: 0,
                gstAlias: '',
                unionTerritory: false,
            })
        }
    }, [state, form])

    const mutation = useMutation({
        mutationFn: (data: StateFormValues) => {
            if (isEdit && state) {
                return stateService.updateState(state.id, data)
            }
            return stateService.createState(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['states'] })
            toast.success(`State ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} state`)
        }
    })

    function onSubmit(data: StateFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit State" : "Create State"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the state details below." : "Enter the details for the new state."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="stateCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. DL, MH" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gstAlias"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Alias</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 07, 27" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="stateName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Delhi, Maharashtra" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="productType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                                                    <SelectItem value="LOCAL">Local</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="zoneId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zone</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(parseInt(val))}
                                                value={field.value ? field.value.toString() : ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select zone" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {zonesData?.data?.map((zone) => (
                                                        <SelectItem key={zone.id} value={zone.id.toString()}>
                                                            {zone.name} ({zone.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="unionTerritory"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Union Territory
                                            </FormLabel>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update State" : "Create State"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
