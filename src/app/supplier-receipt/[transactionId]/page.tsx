import { getSupplierReceipt } from "@/actions/supplierActions";
import { code128Svg } from "@/lib/code128";
import { decrypt } from "@/lib/session-core";
import { getBaseUrl } from "@/utils";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import SupplierReceiptClient from "./SupplierReceiptClient";

export const dynamic = "force-dynamic";

/** Printable A4 receipt for one supplier ledger entry (admin or the owning supplier). */
export default async function SupplierReceiptPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params;
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) redirect("/supplier/login");

  const res = await getSupplierReceipt(transactionId);
  if (!res.success) {
    if (res.message === "Unauthorized") redirect(session.role === "admin" ? "/login" : "/supplier/login");
    notFound();
  }

  const url = `${getBaseUrl()}/supplier-receipt/${transactionId}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
  } catch {
    qrDataUrl = null;
  }
  let barcodeSvg = "";
  try {
    barcodeSvg = code128Svg(transactionId, { height: 38, module: 1.3 });
  } catch {
    barcodeSvg = "";
  }

  const { supplier, transaction, totals, viewer } = res.data;
  return (
    <SupplierReceiptClient
      supplier={supplier}
      transaction={{ ...transaction, date: new Date(transaction.date).toISOString() }}
      totals={totals}
      qrDataUrl={qrDataUrl}
      barcodeSvg={barcodeSvg}
      backHref={viewer === "admin" ? `/suppliers/${supplier.supplierId}` : "/supplier/profile"}
    />
  );
}
