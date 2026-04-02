
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value
    const { pathname } = request.nextUrl

    // Define protected and public routes
    const isPublicRoute = pathname === '/login'
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/users') || pathname.startsWith('/masters') || pathname.startsWith('/transactions') || pathname.startsWith('/utilities') || pathname.startsWith('/settings') || pathname.startsWith('/tax-charges')

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isPublicRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/dashboard/:path*', '/users/:path*', '/login', '/masters/:path*', '/transactions/:path*', '/utilities/:path*', '/settings/:path*', '/tax-charges/:path*'],
}
