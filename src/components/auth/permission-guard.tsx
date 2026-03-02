
"use client"

import React from "react"
import { useAuth } from "@/context/auth-context"

interface PermissionGuardProps {
    permission?: string
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function PermissionGuard({
    permission,
    fallback = null,
    children,
}: PermissionGuardProps) {
    const { hasPermission, isLoading } = useAuth()

    if (isLoading) return null

    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
