import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session-core";

const adminProtectedRoutes = [
    '/',
    '/feedbacks',
    '/services/repairs',
    '/services/installations',
    '/staffs',
    '/customers',
    '/subscribers',
    '/payments',
    '/invoices',
    '/applications',
    '/referral-payments',
    '/sellers',
];

const sellerProtectedRoutes = [
    '/seller/profile',
    '/seller/purchases',
    '/seller/customers',
    '/seller/services',
    '/seller/details',
    '/seller/settings',
];

const staffProtectedRoutes = [
    '/staff/profile',
    '/staff/services',
    '/staff/details',
    '/staff/payments',
    '/staff/tracking',
    '/staff/feedbacks',
    '/staff/notices',
    '/staff/tasks',
    '/staff/settings',
];

const customerProtectedRoutes = [
    '/customer/profile',
    '/customer/services',
    '/customer/referral'
];

export async function middleware(request: NextRequest) {
    // Block bots from generating link previews
    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
    const botUserAgents = [
        "whatsapp",
        "facebookexternalhit",
        "twitterbot",
        "slackbot",
        "linkedinbot",
        "telegrambot",
        "discordbot",
        "skypeuripreview",
        "viber",
        "facebot",
        "applebot"
    ];

    if (botUserAgents.some(bot => userAgent.includes(bot))) {
        return new NextResponse(null, { status: 403 });
    }

    const path = request.nextUrl.pathname
    const cookie = request.cookies.get('session')?.value
    const session = await decrypt(cookie)

    // Check if trying to access admin routes without admin session
    const isAdminRoute = adminProtectedRoutes.some(route => path === route || path.startsWith(route + '/'));
    if (isAdminRoute && (!session?.userId || session.role !== 'admin')) {
        // If staff or customer is trying to access admin route, redirect to their dashboard
        if (session?.role === 'staff') {
            return NextResponse.redirect(new URL('/staff/profile', request.nextUrl));
        }
        if (session?.role === 'customer') {
            return NextResponse.redirect(new URL('/customer/profile', request.nextUrl));
        }
        if (session?.role === 'seller') {
            return NextResponse.redirect(new URL('/seller/profile', request.nextUrl));
        }
        // Otherwise redirect to login
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    // Check if trying to access staff routes without staff session
    const isStaffRoute = staffProtectedRoutes.some(route => path === route || path.startsWith(route + '/'));
    if (isStaffRoute && (!session?.userId || session.role !== 'staff')) {
        return NextResponse.redirect(new URL('/staff/login', request.nextUrl));
    }

    // Check if trying to access customer routes without customer session
    const isCustomerRoute = customerProtectedRoutes.some(route => path === route || path.startsWith(route + '/'));
    if (isCustomerRoute && (!session?.userId || session.role !== 'customer')) {
        return NextResponse.redirect(new URL('/customer/login', request.nextUrl));
    }

    // Check if trying to access seller routes without seller session
    const isSellerRoute = sellerProtectedRoutes.some(route => path === route || path.startsWith(route + '/'));
    if (isSellerRoute && (!session?.userId || session.role !== 'seller')) {
        return NextResponse.redirect(new URL('/seller/login', request.nextUrl));
    }

    // Redirect logged-in users away from login pages
    if ((path === '/login' || path === '/staff/login' || path === '/customer/login' || path === '/seller/login') && session?.userId) {
        if (session.role === 'staff') {
            return NextResponse.redirect(new URL('/staff/profile', request.nextUrl));
        } else if (session.role === 'customer') {
            return NextResponse.redirect(new URL('/customer/profile', request.nextUrl));
        } else if (session.role === 'seller') {
            return NextResponse.redirect(new URL('/seller/profile', request.nextUrl));
        } else {
            return NextResponse.redirect(new URL('/', request.nextUrl));
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\.png$).*)'],
}
