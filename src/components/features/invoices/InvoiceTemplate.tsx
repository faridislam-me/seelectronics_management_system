import { InvoicesType, Product } from "@/types";
import { formatDate, formatWarrantyDuration } from "@/utils";
import clsx from "clsx";
import { parseManualDiscount } from "@/lib/invoiceDiscount";

// The letterhead background has a fixed footer (notes / seal / signatures) baked
// near the bottom, so a page can only hold a few product rows before the table
// would run into it. Instead of shrinking everything to fit, we paginate: up to
// 4 products per A4 page, and any extra products flow onto new pages. The totals
// + notes render once, on the last page, below that page's products. Printing a
// multi-page invoice therefore produces that many physical pages.
const PRODUCTS_PER_PAGE = 4;

export default function InvoiceTemplate({
  data,
}: {
  data: InvoicesType & { bgImage: string };
}) {
  // Manual admin discount is stored as a note line; the rest of subtotal − total is the referral discount.
  const manual = parseManualDiscount(data.notes);
  const totalDiscount = Math.max(0, data.subtotal - data.total);
  const manualAmount = manual ? Math.min(manual.amount, totalDiscount) : 0;
  const referralAmount = Math.max(0, totalDiscount - manualAmount);

  const products: Product[] = data.products ?? [];
  // Chunk products into pages of at most PRODUCTS_PER_PAGE. Always at least one page.
  const pages: Product[][] = [];
  for (let i = 0; i < Math.max(products.length, 1); i += PRODUCTS_PER_PAGE) {
    pages.push(products.slice(i, i + PRODUCTS_PER_PAGE));
  }
  const multiPage = pages.length > 1;

  // Seller shown under Customer ID: per-invoice attribution first, legacy customer seller as fallback.
  const soldBy: { sellerId: string; shopName: string } | null =
    (data as any).seller ?? (data as any).customer?.seller ?? null;

  const headerBg = data.dueAmount > 0 ? "bg-[#FFD7DC]" : "bg-[#D7E6F5]";

  const tableHead = (
    <thead>
      <tr className={clsx("border border-black", headerBg)}>
        <th className="text-left py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black w-4">
          No
        </th>
        <th className="text-left py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black">
          Product details
        </th>
        <th className="text-center py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black">
          Warrenty
        </th>
        <th className="text-center py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black">
          Qty
        </th>
        <th className="text-right py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black">
          Unit Price
        </th>
        <th className="text-right py-2 px-3 font-bold text-sm whitespace-nowrap border-black">
          Total
        </th>
      </tr>
    </thead>
  );

  return (
    <>
      {pages.map((pageProducts, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        const startIndex = pageIndex * PRODUCTS_PER_PAGE;
        return (
          <div
            key={pageIndex}
            className="relative w-[210mm] h-[297mm] mx-auto bg-white bg-center bg-no-repeat bg-cover overflow-hidden"
            style={{
              backgroundImage: `url(${data.bgImage})`,
              fontFamily: `Inter, 'Tiro Bangla', SolaimanLipi, sans-serif`,
              // Each page but the last forces a page break so print produces one
              // physical page per chunk; the last one must not, or a blank page trails.
              breakAfter: isLast ? "auto" : "page",
              pageBreakAfter: isLast ? "auto" : "always",
            }}
          >
            <div className="absolute top-[200px] left-[40px] right-[40px]">
              <div className="text-right text-xl font-bold tracking-wide mb-4">
                INVOICE
                {multiPage && (
                  <span className="ml-2 text-sm font-semibold text-slate-600">
                    (Page {pageIndex + 1} of {pages.length})
                  </span>
                )}
              </div>

              {isFirst ? (
                <div className="flex justify-between mb-4 text-sm">
                  <div className="space-y-1">
                    <div>
                      <span className="font-semibold text-xl ">Invoice To</span>
                    </div>
                    <div>
                      <span className="font-semibold">Name :</span>{" "}
                      {data.customerName}
                    </div>
                    <div>
                      <span className="font-semibold">Address :</span>{" "}
                      {data.customerAddress}
                    </div>
                    <div>
                      <span className="font-semibold">Phone :</span>{" "}
                      {data.customerPhone}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="font-semibold ">Invoice number #</span>{" "}
                      {data.invoiceNumber}
                    </div>
                    <div>
                      <span className="font-semibold">Date :</span>{" "}
                      {formatDate(data.date)}
                    </div>
                    <div>
                      <span className="font-semibold">Customer ID :</span>{" "}
                      {data.customerId}
                    </div>
                    {data.serviceId && (
                      <div>
                        <span className="font-semibold">Service ID :</span>{" "}
                        {data.serviceId}
                      </div>
                    )}
                    {soldBy && (
                      <div>
                        <span className="font-semibold">Sold by :</span>{" "}
                        {soldBy.shopName} ({soldBy.sellerId})
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Continuation pages: a compact header so the page is still identifiable.
                <div className="flex justify-between mb-4 text-sm">
                  <div>
                    <span className="font-semibold">Name :</span>{" "}
                    {data.customerName}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">Invoice number #</span>{" "}
                    {data.invoiceNumber}
                  </div>
                </div>
              )}

              <table className="w-full border-collapse">
                {tableHead}
                <tbody>
                  {pageProducts.map((product, i) => {
                    const index = startIndex + i;
                    return (
                      <tr key={product.id} className="border border-black">
                        <td className="py-2 px-3 text-sm whitespace-nowrap border-r border-black">
                          {index + 1}.
                        </td>
                        <td className="py-2 px-3 text-sm break-words border-r border-black">
                          {product.type.toUpperCase()}-{product.model}
                          {product.serialNumber ? (
                            <span className="block text-sm">
                              S/N: {product.serialNumber}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2 px-3 text-center text-sm whitespace-nowrap border-r border-black">
                          {formatWarrantyDuration(product.warrantyDurationMonths)}
                        </td>
                        <td className="py-2 px-3 text-center text-sm whitespace-nowrap border-r border-black">
                          {product.quantity}
                        </td>
                        <td className="py-2 px-3 text-right text-sm whitespace-nowrap border-r border-black">
                          {product.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-sm whitespace-nowrap font-semibold border-black">
                          {(product.unitPrice * product.quantity).toLocaleString()} TK
                        </td>
                      </tr>
                    );
                  })}

                  {isLast && (
                    <tr>
                      <td colSpan={6} className="py-2 px-3 border border-black">
                        {/* Notes (e.g. referral / discount notes) sit on the left of the totals, inside the table, so they never overlap the notice box below. Extra horizontal gap keeps the amounts clear of the note text. */}
                        <div className="flex justify-between items-start gap-12">
                          <div
                            className="flex-1 min-w-0 text-left text-sm font-semibold leading-snug text-slate-900 pt-0.5"
                            style={{
                              fontFamily: "SolaimanLipi, 'Tiro Bangla', sans-serif",
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {data.notes || ""}
                          </div>
                          <div className="text-right space-y-1 shrink-0">
                            {totalDiscount > 0 && (
                              <div className="text-base">
                                <span className="font-semibold">Subtotal : </span>
                                {data.subtotal.toLocaleString()} Tk
                              </div>
                            )}
                            {referralAmount > 0.5 && (
                              <div className="text-base text-red-600">
                                <span className="font-semibold">Referral Discount : </span>
                                -{Math.round(referralAmount).toLocaleString()} Tk
                              </div>
                            )}
                            {manualAmount > 0 && (
                              <div className="text-base text-red-600">
                                <span className="font-semibold">
                                  Discount{manual?.type === "percent" ? ` (${manual.value}%)` : ""} :{" "}
                                </span>
                                -{Math.round(manualAmount).toLocaleString()} Tk
                              </div>
                            )}
                            <div className="text-base">
                              <span className="font-semibold">Total Bill : </span>
                              {data.total.toLocaleString()} Tk
                            </div>
                            {data.dueAmount > 0 ? (
                              <>
                                <div className="text-base">
                                  <span className="font-semibold">Advance :</span>{" "}
                                  {(data.total - data.dueAmount).toLocaleString()} Tk
                                </div>
                                <div className="text-base">
                                  <span className="font-semibold">
                                    {data.dueType === "installment" ? "Installment" : "Due"} :
                                  </span>{" "}
                                  <span className="font-bold">
                                    {data.dueAmount.toLocaleString()} Tk
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-base">
                                <span className="font-semibold">Paid : </span>
                                {data.total.toLocaleString()} Tk
                              </div>
                            )}
                            <div className="text-base">
                              <span className="font-semibold">Payment Method : </span>
                              {data.paymentType.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
