import { InvoicesType, Product } from "@/types";
import { formatDate, formatWarrantyDuration } from "@/utils";
import clsx from "clsx";
import { User, ClipboardList, CreditCard, ShieldX, ShieldXIcon, ShieldCheck } from "lucide-react";

interface InvoiceWebViewProps {
  data: InvoicesType & { products: Product[] };
}

export default function InvoiceWebView({ data }: InvoiceWebViewProps) {
  const isDue = data.dueAmount > 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-3 sm:p-5 space-y-4 border-4 border-double border-gray-100 rounded-lg">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-6 border-b-2 border-dashed border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-1">
            Sales Invoice
          </h1>
          <p className={clsx(
            "text-xs font-bold tracking-[0.3em] uppercase opacity-80",
            isDue ? "text-rose-600" : "text-emerald-600"
          )}>
            {isDue ? "Payment Pending" : "Fully Paid Receipt"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-black text-gray-500 uppercase tracking-widest mb-1">Invoice Number</p>
          <p className="text-lg font-black text-gray-900">#{data.invoiceNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer Information Table */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <User size={16} className="text-brand" />
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Customer Details</h3>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Name</td>
                  <td className="p-3 font-bold text-gray-900">{data.customerName}</td>
                </tr>
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Phone</td>
                  <td className="p-3 font-bold text-gray-900">{data.customerPhone}</td>
                </tr>
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Address</td>
                  <td className="p-3 font-medium text-gray-600 leading-tight">{data.customerAddress}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Invoice Summary Table */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <ClipboardList size={16} className="text-brand" />
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Invoice Summary</h3>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Date</td>
                  <td className="p-3 font-bold text-gray-900">{formatDate(data.date)}</td>
                </tr>
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Cust ID</td>
                  <td className="p-3 font-black text-gray-400 opacity-80 tracking-tighter">#{data.customerId}</td>
                </tr>
                <tr>
                  <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Method</td>
                  <td className="p-3 font-black text-brand uppercase">{data.paymentType}</td>
                </tr>
                {data.serviceId && (
                  <tr>
                    <td className="w-1/3 bg-gray-50/50 p-3 font-black text-gray-600 uppercase text-[13px] tracking-widest border-r border-gray-200">Service ID</td>
                    <td className="p-3 font-bold text-brand uppercase tracking-tighter">#{data.serviceId}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    
{/* Main Product List */}
<section className="space-y-5">
  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-2">
    Product Specifications
  </h3>

  <div className="grid gap-5">
    {data.products?.map((product, index) => (
      <div
        key={product.id}
        className="relative group rounded-lg border border-gray-300 bg-gradient-to-br from-white via-gray-50 to-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 blur-3xl opacity-40 group-hover:opacity-60 transition" />

        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-3 py-1 text-[13px] font-black tracking-widest bg-blue-50 text-blue-700 rounded-full mb-2">
                {product.type}
              </span>

              <h4 className="text-lg font-extrabold text-gray-900 leading-tight">
                {product.model}
              </h4>

              <p className="text-[13px] text-gray-400 font-bold mt-1">
                ITEM #{(index + 1).toString().padStart(2, "0")}
              </p>
            </div>

            {/* Price Highlight */}
            <div className="text-right">
              <p className="text-[13px] font-bold text-gray-400 uppercase">
                Line Total
              </p>
              <p className="text-xl font-black text-blue-600 tracking-tight">
                ৳{(product.unitPrice * product.quantity).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-dashed border-gray-200" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            
            {/* Warranty */}
            <div className="bg-white/60 backdrop-blur px-3 py-2 rounded-lg border border-gray-100">
              <p className="text-[13px] text-gray-600 font-bold uppercase">
                Warranty
              </p>
             <p className="font-bold text-gray-800 flex items-center gap-2">
  {product.warrantyDurationMonths === 0 ? (
    <>
      <ShieldXIcon className="w-4 h-4 text-red-500" />
      <span>None</span>
    </>
  ) : (
    <>
      <ShieldCheck className="w-4 h-4 text-green-500 text-lg" />
      <span>{formatWarrantyDuration(product.warrantyDurationMonths)}</span>
    </>
  )}
</p>
            </div>

            {/* Quantity */}
            <div className="bg-white/60 backdrop-blur px-3 py-2 rounded-lg border border-gray-100">
              <p className="text-[13px] text-gray-600 font-bold uppercase">
                Quantity
              </p>
              <p className="font-black text-gray-900 text-lg">
                ×{product.quantity}
              </p>
            </div>

            {/* Unit Price */}
            <div className="bg-white/60 backdrop-blur px-3 py-2 rounded-lg border border-gray-100">
              <p className="text-[13px] text-gray-600 font-bold uppercase">
                Unit Price
              </p>
              <p className="font-semibold text-gray-800 text-lg">
                ৳{product.unitPrice.toLocaleString()}
              </p>
            </div>

            {/* Status Feel (optional visual boost) */}
            <div className="bg-gradient-to-br from-blue-50 to-white px-3 py-2 rounded-lg border border-blue-100">
              <p className="text-[13px] text-blue-400 font-bold uppercase">
                Status
              </p>
              <p className="font-black text-blue-600">
                ACTIVE
              </p>
            </div>

          </div>
        </div>
      </div>
    ))}
  </div>
</section>
     
      {/* Financial Summary */}
<div className="flex flex-col md:flex-row justify-end pt-10 border-t border-gray-100">
  <div className="w-full md:w-80 rounded-lg overflow-hidden border border-gray-200 shadow-lg bg-white hover:shadow-2xl transition">

    <table className="w-full text-sm">
      <tbody className="divide-y divide-gray-100">

        {data.subtotal > data.total && (
          <>
            <tr className="bg-gradient-to-r from-gray-50 to-white">
              <td className="p-4 font-black text-gray-500 uppercase text-[13px] tracking-widest border-r border-gray-100">
                Subtotal
              </td>
              <td className="p-4 text-right font-black text-gray-900 text-base">
                ৳{data.subtotal.toLocaleString()}
              </td>
            </tr>
            <tr className="bg-gradient-to-r from-gray-50 to-white text-red-600">
              <td className="p-4 font-black uppercase text-[13px] tracking-widest border-r border-gray-100">
                Referral Discount
              </td>
              <td className="p-4 text-right font-black text-base">
                -৳{(data.subtotal - data.total).toLocaleString()}
              </td>
            </tr>
          </>
        )}
        {/* Total Bill */}
        <tr className="bg-gradient-to-r from-gray-50 to-white">
          <td className="p-4 font-black text-gray-500 uppercase text-[13px] tracking-widest border-r border-gray-100">
            Total Bill
          </td>
          <td className="p-4 text-right font-black text-gray-900 text-base">
            ৳{data.total.toLocaleString()}
          </td>
        </tr>

        {isDue ? (
          <>
            {/* Advance Paid */}
            <tr className="bg-emerald-50/70 hover:bg-emerald-50 transition">
              <td className="p-4  font-black text-emerald-600 uppercase text-[13px] tracking-widest border-r border-emerald-100">
                Advance Paid
              </td>
              <td className="p-4 text-right font-black text-emerald-700">
                ৳{(data.total - data.dueAmount).toLocaleString()}
              </td>
            </tr>

            {/* Due */}
            <tr className="bg-gradient-to-r from-rose-500 to-rose-600 text-white">
              <td className="p-4 text-white font-black uppercase text-[11px] tracking-widest border-r border-white/20">
                Balance Due
              </td>
              <td className="p-4 text-white text-right font-black text-2xl tracking-tight">
                ৳{data.dueAmount.toLocaleString()}
              </td>
            </tr>
          </>
        ) : (
          /* Fully Paid */
          <tr className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <td className="p-4 text-white font-black uppercase text-[11px] tracking-widest border-r border-white/20">
              Full Amount Paid
            </td>
            <td className="p-4 text-white text-right font-black text-2xl tracking-tight">
              ৳{data.total.toLocaleString()}
            </td>
          </tr>
        )}

      </tbody>
    </table>
  </div>
</div>

      {/* Disclaimer / Notice */}
      <div className="bg-brand/5 p-6 rounded-lg border border-dashed border-brand/20">
        <p className="text-[14px] text-brand font-black uppercase tracking-widest mb-1">Company Notice</p>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          This is a computer generated invoice and does not require a signature. The warranty is subject to the terms and conditions printed on the official warranty card.
        </p>
      </div>
    </div>
  );
}
