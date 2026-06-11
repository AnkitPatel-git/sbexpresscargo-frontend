
"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { userService } from "@/services/user-service"
import { authApi } from "@/lib/api-client"
import { isAuthFailureMessage, redirectToLogin } from "@/lib/auth-session"
import { hasPortalPermission } from "@/lib/portal-permissions"
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

function mergeProfileUser(stored: User, fresh: UtilityUser): User {
    return {
        ...stored,
        ...fresh,
        role: fresh.role ?? stored.role,
        permissions: fresh.permissions ?? stored.permissions,
        profile: fresh.profile ?? stored.profile,
        customerIds: fresh.customerIds ?? stored.customerIds,
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const persistUser = useCallback((next: User) => {
        setUser(next)
        localStorage.setItem("user", JSON.stringify(next))
    }, [])

    useEffect(() => {
        let cancelled = false

        const bootstrap = async () => {
            const storedToken = Cookies.get("accessToken")
            const storedUserRaw = localStorage.getItem("user")

            if (!storedToken || !storedUserRaw) {
                if (!cancelled) setIsLoading(false)
                return
            }

            let parsed: User
            try {
                parsed = JSON.parse(storedUserRaw) as User
            } catch {
                if (!cancelled) setIsLoading(false)
                return
            }

            if (!cancelled) {
                setToken(storedToken)
            }

            try {
                const response = await authApi.getProfile()
                if (cancelled) return
                if (response.success && response.data) {
                    persistUser(
                        mergeProfileUser(parsed, {
                            ...response.data,
                            permissions: response.data.permissions ?? parsed.permissions,
                            role: response.data.role ?? parsed.role,
                        } as User),
                    )
                } else {
                    setUser(parsed)
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : ""
                if (isAuthFailureMessage(message)) {
                    redirectToLogin()
                    return
                }
                if (!cancelled) setUser(parsed)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        void bootstrap()
        return () => {
            cancelled = true
        }
    }, [persistUser])

    const login = (data: { accessToken: string; user: User }) => {
        setToken(data.accessToken)
        persistUser(data.user)

        Cookies.set("accessToken", data.accessToken, { expires: 7 })
        localStorage.setItem("accessToken", data.accessToken)

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

    const hasPermission = useCallback(
        (permission: string) => {
            if (isLoading) return false
            return hasPortalPermission(user?.permissions, user?.role?.identifier, permission)
        },
        [isLoading, user?.permissions, user?.role?.identifier],
    )

    const isCustomerUser = !isLoading && user?.role?.identifier === "CUSTOMER"
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
