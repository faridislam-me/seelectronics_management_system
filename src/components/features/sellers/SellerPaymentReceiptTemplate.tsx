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

// Same letterhead-based layout as the (blue) customer / seller InvoiceTemplate: the
// background PNG already carries the header, seal, notes and signatures, so the
// receipt body is absolutely positioned below the header band and kept short so it
// never collides with the baked-in footer. No title is printed over the letterhead.
const Row = ({ label, value, bangla }: { label: string; value: React.ReactNode; bangla?: boolean }) => (
  <tr className="border border-black">
    <td className="py-2 px-3 text-sm font-semibold border-r border-black align-top w-1/3 whitespace-nowrap">
      {label}
    </td>
    <td
      className="py-2 px-3 text-sm border-black align-top break-words"
      style={bangla ? { fontFamily: "SolaimanLipi, 'Tiro Bangla', sans-serif" } : undefined}
    >
      {value}
    </td>
  </tr>
);

export default function SellerPaymentReceiptTemplate({ data }: { data: SellerPaymentReceiptData }) {
  const wallet = data.paymentMethod !== "cash" && data.paymentMethod !== "bank";
  const headerBg = "bg-[#D7E6F5]";
  const paidForText = `${data.targetType === "purchase" ? "মালের বাকি টাকা" : "সার্ভিস চার্জ"} — ${data.targetLabel}`;

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white bg-center bg-no-repeat bg-cover overflow-hidden"
      style={{
        backgroundImage: `url(${data.bgImage})`,
        fontFamily: `Inter, 'Tiro Bangla', SolaimanLipi, sans-serif`,
      }}
    >
      <div className="absolute top-[200px] left-[40px] right-[40px]">
        <div className="text-right text-xl font-bold tracking-wide mb-4">
          PAYMENT RECEIPT
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <div className="space-y-1">
            <div>
              <span className="font-semibold text-xl">Received From</span>
            </div>
            <div>
              <span className="font-semibold">Shop :</span> {data.seller.shopName}
            </div>
            <div>
              <span className="font-semibold">Owner :</span> {data.seller.ownerName}
            </div>
            <div>
              <span className="font-semibold">Phone :</span> {data.seller.phone}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div>
              <span className="font-semibold">Receipt No #</span> {data.requestId}
            </div>
            <div>
              <span className="font-semibold">Date :</span> {formatDate(data.date)}
            </div>
            <div>
              <span className="font-semibold">Seller ID :</span> {data.seller.sellerId}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className={`border border-black ${headerBg}`}>
              <th className="text-left py-2 px-3 font-bold text-sm whitespace-nowrap border-r border-black w-1/3">
                Payment Details
              </th>
              <th className="text-left py-2 px-3 font-bold text-sm whitespace-nowrap border-black">
                Information
              </th>
            </tr>
          </thead>
          <tbody>
            <Row label="Paid For" value={paidForText} bangla />
            <Row label="Payment Method" value={data.paymentMethod.toUpperCase()} />
            {wallet && <Row label="Sender Number" value={data.senderNumber || "N/A"} />}
            {wallet && <Row label="Transaction ID" value={data.transactionId || "N/A"} />}
            {data.note && <Row label="Note" value={data.note} bangla />}
            <tr className={`border border-black ${headerBg}`}>
              <td className="py-2 px-3 text-sm font-bold border-r border-black whitespace-nowrap">
                Amount Received
              </td>
              <td className="py-2 px-3 text-base font-bold border-black whitespace-nowrap">
                {Math.round(data.amount).toLocaleString()} TK
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
