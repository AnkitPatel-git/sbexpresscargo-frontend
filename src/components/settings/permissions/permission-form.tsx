"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    underMenu: z.string().min(2, "Menu/Module must be at least 2 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
})

interface PermissionFormProps {
    initialData?: Permission | null
}

export function PermissionForm({ initialData }: PermissionFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<CreatePermissionDto>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            underMenu: "Masters",
            description: "",
        },
        values: initialData ? {
            name: initialData.name,
            underMenu: initialData.subModule || initialData.underMenu || "",
            description: initialData.description || "",
        } : undefined
    })

    const mutation = useMutation({
        mutationFn: (data: CreatePermissionDto) => {
            if (isEdit && initialData) {
                return permissionService.updatePermission(initialData.id, data)
            }
            return permissionService.createPermission(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['permission', Number(initialData.id)] })
            }
            toast.success(isEdit ? "Permission updated successfully" : "Permission created successfully")
            router.push("/settings/permissions")
        },
        onError: (error: any) => {
            toast.error(error.message || "Something went wrong")
        }
    })

    function onSubmit(values: CreatePermissionDto) {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

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

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => router.push("/settings/permissions")}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
