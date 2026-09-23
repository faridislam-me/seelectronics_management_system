import { db } from '@/db/drizzle';
import { sellers, staffs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import 'server-only'
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from 'react';

export { encrypt, decrypt } from "./session-core";
import { encrypt } from "./session-core";
import { decrypt } from "./session-core";

export async function createSession({ username, userId, role = 'admin' }: { username: string, userId: string, role?: 'admin' | 'staff' | 'customer' | 'seller' }) {
    const expiresAt = new Date(Date.now() + parseInt(process.env.SESSION_EXPIRY_DAY!) * 24 * 60 * 60 * 1000)
    const session = await encrypt({ userId, username, role, expiresAt })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/'
    })
}

export const verifySession = cache(async (shouldRedirect = true, expectedRole?: 'admin' | 'staff' | 'customer' | 'seller') => {
    const cookie = (await cookies()).get('session')?.value
    const session = await decrypt(cookie)

    if (!session?.userId) {
        if (shouldRedirect) {
            redirect('/login')
        }
        return null
    }

    if (expectedRole && session.role !== expectedRole) {
        if (shouldRedirect) {
            if (session.role === 'staff') redirect('/staff/profile')
            else if (session.role === 'customer') redirect('/customer/profile')
            else if (session.role === 'seller') redirect('/seller/profile')
            else redirect('/')
        }
        return null
    }

    // Active check for blocked staff
    if (session.role === 'staff') {
        const [staff] = await db.select({ isActiveStaff: staffs.isActiveStaff })
            .from(staffs)
            .where(eq(staffs.staffId, session.userId as string))
            .limit(1);


        if (!staff || !staff.isActiveStaff) {
            const cookieStore = await cookies();
            cookieStore.delete('session');
            if (shouldRedirect) {
                redirect('/staff/login');
            }
            return null;
        }
    }

    // Active check for blocked sellers
    if (session.role === 'seller') {
        const [seller] = await db.select({ isActiveSeller: sellers.isActiveSeller })
            .from(sellers)
            .where(eq(sellers.sellerId, session.userId as string))
            .limit(1);

        if (!seller || !seller.isActiveSeller) {
            const cookieStore = await cookies();
            cookieStore.delete('session');
            if (shouldRedirect) {
                redirect('/seller/login');
            }
            return null;
        }
    }

    return { isAuth: true, userId: session.userId, username: session.username, role: session.role }
})

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}