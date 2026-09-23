import "server-only";
import { getSellerPortalData, verifySellerSession } from "@/actions/sellerActions";
import { redirect } from "next/navigation";

/** Loads the logged-in seller with stats, or redirects to login. */
export async function loadSellerPortal() {
  const session = await verifySellerSession();
  if (!session.isAuth) redirect("/seller/login");
  const res = await getSellerPortalData(session.userId);
  if (!res.success || !res.data) redirect("/seller/login");
  return res.data;
}

export type SellerPortalData = Awaited<ReturnType<typeof loadSellerPortal>>;
