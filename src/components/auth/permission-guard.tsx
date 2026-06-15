
"use client"

import React from "react"
import { useAuth } from "@/context/auth-context"

interface PermissionGuardProps {
    permission?: string
    /** User needs any one of these permissions (OR). */
    anyOf?: readonly string[]
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function PermissionGuard({
    permission,
    anyOf,
    fallback = null,
    children,
}: PermissionGuardProps) {
    const { hasPermission, isLoading } = useAuth()

    if (isLoading) return null

    if (anyOf?.length) {
        if (!anyOf.some((p) => hasPermission(p))) {
            return <>{fallback}</>
        }
    } else if (permission && !hasPermission(permission)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
