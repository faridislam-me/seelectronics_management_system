import { InstallmentDocumentsTemplateData, DocImage } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate } from "@/utils";

const tk = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} Tk`;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-[12px] leading-snug py-[3px] border-b border-gray-100">
      <span className="w-[42%] shrink-0 font-semibold text-gray-500">{label}</span>
      <span className="flex-1 font-bold text-gray-900">{value || "—"}</span>
    </div>
  );
}

function ImageCell({ img }: { img: DocImage }) {
  return (
    <div className="flex flex-col">
      <div className="h-[150px] w-full rounded-md border border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
        {img.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.url} alt={img.label} className="w-full h-full object-contain" />
        ) : (
          <span className="text-[11px] font-semibold text-gray-400">জমা দেওয়া হয়নি</span>
        )}
      </div>
      <span className="mt-1 text-center text-[11px] font-bold text-gray-700">{img.label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-2 bg-[#0b3d91] text-white text-[13px] font-extrabold px-3 py-1.5 rounded-md">
      {children}
    </div>
  );
}

export default function InstallmentDocumentsTemplate({
  data,
}: {
  data: InstallmentDocumentsTemplateData;
}) {
  const specLine = [data.productBrand, data.productModel, data.productSpec]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="w-[794px] mx-auto bg-white text-gray-900 px-10 py-8" style={{ fontFamily: "'SolaimanLipi', 'Tiro Bangla', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0b3d91] pb-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {data.logo ? <img src={data.logo} alt="SE Electronics" className="h-14 w-14 object-contain" /> : null}
          <div className="leading-tight">
            <div className="text-[20px] font-extrabold text-[#0b3d91]">SE Electronics</div>
            <div className="text-[12px] font-semibold text-gray-500">কিস্তি গ্রাহক ফাইল (Customer File)</div>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[13px] font-extrabold text-gray-900">{data.planCode}</div>
          <div className="text-[11px] font-semibold text-gray-500">তারিখ: {data.createdAt ? formatDate(data.createdAt as any) : formatDate(new Date() as any)}</div>
          <div className="mt-1 inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e8f1ff] text-[#1b6fd6] border border-[#cfe0fb]">
            {data.status}
          </div>
        </div>
      </div>

      {/* Customer info */}
      <SectionTitle>গ্রাহকের তথ্য (Customer Information)</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6">
        <InfoRow label="নাম" value={data.customerName} />
        <InfoRow label="গ্রাহক আইডি" value={data.customerId} />
        <InfoRow label="মোবাইল" value={data.customerPhone} />
        <InfoRow label="পিতার নাম" value={data.fatherName} />
        <InfoRow label="মাতার নাম" value={data.motherName} />
        <InfoRow label="বর্তমান ঠিকানা" value={data.currentAddress || data.customerAddress} />
        <InfoRow label="স্থায়ী ঠিকানা" value={data.permanentAddress} />
        <InfoRow label="ভাড়া বাসা" value={data.isRenting ? "হ্যাঁ" : "না"} />
        {data.isRenting && <InfoRow label="বাড়িওয়ালা" value={data.landlordName} />}
        {data.isRenting && <InfoRow label="বাড়িওয়ালার ফোন" value={data.landlordPhone} />}
      </div>

      {/* Product & terms (condition) */}
      <SectionTitle>পণ্য ও কিস্তির শর্ত (Product &amp; Terms)</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6">
        <InfoRow label="পণ্য" value={specLine || data.productModel} />
        <InfoRow label="ধরন" value={data.productType} />
        <InfoRow label="সিরিয়াল" value={data.serialNumber} />
        <InfoRow label="নগদ মূল্য" value={tk(data.cashPrice)} />
        <InfoRow label="অতিরিক্ত চার্জ" value={tk(data.extraCharge)} />
        <InfoRow label="মোট (চার্জসহ)" value={tk(data.totalPayable)} />
        <InfoRow label="ডাউন পেমেন্ট" value={tk(data.downPayment)} />
        <InfoRow label="কিস্তিতে ফাইন্যান্স" value={tk(data.financedAmount)} />
        <InfoRow label="মেয়াদ" value={data.months ? `${data.months} মাস` : "—"} />
        <InfoRow label="মাসিক কিস্তি" value={tk(data.monthlyAmount)} />
        <InfoRow label="শুরু" value={data.startDate ? formatDate(data.startDate as any) : "—"} />
        <InfoRow label="শেষ" value={data.endDate ? formatDate(data.endDate as any) : "—"} />
      </div>

      {/* Customer documents */}
      <SectionTitle>গ্রাহকের ছবি ও কাগজপত্র (Customer Documents)</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {data.customerImages.map((img, i) => (
          <ImageCell key={`c-${i}`} img={img} />
        ))}
      </div>

      {/* Guarantor info */}
      <SectionTitle>জামিনদারের তথ্য (Guarantor Information)</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6">
        <InfoRow label="নাম" value={data.guarantorName} />
        <InfoRow label="মোবাইল" value={data.guarantorPhone} />
        <InfoRow label="ঠিকানা" value={data.guarantorAddress} />
      </div>

      {/* Guarantor documents */}
      <SectionTitle>জামিনদারের ছবি ও কাগজপত্র (Guarantor Documents)</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {data.guarantorImages.map((img, i) => (
          <ImageCell key={`g-${i}`} img={img} />
        ))}
      </div>

      <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-[10px] font-semibold text-gray-400">
        <span>SE Electronics — কিস্তি গ্রাহক ফাইল</span>
        <span>তৈরি: {formatDate(new Date() as any)}</span>
      </div>
    </div>
  );
}
