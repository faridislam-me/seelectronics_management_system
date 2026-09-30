import { getSupplierReceipt } from "@/actions/supplierActions";
import { code128Svg } from "@/lib/code128";
import { getBaseUrl } from "@/utils";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import SupplierReceiptClient from "./SupplierReceiptClient";

export const dynamic = "force-dynamic";

/** Printable A4 receipt for one supplier ledger entry (opened from the link; no login needed). */
export default async function SupplierReceiptPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params;
  const res = await getSupplierReceipt(transactionId);
  if (!res.success) notFound();

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

  const { supplier, transaction, totals, ledger, overall, viewer } = res.data;
  return (
    <SupplierReceiptClient
      supplier={supplier}
      transaction={{ ...transaction, date: new Date(transaction.date).toISOString() }}
      totals={totals}
      qrDataUrl={qrDataUrl}
      barcodeSvg={barcodeSvg}
      ledger={ledger.map((e) => ({ transactionId: e.transactionId, type: e.type, amount: e.amount, description: e.description, date: new Date(e.date).toISOString(), balance: e.balance }))}
      overall={overall}
      backHref={viewer === "admin" ? `/suppliers/${supplier.supplierId}` : viewer === "supplier" ? "/supplier/profile" : null}
    />
  );
}
