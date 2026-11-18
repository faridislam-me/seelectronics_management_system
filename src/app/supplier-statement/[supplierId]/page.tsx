import { getSupplierStatement } from "@/actions/supplierActions";
import { SupplierDocFrame, SupplierStatementBody } from "@/components/features/suppliers/supplierDoc";
import { code128Svg } from "@/lib/code128";
import { supplierBaseUrl } from "@/utils";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/** Printable A4 full account statement for one supplier (admin or the supplier themselves). */
export default async function SupplierStatementPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  const res = await getSupplierStatement(supplierId);
  if (!res.success) notFound();

  const url = `${supplierBaseUrl()}/supplier-statement/${supplierId}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });
  } catch {
    qrDataUrl = null;
  }
  let barcodeSvg = "";
  try {
    barcodeSvg = code128Svg(supplierId, { height: 38, module: 1.3 });
  } catch {
    barcodeSvg = "";
  }

  const { supplier, ledger, overall, viewer } = res.data;
  return (
    <SupplierDocFrame
      backHref={viewer === "admin" ? `/suppliers/${supplier.supplierId}` : "/supplier/profile"}
      printLabel="Download / Print Statement"
    >
      <SupplierStatementBody
        supplier={supplier}
        ledger={ledger.map((e) => ({
          transactionId: e.transactionId,
          type: e.type,
          amount: e.amount,
          description: e.description,
          productType: e.productType,
          date: new Date(e.date).toISOString(),
          balance: e.balance,
        }))}
        overall={overall}
        qrDataUrl={qrDataUrl}
        barcodeSvg={barcodeSvg}
      />
    </SupplierDocFrame>
  );
}
