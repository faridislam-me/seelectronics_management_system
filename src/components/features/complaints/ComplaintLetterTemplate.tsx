/* eslint-disable @next/next/no-img-element */
import { ComplaintGdCopyTemplateData } from "@/app/pdf/download/actions/pdfTypes";

type ComplaintLetterTemplateProps = {
  data: ComplaintGdCopyTemplateData;
};

/**
 * Complaint letter laid out like a filed case / GD paper: a plain white A4
 * sheet with a wide binding margin on the left (1.5in), 1in on the top, 0.75in on the
 * right, 0.5in at the bottom, running letter text, and nothing decorative except
 * the verification QR code at the top. Rendered both by the PDF generator and
 * by the on-screen view/print page, so it must stay a plain (hook-free)
 * component.
 */
export default function ComplaintLetterTemplate({ data }: ComplaintLetterTemplateProps) {
  // Long descriptions shrink a little so the letter stays on a single A4 page.
  const len = data.description.length;
  const fontSize = len > 1600 ? "11.5px" : len > 1000 ? "12.5px" : len > 600 ? "13.5px" : "14.5px";
  const role = data.staff.role || "টেকনিশিয়ান";

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white text-black overflow-hidden box-border flex flex-col"
      style={{
        fontFamily: "'SolaimanLipi', 'Tiro Bangla', sans-serif",
        lineHeight: 1.6,
        fontSize,
        padding: "1in 0.75in 0.5in 1.5in",
      }}
    >
      {/* Addressee (left) + verification QR (right) */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-bold">বরাবর,</p>
          <p>মহাপরিচালক / চেয়ারম্যান,</p>
          <p>এস ই ইলেকট্রনিক্স,</p>
          <p>বাদাম বাগিচা সিলেট সদর ৩১০০।</p>
        </div>
        <div className="shrink-0 flex flex-col items-center text-[10px] leading-tight">
          {data.qrcode && <img src={data.qrcode} alt="Verification QR" className="w-[26mm] h-[26mm]" />}
          <span className="mt-[2px]">স্ক্যান করে যাচাই করুন</span>
        </div>
      </div>

      <p>
        <span className="font-bold">অভিযোগ নং ঃ</span> <span className="font-mono font-bold">{data.complaintId}</span>
        <span className="mx-2">|</span>
        <span className="font-bold">তারিখ ঃ</span> {data.filedAtBn}
      </p>
      {data.service.serviceId && (
        <p>
          <span className="font-bold">সার্ভিস আইডি ঃ</span> <span className="font-mono">{data.service.serviceId}</span>
        </p>
      )}

      <p className="font-bold text-justify mt-3">বিষয় ঃ {data.subject || "অভিযোগ"}</p>
      <p className="font-bold mt-5">জনাব,</p>

      <p className="text-justify mb-3">
        আমি অভিযোগকারী <span className="font-bold">{data.customer.name}</span>, কাস্টমার আইডিঃ{" "}
        <span className="font-bold">{data.customer.customerId}</span> {data.customerStandingBn} অত্যন্ত দুঃখের সাথে
        জানাচ্ছি যে, গত {data.incidentDateBn} ইং তারিখে আমার প্রডাক্ট সমস্যা দেখা দিলে আমি আপনাদের কাষ্টমার কেয়ারে
        বিষয়টি জানালে আমার সার্ভিস অনুরোধটি গ্রহন করে আমার বাসায় সার্ভিস প্রদানের সময় আপনাদের কোম্পানীর একজন {role}{" "}
        আমার সাথে অত্যন্ত আপত্তিকর ও অপেশাদার আচরণ করেছে।
      </p>

      <p className="text-justify whitespace-pre-wrap break-words mt-5 mb-3">
        <span className="font-bold">ঘটনার বিস্তারিত বিবরণ: </span>
        {data.description}
      </p>

      <p className="text-justify mb-2">
        একজন গ্রাহক হিসেবে আমি এই ধরনের আচরণ আপনাদের মতো একটি স্বনামধন্য প্রতিষ্ঠানের কাছ থেকে প্রত্যাশা করি নাই। এই
        ঘটনাটি আমার জন্য অত্যন্ত বিব্রতকর ছিল।
      </p>
      <p className="text-justify mb-3">
        এমতবস্থায় {role} {data.staff.name}
        {data.staff.staffId ? ` (আইডিঃ ${data.staff.staffId})` : ""}, সার্ভিস আইডিঃ {data.service.serviceId || "N/A"} এর
        জন্য আপনাদের স্বনামধন্য কোম্পানী এস ই ইলেকট্রনিক্স এর সম্মান ক্ষুন্ন হয়েছে। ও আমি তাহার এই আচরণের জন্য এস ই
        ইলেকট্রনিক্স এর মহাপরিচালক / চেয়ারম্যান, এর কাছে এই বিষয়ে সঠিক যাচাই বাছাই করে বিচারের জন্য জোর আবেদন করছি।
      </p>

      <p className="text-justify">
        <span className="font-bold">অতএব, </span>বিষয়টি গুরুত্বের সাথে বিবেচনা করে উক্ত {role}ের বিরুদ্ধে প্রয়োজনীয়
        ব্যবস্থা গ্রহণ করার জন্য বিনীত অনুরোধ জানাচ্ছি। আশা করি, ভবিষ্যতে আপনাদের সেবার মান বজায় রাখতে আপনারা যথাযথ
        পদক্ষেপ নেবেন।
      </p>

      {/* Signature block */}
      <div className="flex items-end justify-between gap-3 mt-auto pt-4">
        {/* Receiving officer's name seal */}
        <div className="text-center leading-snug">
          {data.officerSign && (
            <img src={data.officerSign} alt="গ্রহণকারী কর্মকর্তার সিল" className="w-[1.5in] h-[0.75in] max-w-none object-contain mx-auto" />
          )}
          <p className="text-[10px]">অনলাইনে যাচাইকৃত</p>
          <p className="font-bold border-t border-black pt-1 text-[12px]">প্রশাসনিক শাখা, এস ই ইলেকট্রনিক্স</p>
        </div>

        {/* Office seal */}
        <div className="shrink-0 pb-1">
          {data.documentSeal && <img src={data.documentSeal} alt="অফিস সিল" className="w-[26mm] h-[26mm] object-contain opacity-90" />}
        </div>

        <div>
          <p className="font-bold">বিনীত নিবেদন</p>
          <div className="mt-10 border-t border-black min-w-[45mm] pt-1 leading-snug">
            <p className="font-bold">{data.customer.name}</p>
            <p className="font-mono">{data.customer.phone}</p>
            {data.customer.address && <p className="max-w-[60mm]">{data.customer.address}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
