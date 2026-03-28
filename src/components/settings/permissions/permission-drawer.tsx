"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { permissionService } from "@/services/permission-service"
import { Permission, CreatePermissionDto } from "@/types/permission"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    underMenu: z.string().min(2, "Menu/Module must be at least 2 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
})

interface PermissionDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    permission: Permission | null
}

export function PermissionDrawer({ open, onOpenChange, permission }: PermissionDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!permission

    const form = useForm<CreatePermissionDto>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            underMenu: "Masters",
            description: "",
        },
    })

    useEffect(() => {
        if (permission) {
            form.reset({
                name: permission.name,
                underMenu: permission.subModule || permission.underMenu || "",
                description: permission.description || "",
            })
        } else {
            form.reset({
                name: "",
                underMenu: "Masters",
                description: "",
            })
        }
    }, [permission, form])

    const mutation = useMutation({
        mutationFn: (data: CreatePermissionDto) => {
            if (isEdit && permission) {
                return permissionService.updatePermission(permission.id, data)
            }
            return permissionService.createPermission(data)
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] })
            toast.success(isEdit ? "Permission updated successfully" : "Permission created successfully")
            onOpenChange(false)
            form.reset()
        },
        onError: (error: any) => {
            toast.error(error.message || "Something went wrong")
        }
    })

    function onSubmit(values: CreatePermissionDto) {
        mutation.mutate(values)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Permission" : "Create Permission"}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? "Update the details for this permission."
                            : "Add a new permission to the system."}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. User Master - List" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="underMenu"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Under Menu / Module</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Masters" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Describe what this permission allows" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <SheetFooter className="mt-8">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEdit ? "Update" : "Create"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
