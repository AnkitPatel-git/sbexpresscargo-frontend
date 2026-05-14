
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { userService } from "@/services/user-service"
import type { UtilityUser } from "@/types/utilities/user"

type User = UtilityUser & {
    role: NonNullable<UtilityUser["role"]>
    permissions: string[]
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (data: { accessToken: string; user: User }) => void
    logout: () => void
    isAuthenticated: boolean
    hasPermission: (permission: string) => boolean
    isCustomerUser: boolean
    effectiveCustomerIds: number[]
    defaultCustomerId: number | null
    isAllowedCustomer: (customerId?: number | null) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const normalizeCustomerIds = (user: User | null): number[] => {
    if (!user) return []
    const ids = new Set<number>()
    const push = (value: unknown) => {
        const num = Number(value)
        if (Number.isInteger(num) && num > 0) ids.add(num)
    }
    ;(user.customerIds || []).forEach(push)
    push(user.customerId)
    push(user.profile?.customerId)
    return Array.from(ids)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Load auth data from cookies/localStorage on mount
        const storedToken = Cookies.get("accessToken")
        const storedUser = localStorage.getItem("user")

        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = (data: { accessToken: string; user: User }) => {
        setToken(data.accessToken)
        setUser(data.user)

        // Store in cookie for middleware (7 days)
        Cookies.set("accessToken", data.accessToken, { expires: 7 })
        // Store user info in localStorage
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("user", JSON.stringify(data.user))

        router.push("/dashboard")
    }

    const logout = () => {
        void userService.logout().catch(() => undefined)
        setToken(null)
        setUser(null)
        Cookies.remove("accessToken")
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        router.push("/login")
    }

    const hasPermission = (permission: string) => {
        if (!user) return false
        // superuser has all permissions
        if (user.role.identifier === "SUPER_ADMIN" || user.role.identifier === "superuser") return true
        return user.permissions.includes(permission)
    }
    const isCustomerUser = user?.role?.identifier === "CUSTOMER"
    const effectiveCustomerIds = normalizeCustomerIds(user)
    const defaultCustomerId = effectiveCustomerIds[0] ?? null
    const isAllowedCustomer = (customerId?: number | null) => {
        const num = Number(customerId)
        if (!Number.isInteger(num) || num <= 0) return false
        if (!isCustomerUser) return true
        return effectiveCustomerIds.includes(num)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                isAuthenticated: !!token,
                hasPermission,
                isCustomerUser,
                effectiveCustomerIds,
                defaultCustomerId,
                isAllowedCustomer,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
