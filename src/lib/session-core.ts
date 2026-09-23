// Edge-safe session helpers (no database imports) — used by middleware.
import { JWTPayload, jwtVerify, SignJWT } from "jose";

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${process.env.SESSION_EXPIRY_DAY!}d`)
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    try {
        if (!session) return null
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256']
        })
        return payload
    } catch (error) {
        return null
    }
}
