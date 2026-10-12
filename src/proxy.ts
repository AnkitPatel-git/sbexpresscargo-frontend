
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function tokenRole(token: string | undefined): string | null {
    if (!token) return null
    const payload = token.split('.')[1]
    if (!payload) return null
    try {
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            roleIdentifier?: string
        }
        return typeof json.roleIdentifier === 'string' ? json.roleIdentifier.toUpperCase() : null
    } catch {
        return null
    }
}

function customerMayOpen(pathname: string): boolean {
    return (
        pathname === '/dashboard' ||
        pathname === '/profile' ||
        pathname === '/change-password' ||
        pathname.startsWith('/transactions/shipment') ||
        pathname.startsWith('/transactions/tracking') ||
        pathname === '/report/customer-mis' ||
        pathname.startsWith('/customer')
    )
}

export function proxy(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value
    const customerPortal = request.cookies.get('sbPortal')?.value === 'customer'
    const { pathname } = request.nextUrl

    // Define protected and public routes
    const isCustomerLogin = pathname === '/customer/login'
    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password' ||
        isCustomerLogin
    const isCustomerApp = pathname.startsWith('/customer') && !isCustomerLogin
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/users') || pathname.startsWith('/masters') || pathname.startsWith('/transactions') || pathname.startsWith('/utilities') || pathname.startsWith('/settings') || isCustomerApp

    if (isProtectedRoute && !token) {
        const loginPath = isCustomerApp || customerPortal ? '/customer/login' : '/login'
        return NextResponse.redirect(new URL(loginPath, request.url))
    }

    if (isPublicRoute && token && !isCustomerLogin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (token && tokenRole(token) === 'CUSTOMER' && !customerMayOpen(pathname) && !isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/dashboard/:path*', '/dashboard', '/users/:path*', '/login', '/forgot-password', '/reset-password', '/masters/:path*', '/transactions/:path*', '/utilities/:path*', '/settings/:path*', '/report/:path*', '/document/:path*', '/profile', '/change-password', '/customer', '/customer/:path*'],
}
