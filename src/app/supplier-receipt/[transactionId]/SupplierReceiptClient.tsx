"use client";

import { SupplierDocFrame, SupplierReceiptBody, type SupplierLite, type Totals, type Txn } from "@/components/features/suppliers/supplierDoc";

type Props = {
  supplier: SupplierLite;
  transaction: Txn;
  totals: Totals;
  qrDataUrl: string | null;
  barcodeSvg: string;
  backHref: string | null;
};

/**
 * A single, clean supplier transaction receipt. The full account statement is a
 * separate document (`/supplier-statement/[supplierId]`), so one receipt no
 * longer carries every other transaction with it.
 */
export default function SupplierReceiptClient({ supplier, transaction, totals, qrDataUrl, barcodeSvg, backHref }: Props) {
  return (
    <SupplierDocFrame backHref={backHref} printLabel="Download / Print Receipt">
      <SupplierReceiptBody supplier={supplier} transaction={transaction} totals={totals} qrDataUrl={qrDataUrl} barcodeSvg={barcodeSvg} />
    </SupplierDocFrame>
  );
}
