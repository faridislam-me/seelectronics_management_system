import { getCustomers } from "@/actions";
import { CopyButton } from "@/components/ui";
import { SearchParams } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Crown } from "lucide-react";
import InvoicePreviewButton from "../../features/invoices/InvoicePreviewButton";
import SellerTag from "@/components/ui/SellerTag";
import CustomerActionButtons from "./CustomerActionButtons";

export default async function CustomerList(
  params: SearchParams & {
    customersPromise?: Promise<{
      success: boolean;
      data?: any[];
      message?: string;
    }>;
  },
) {
  const { customersPromise, ...p } = params;
  const response = customersPromise
    ? await customersPromise
    : await getCustomers(p);

  if (!response.success) {
    return (
      <tr>
        <td colSpan={8} className="text-center py-3 text-red-500">
          <p>{response.message}</p>
        </td>
      </tr>
    );
  }

  if (response.data!.length === 0) {
    return (
      <tr className="border-b">
        <td colSpan={8} className="text-center py-3 text-gray-600">
          <p>No data</p>
        </td>
      </tr>
    );
  }

  const customers = response.data!;

  return customers.map((customer) => {
    // When the search hit a specific invoice / old customer ID on this account,
    // show THAT purchase in the row (invoice, amount, date) instead of the primary one.
    const hit = customer.matchedInvoice;
    const showHit = !!hit && (hit.invoiceNumber !== customer.invoiceNumber || (hit.originalCustomerId && hit.originalCustomerId !== customer.customerId));
    const inv = showHit ? hit : customer.invoice;
    const invNo = showHit ? hit.invoiceNumber : customer.invoiceNumber;
    const oldId = showHit && hit.originalCustomerId && hit.originalCustomerId !== customer.customerId ? hit.originalCustomerId : null;
    return (
    <tr
      key={customer.id}
      className={clsx("transition-colors group", showHit ? "bg-amber-50/70 hover:bg-amber-50" : "hover:bg-gray-50/50")}
    >
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {customer.customerId}
          </span>
          <CopyButton content={customer.customerId} />
        </div>
        {oldId && (
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900" title="এই ইনভয়েসটি আগে এই আইডিতে ছিল; এখন এক অ্যাকাউন্টে">
            পুরনো ID {oldId} <CopyButton content={oldId} />
          </span>
        )}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {invNo ? (
            <div className="flex items-center gap-1.5">
              <InvoicePreviewButton
                invoiceData={inv}
                className="text-brand font-bold hover:underline cursor-pointer text-sm sm:text-base"
              >
                <span>#{invNo}</span>
              </InvoicePreviewButton>
              <CopyButton content={invNo} />
            </div>
          ) : (
            <span className="text-sm sm:text-sm text-gray-400 italic">
              No Invoice
            </span>
          )}
        </div>
        {showHit && (
          <span className="block text-[11px] font-bold text-amber-800">সার্চে মিলেছে{hit.seller ? ` · ${hit.seller.shopName}` : ""}</span>
        )}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {customer.name}
          </span>
          {customer.vipStatus === "approved" && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border border-amber-300 shadow-sm text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Crown size={12} strokeWidth={3} className="text-amber-800" />
              VIP
            </span>
          )}
          {customer.isWarrantyStopped && (
            customer.warrantyStopReason === "misuse" ? (
              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wide">ওয়ারেন্টি বাতিল</span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wide">বকেয়া ব্লক</span>
            )
          )}
        </div>
        <SellerTag seller={customer.seller} />
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-bold text-sm sm:text-base">
        <span>{customer.phone}</span>
        <CopyButton content={customer.phone} />
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <p
          title={customer.address}
          className="truncate max-w-[200px] text-gray-600 text-[16px] font-medium"
        >
          {customer.address}
        </p>
      </td>
      <td className="py-4 px-4 whitespace-nowrap text-right">
        {showHit ? (
          <>
            <span className={clsx("font-black text-sm sm:text-base", (hit.dueAmount ?? 0) > 0 ? "text-red-500" : "text-emerald-600")}>
              ৳{Number(hit.total ?? 0).toLocaleString()}
            </span>
            {(hit.dueAmount ?? 0) > 0 && <span className="block text-[11px] font-bold text-red-500">৳{Number(hit.dueAmount).toLocaleString()} due</span>}
            <span className="block text-[11px] font-semibold text-gray-400">এই ইনভয়েস · অ্যাকাউন্টে মোট ৳{(customer.aggregate?.totalBill ?? 0).toLocaleString()}</span>
          </>
        ) : (
          <>
        <span
          className={clsx(
            "font-black text-sm sm:text-base",
            (customer.aggregate?.totalDue ?? customer.invoice?.dueAmount ?? 0) > 0
              ? "text-red-500"
              : "text-emerald-600",
          )}
        >
          ৳{(customer.aggregate?.totalBill ?? customer.invoice?.total ?? 0).toLocaleString()}
        </span>
        {(customer.aggregate?.totalDue ?? 0) > 0 && (
          <span className="block text-[11px] font-bold text-red-500">
            ৳{customer.aggregate.totalDue.toLocaleString()} due
          </span>
        )}
        {(customer.aggregate?.invoiceCount ?? 0) > 1 && (
          <span className="block text-[11px] font-semibold text-gray-400">
            {customer.aggregate.invoiceCount} invoices
          </span>
        )}
          </>
        )}
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-sm sm:text-sm font-bold">
        {inv?.date ? formatDate(inv.date) : "N/A"}
      </td>
      <td className="py-3 px-4 whitespace-nowrap md:sticky md:right-0 bg-white group-hover:bg-gray-50 transition-colors md:shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
        <CustomerActionButtons customerData={customer} />
      </td>
    </tr>
    );
  });
}
