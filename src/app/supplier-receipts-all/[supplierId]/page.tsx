import { getSupplierAllReceipts } from "@/actions/supplierActions";
import { SupplierDocFrame, SupplierReceiptBody } from "@/components/features/suppliers/supplierDoc";
import { code128Svg } from "@/lib/code128";
import { supplierBaseUrl } from "@/utils";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * Every transaction of a supplier printed as its own one-per-page receipt
 * (admin or the supplier themselves). "সকল রসিদ ডাউনলোড".
 */
export default async function SupplierAllReceiptsPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  const res = await getSupplierAllReceipts(supplierId);
  if (!res.success) notFound();

  const { supplier, receipts, viewer } = res.data;

  // One QR + barcode per receipt (each points at its own single-receipt link).
  const assets = await Promise.all(
    receipts.map(async (r) => {
      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await QRCode.toDataURL(`${supplierBaseUrl()}/supplier-receipt/${r.transaction.transactionId}`, { margin: 1, width: 240 });
      } catch {
        qrDataUrl = null;
      }
      let barcodeSvg = "";
      try {
        barcodeSvg = code128Svg(r.transaction.transactionId, { height: 38, module: 1.3 });
      } catch {
        barcodeSvg = "";
      }
      return { qrDataUrl, barcodeSvg };
    }),
  );

  return (
    <SupplierDocFrame
      backHref={viewer === "admin" ? `/suppliers/${supplier.supplierId}` : "/supplier/profile"}
      printLabel="Download / Print All Receipts"
    >
      {receipts.length === 0 ? (
        <div className="sr-sheet w-[21cm] bg-white shadow-xl print:shadow-none p-10 text-center text-[#5b6784]">কোনো রসিদ নেই।</div>
      ) : (
        receipts.map((r, i) => (
          <SupplierReceiptBody
            key={r.transaction.transactionId}
            supplier={supplier}
            transaction={{ ...r.transaction, date: new Date(r.transaction.date).toISOString() }}
            totals={r.totals}
            qrDataUrl={assets[i].qrDataUrl}
            barcodeSvg={assets[i].barcodeSvg}
          />
        ))
      )}
    </SupplierDocFrame>
  );
}
