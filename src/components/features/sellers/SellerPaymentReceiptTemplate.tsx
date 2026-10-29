import { formatDate } from "@/utils";

export interface SellerPaymentReceiptData {
  bgImage: string;
  requestId: string;
  date: Date;
  amount: number;
  paymentMethod: "cash" | "bkash" | "nagad" | "rocket" | "bank";
  senderNumber: string | null;
  transactionId: string | null;
  note: string | null;
  targetType: "purchase" | "service_charge";
  targetLabel: string;
  seller: {
    sellerId: string;
    shopName: string;
    ownerName: string;
    phone: string;
  };
}

const Cell = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <tr>
    <td className="border border-gray-400 px-4 py-2.5 font-bold w-1/3 bg-transparent uppercase text-xs">
      {label} :
    </td>
    <td className={`border border-gray-400 px-4 py-2.5 ${strong ? "font-black text-blue-900" : "font-semibold text-gray-800"}`}>
      {value}
    </td>
  </tr>
);

export default function SellerPaymentReceiptTemplate({ data }: { data: SellerPaymentReceiptData }) {
  const wallet = data.paymentMethod !== "cash" && data.paymentMethod !== "bank";
  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white p-[20mm]"
      style={{
        backgroundImage: `url(${data.bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: `'SolaimanLipi', sans-serif`,
      }}
    >
      <div className="text-center pt-10 mb-6">
        <h1 className="text-2xl font-black tracking-widest uppercase text-gray-800">Seller Payment Receipt</h1>
        <p className="text-sm font-bold text-gray-500 mt-1">সেলার বকেয়া পরিশোধ রশিদ</p>
      </div>

      <div className="flex justify-between text-gray-800 font-bold mb-6 px-6">
        <span>Receipt No: {data.requestId}</span>
        <span>Date: {formatDate(data.date)}</span>
      </div>

      <div className="space-y-8 px-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 pb-1">Seller Information</h2>
          <table className="w-full border-collapse">
            <tbody>
              <Cell label="Shop Name" value={<span className="uppercase tracking-wide">{data.seller.shopName}</span>} />
              <Cell label="Owner" value={data.seller.ownerName} />
              <Cell label="Seller ID" value={data.seller.sellerId} />
              <Cell label="Phone" value={data.seller.phone} />
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 pb-1">Payment Information</h2>
          <table className="w-full border-collapse">
            <tbody>
              <Cell label="Paid For" value={`${data.targetType === "purchase" ? "মালের বাকি টাকা" : "সার্ভিস চার্জ"} — ${data.targetLabel}`} />
              <Cell label="Method" value={<span className="uppercase">{data.paymentMethod}</span>} />
              {wallet && <Cell label="Sender Number" value={data.senderNumber || "N/A"} />}
              {wallet && <Cell label="Transaction ID" value={data.transactionId || "N/A"} />}
              {data.note && <Cell label="Note" value={data.note} />}
              <tr className="bg-gray-100">
                <td className="border border-gray-400 px-4 py-3 font-bold uppercase text-sm">Amount Received :</td>
                <td className="border border-gray-400 px-4 py-3 font-black text-xl text-blue-900">
                  {Math.round(data.amount).toLocaleString()} TK
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-600 italic pt-2">
          এই রশিদটি কম্পিউটার জেনারেটেড। যেকোনো তথ্যের জন্য যোগাযোগ: 09649355555, 09639673600
        </p>
      </div>
    </div>
  );
}
