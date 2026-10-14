import { SellerBlockedAppView } from "@/components/features/sellers/SellerBlockedScreen";
import { db } from "@/db/drizzle";
import { sellers } from "@/db/schema";
import { decrypt } from "@/lib/session-core";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Landing page for a seller account that was blocked while logged in. A blocked
 * seller is redirected here (instead of /seller/login, which the middleware would
 * bounce straight back to the portal). The session cookie is still present, so we
 * look up who is blocked to show their name/shop; the sign-in button clears it.
 */
export default async function SellerBlockedPage() {
  const session = await decrypt((await cookies()).get("session")?.value);

  let name: string | null = null;
  let sellerId: string | null = null;
  let shopName: string | null = null;

  if (session?.userId && session.role === "seller") {
    try {
      const [seller] = await db
        .select({ sellerId: sellers.sellerId, ownerName: sellers.ownerName, shopName: sellers.shopName })
        .from(sellers)
        .where(eq(sellers.sellerId, session.userId as string))
        .limit(1);
      if (seller) {
        name = seller.ownerName;
        sellerId = seller.sellerId;
        shopName = seller.shopName;
      }
    } catch (error) {
      console.error("seller blocked page lookup failed:", error);
    }
  }

  return <SellerBlockedAppView name={name} sellerId={sellerId} shopName={shopName} />;
}
