
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface User {
    id: number
    username: string
    email: string
    roleId: number
    role: {
        id: number
        name: string
        identifier: string
    }
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
