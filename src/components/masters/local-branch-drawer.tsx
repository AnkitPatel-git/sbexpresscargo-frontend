"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { localBranchService } from '@/services/masters/local-branch-service'
import { stateService } from '@/services/masters/state-service'
import { LocalBranch } from '@/types/masters/local-branch'

const localBranchSchema = z.object({
    branchCode: z.string().min(2, "Branch code must be at least 2 characters"),
    companyName: z.string().min(3, "Company name must be at least 3 characters"),
    name: z.string().min(3, "Branch name must be at least 3 characters"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional().nullable(),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    telephone1: z.string().min(10, "Telephone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    gstNo: z.string().min(15, "GST No must be 15 characters"),
})

type LocalBranchFormValues = z.infer<typeof localBranchSchema>

interface LocalBranchDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branch?: LocalBranch | null
}

export function LocalBranchDrawer({ open, onOpenChange, branch }: LocalBranchDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!branch

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<LocalBranchFormValues>({
        resolver: zodResolver(localBranchSchema),
        defaultValues: {
            branchCode: '',
            companyName: '',
            name: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            telephone1: '',
            email: '',
            gstNo: '',
        }
    })

    useEffect(() => {
        if (branch) {
            form.reset({
                branchCode: branch.branchCode,
                companyName: branch.companyName,
                name: branch.name,
                address1: branch.address1,
                address2: branch.address2 || '',
                pinCode: branch.pinCode,
                city: branch.city,
                state: branch.state,
                telephone1: branch.telephone1,
                email: branch.email,
                gstNo: branch.gstNo,
            })
        } else {
            form.reset({
                branchCode: '',
                companyName: '',
                name: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                telephone1: '',
                email: '',
                gstNo: '',
            })
        }
    }, [branch, form])

    const mutation = useMutation({
        mutationFn: (data: LocalBranchFormValues) => {
            if (isEdit && branch) {
                return localBranchService.updateLocalBranch(branch.id, data)
            }
            return localBranchService.createLocalBranch(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['local-branches'] })
            toast.success(`Local Branch ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} local branch`)
        }
    })

    function onSubmit(data: LocalBranchFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Local Branch" : "Create Local Branch"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the branch details below." : "Enter the details for the new local branch."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    name="branchCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Branch Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. BR001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. SB Express" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai Main Branch" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="address1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 1</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Street address, P.O. box" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="address2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apartment, suite, unit, building, floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {statesData?.data?.map((state) => (
                                                        <SelectItem key={state.id} value={state.stateName}>
                                                            {state.stateName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 400001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 02212345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. branch@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                name="gstNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="15-digit GSTIN" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Branch" : "Create Branch"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
