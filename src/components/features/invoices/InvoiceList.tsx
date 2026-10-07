import { getInvoices } from "@/actions";
import SellerTag from "@/components/ui/SellerTag";
import { CopyButton } from "@/components/ui";
import { SearchParams } from "@/types";
import { formatDate } from "@/utils";
import InvoiceActionButtons from "./InvoiceActionButtons";

export default async function InvoiceList(
  params: SearchParams & {
    invoicesPromise?: Promise<{
      success: boolean;
      data?: any[];
      message?: string;
    }>;
  },
) {
  const { invoicesPromise, ...p } = params;
  const response = invoicesPromise
    ? await invoicesPromise
    : await getInvoices(p);

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

  const invoices = response.data!;

  return invoices.map((invoice) => (
    <tr
      key={invoice.invoiceNumber}
      className="hover:bg-gray-50/50 transition-colors group"
    >
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand text-sm sm:text-base">
            #{invoice.invoiceNumber}
          </span>
          <CopyButton content={invoice.invoiceNumber} />
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        {invoice.customerId ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold text-sm sm:text-base">
              {invoice.customerId}
            </span>
            <CopyButton content={invoice.customerId} />
          </div>
        ) : (
          <span className="text-sm sm:text-sm text-gray-400 italic">N/A</span>
        )}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="font-bold text-gray-900 text-sm sm:text-base">
          {invoice.customerName}
        </span>
        <SellerTag seller={invoice.customer?.seller} />
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-bold text-sm sm:text-base">
        {invoice.customerPhone}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <p
          title={invoice.customerAddress}
          className="truncate max-w-[200px] text-gray-600 text-sm sm:text-sm font-medium"
        >
          {invoice.customerAddress}
        </p>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-emerald-600 text-sm sm:text-base">
        ৳{invoice.total.toLocaleString()}
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-sm sm:text-sm font-bold">
        {formatDate(invoice.date!)}
      </td>
      <td className="py-3 px-4 whitespace-nowrap md:sticky md:right-0 bg-white group-hover:bg-gray-50 transition-colors md:shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
        <InvoiceActionButtons invoiceData={invoice} />
      </td>
    </tr>
  ));
}
