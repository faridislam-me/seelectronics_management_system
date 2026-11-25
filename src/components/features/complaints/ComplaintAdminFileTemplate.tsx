/* eslint-disable @next/next/no-img-element */
import { ComplaintGdCopyTemplateData } from "@/app/pdf/download/actions/pdfTypes";
import type { ReactNode } from "react";

type ComplaintAdminFileTemplateProps = {
  data: ComplaintGdCopyTemplateData;
};

const INK = "#0b2a5b";

function Section({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <div className="border" style={{ borderColor: INK }}>
      <div className="px-2 py-[3px] text-[12.5px] font-bold text-white" style={{ background: INK }}>
        {no}। {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono, wide }: { label: string; value?: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={`flex border-t border-[#b9c4d8] first:border-t-0 ${wide ? "col-span-2" : ""}`}>
      <span className="w-[34mm] shrink-0 bg-[#f1f4fa] border-r border-[#b9c4d8] px-2 py-[3px] font-bold text-[12px]">
        {label}
      </span>
      <span className={`flex-1 px-2 py-[3px] text-[12.5px] break-words ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

/**
 * Admin complaint file (office copy), laid out like a General Diary (GD) copy: bordered A4 sheet,
 * company header, a prominent complaint number + filing date-time, numbered
 * sections, signature/seal block and a QR code that opens the public
 * verification page. Rendered both by the PDF generator and by the on-screen
 * view/print page, so it must stay a plain (hook-free) component.
 */
export default function ComplaintAdminFileTemplate({ data }: ComplaintAdminFileTemplateProps) {
  // Long descriptions shrink a little so the copy stays on a single A4 page.
  const len = data.description.length;
  const descSize = len > 1500 ? "10.5px" : len > 900 ? "11.5px" : "13px";

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white p-[9mm] text-[#111] overflow-hidden box-border"
      style={{ fontFamily: "'SolaimanLipi', 'Tiro Bangla', sans-serif", lineHeight: 1.4, fontSize: "13px" }}
    >
      {/* Double frame */}
      <div className="h-full p-[1.2mm] box-border border-[2.5px]" style={{ borderColor: INK }}>
        <div className="relative h-full border box-border px-[6mm] py-[5mm] flex flex-col gap-[2.6mm] overflow-hidden" style={{ borderColor: INK }}>
          {/* Watermark */}
          {data.logo && (
            <img src={data.logo} alt="" className="absolute left-1/2 top-1/2 w-[95mm] -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none" />
          )}

          {/* Header */}
          <div className="relative flex items-center gap-3 border-b-[2.5px] pb-[2.5mm]" style={{ borderColor: INK }}>
            <div className="w-[25mm] shrink-0 flex justify-center">
              {data.logo && <img src={data.logo} alt="SE Electronics" className="w-[22mm] h-[22mm] object-contain" />}
            </div>
            <div className="flex-1 text-center leading-tight">
              <p className="text-[25px] font-black" style={{ color: INK }}>এস ই ইলেকট্রনিক্স</p>
              <p className="text-[13.5px] font-bold">প্রশাসনিক শাখা — অভিযোগ গ্রহণ ও নিষ্পত্তি সেল</p>
              <p className="text-[11.5px]">প্রধান কার্যালয়: বাদাম বাগিচা ২ নং রোড, এয়ারপোর্ট রোড, সিলেট সদর ৩১০০</p>
              <p className="text-[11.5px]">হটলাইন: ০৯৬৪৯৩৫৫৫৫৫ · ০১৩২২২৪৭৭৭৪</p>
            </div>
            <div className="w-[25mm] shrink-0 flex flex-col items-center">
              {data.qrcode && <img src={data.qrcode} alt="Verification QR" className="w-[23mm] h-[23mm]" />}
              <span className="text-[8.5px] font-bold mt-[1px]">স্ক্যান করে যাচাই করুন</span>
            </div>
          </div>

          {/* Title */}
          <div className="relative text-center">
            <span className="inline-block px-6 py-[3px] text-[16px] font-black text-white rounded-sm" style={{ background: INK }}>
              অ্যাডমিন অভিযোগ ফাইল — সাধারণ ডায়েরি (জিডি) কপি
            </span>
            <p className="text-[10.5px] mt-[2px] text-[#444]">অফিস কপি · অনলাইনে দাখিলকৃত অভিযোগের নথিভুক্ত অনুলিপি</p>
          </div>

          {/* Number / date strip */}
          <div className="relative grid grid-cols-3 border-[1.5px] text-center" style={{ borderColor: INK }}>
            <div className="px-2 py-[4px] border-r" style={{ borderColor: INK }}>
              <p className="text-[10.5px] font-bold text-[#444]">অভিযোগ (জিডি) নম্বর</p>
              <p className="text-[18px] font-black font-mono tracking-wider" style={{ color: INK }}>{data.complaintId}</p>
            </div>
            <div className="px-2 py-[4px] border-r" style={{ borderColor: INK }}>
              <p className="text-[10.5px] font-bold text-[#444]">দাখিলের তারিখ ও সময়</p>
              <p className="text-[14px] font-bold mt-[3px]">{data.filedAtBn}</p>
            </div>
            <div className="px-2 py-[4px]">
              <p className="text-[10.5px] font-bold text-[#444]">বর্তমান অবস্থা</p>
              <p className="text-[13.5px] font-black mt-[3px]">{data.statusBn}</p>
            </div>
          </div>

          {/* Addressee */}
          <div className="relative text-[12.5px] leading-snug">
            <p>বরাবর, <span className="font-bold">মহাপরিচালক / চেয়ারম্যান</span>, এস ই ইলেকট্রনিক্স, বাদাম বাগিচা, সিলেট সদর ৩১০০।</p>
          </div>

          {/* 1. Complainant */}
          <Section no="১" title="অভিযোগকারীর বিবরণ">
            <div className="grid grid-cols-2 [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-r-[#b9c4d8]">
              <Field label="নাম" value={data.customer.name} />
              <Field label="কাস্টমার আইডি" value={data.customer.customerId} mono />
              <Field label="মোবাইল নম্বর" value={data.customer.phone} mono />
              <Field label="ঠিকানা" value={data.customer.address} />
            </div>
          </Section>

          {/* 2. Accused staff + related service / product */}
          <Section no="২" title="যার বিরুদ্ধে অভিযোগ ও সংশ্লিষ্ট পণ্য / সার্ভিস">
            <div className="grid grid-cols-2 [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-r-[#b9c4d8]">
              <Field label="অভিযুক্ত কর্মী" value={[data.staff.name, data.staff.role && `(${data.staff.role})`].filter(Boolean).join(" ")} />
              <Field label="কর্মীর আইডি" value={data.staff.staffId} mono />
              <Field label="সার্ভিস আইডি" value={data.service.serviceId} mono />
              <Field label="সার্ভিসের ধরন" value={data.service.type} />
              <Field label="পণ্য" value={[data.service.product, data.service.model].filter(Boolean).join(" — ")} />
              <Field label="মেমো / ইনভয়েস নং" value={data.service.memoNumber} mono />
            </div>
          </Section>

          {/* 3. Subject + description (takes the remaining height) */}
          <div className="relative flex-1 min-h-0 flex flex-col border" style={{ borderColor: INK }}>
            <div className="px-2 py-[3px] text-[12.5px] font-bold text-white" style={{ background: INK }}>
              ৩। অভিযোগের বিষয় ও বিবরণ
            </div>
            <div className="px-2 py-[3px] border-b border-[#b9c4d8] bg-[#f1f4fa] text-[12.5px]">
              <span className="font-bold">বিষয়ঃ </span>
              <span className="font-bold underline underline-offset-2">{data.subject || "অভিযোগ"}</span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden px-2.5 py-1.5 text-justify whitespace-pre-wrap break-words" style={{ fontSize: descSize }}>
              <p>
                মহোদয়, আমি নিম্নস্বাক্ষরকারী <span className="font-bold">{data.customer.name}</span>{" "}
                {data.customerStandingBn}। উপরোক্ত কর্মীর বিরুদ্ধে আমার অভিযোগের বিবরণ নিম্নরূপঃ
              </p>
              <p className="mt-1">{data.description}</p>
              <p className="mt-1">
                অতএব, বিষয়টি যাচাই-বাছাই করে প্রয়োজনীয় ব্যবস্থা গ্রহণ এবং অভিযোগটি নথিভুক্ত করার জন্য বিনীত অনুরোধ জানাচ্ছি।
              </p>
            </div>
          </div>

          {/* 4. Status + handler */}
          <Section no="৪" title="অভিযোগের অবস্থা ও দায়িত্বপ্রাপ্ত কর্মকর্তা">
            <div className="grid grid-cols-2 [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-r-[#b9c4d8]">
              <Field label="বর্তমান অবস্থা" value={data.statusBn} />
              <Field label="সর্বশেষ হালনাগাদ" value={data.updatedAtBn} />
              <Field label="দায়িত্বপ্রাপ্ত কর্মকর্তা" value={data.officer.name || "এখনও নিযুক্ত হয়নি"} />
              <Field label="পদবি / মোবাইল" value={[data.officer.designation, data.officer.phone].filter(Boolean).join(" · ")} />
            </div>
          </Section>

          {/* Signature + seal block */}
          <div className="relative flex items-end justify-between gap-3 pt-[1mm]">
            <div className="w-[55mm] text-center">
              <div className="h-[17mm] flex items-end justify-center">
                <span className="text-[13px] font-bold">{data.customer.name}</span>
              </div>
              <div className="border-t border-black pt-[2px] text-[11.5px] font-bold">অভিযোগকারীর নাম / স্বাক্ষর</div>
            </div>

            <div className="w-[30mm] flex flex-col items-center">
              {data.documentSeal && <img src={data.documentSeal} alt="সিল" className="w-[25mm] h-[25mm] object-contain opacity-90" />}
              <span className="text-[9px] font-bold">অফিস সিল</span>
            </div>

            <div className="w-[55mm] text-center">
              <div className="h-[20mm] flex items-end justify-center">
                {/* Name seal prints at 1.5in wide (the image is 2:1). */}
                {data.officerSign && <img src={data.officerSign} alt="গ্রহণকারী কর্মকর্তা" className="w-[1.5in] h-[0.75in] max-w-none object-contain" />}
              </div>
              <div className="border-t border-black pt-[2px] text-[11.5px] font-bold">গ্রহণকারী কর্মকর্তার স্বাক্ষর</div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative border-t pt-[1.5mm] text-[9.5px] leading-snug text-[#333]" style={{ borderColor: INK }}>
            <p>
              <span className="font-bold">অনলাইন যাচাই:</span> উপরের QR কোড স্ক্যান করুন অথবা ভিজিট করুন —{" "}
              <span className="font-mono">{data.verifyUrl}</span>
            </p>
            <p>
              এটি এস ই ইলেকট্রনিক্সের অভিযোগ ব্যবস্থাপনা সিস্টেম থেকে স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত প্রতিষ্ঠানের নিজস্ব অভিযোগ নথি; এটি
              কোনো থানার সাধারণ ডায়েরি (জিডি) নয়।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
