"use client";

import { contactDetails } from "@/constants";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

interface ResumeClientProps {
  staffData: any;
  qrDataUrl?: string | null;
  backHref?: string;
}

const NAVY = "#0b3d91";
const bn = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "");

/** Section heading bar in brand navy. */
function SectionTitle({ n, bnTitle, enTitle }: { n: number; bnTitle: string; enTitle: string }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1 text-white text-[12px] font-bold" style={{ background: NAVY }}>
      <span>{bn(n)}। {bnTitle}</span>
      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">{enTitle}</span>
    </div>
  );
}

/** One labelled row of a bordered form table. Empty values leave a write-in line. */
function Row({ label, en, value, i }: { label: string; en?: string; value?: React.ReactNode; i: number }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <tr className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
      <td className="border border-[#c9d4e6] px-2 py-[3px] w-[38%] align-top">
        <span className="font-semibold text-[#16213a]">{label}</span>
        {en && <span className="block text-[8.5px] text-[#5b6784] leading-none">{en}</span>}
      </td>
      <td className="border border-[#c9d4e6] px-2 py-[3px] align-top font-medium text-[#0f172a]">
        {empty ? <span className="block h-4 border-b border-dotted border-[#8a95ab]" /> : value}
      </td>
    </tr>
  );
}

function Check({ checked = false, label }: { checked?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 mr-3">
      <span className="size-3.5 border border-[#16213a] flex items-center justify-center text-[10px] font-bold leading-none">{checked ? "✓" : ""}</span>
      <span>{label}</span>
    </span>
  );
}

export default function ResumeClient({ staffData, qrDataUrl, backHref = "/staff/details" }: ResumeClientProps) {
  const isElectrician = staffData.role === "electrician";
  const roleBn = isElectrician ? "ইলেকট্রিশিয়ান" : "টেকনিশিয়ান";
  const roleEn = isElectrician ? "ELECTRICIAN" : "TECHNICIAN";
  const nidFront = staffData.nidFrontUrl || staffData.nidFrontPhotoUrl || null;
  const nidBack = staffData.nidBackUrl || staffData.nidBackPhotoUrl || null;
  const bank = staffData.bankInfo || null;
  const pay = String(staffData.paymentPreference || "");
  const printedOn = new Date().toLocaleDateString("en-GB");

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 print:bg-white print:py-0 font-sans text-black overflow-x-auto">
      <div className="w-[21cm] shrink-0 mx-auto bg-white shadow-xl print:shadow-none">
        {/* Controls - hidden when printing */}
        <div className="px-6 py-3 flex flex-wrap gap-2 items-center justify-between print:hidden border-b border-gray-200">
          <Link href={backHref} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-md shadow-sm text-sm font-medium" style={{ background: NAVY }}>
            <Printer className="w-4 h-4" />
            Download / Print Form
          </button>
        </div>

        <div id="staff-resume" className="relative text-[11.5px] leading-snug text-[#16213a]">
          {/* Header band */}
          <div className="flex items-stretch" style={{ background: `linear-gradient(100deg, ${NAVY} 0%, #1259c9 100%)` }}>
            <div className="flex items-center gap-3 px-5 py-3 flex-1 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="SE Electronics" className="size-16 rounded-full bg-white object-cover shrink-0 border-2 border-white" />
              <div className="min-w-0">
                <div className="text-[22px] font-extrabold tracking-wide leading-none">SE ELECTRONICS</div>
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-90 mt-1">Sales and Service Center</div>
                <div className="text-[10px] opacity-90 mt-1 leading-tight">
                  হেড অফিস : {contactDetails.headOffice.trim()} · হেল্পলাইন : {contactDetails.customerCare}
                  <br />
                  Email : {contactDetails.email} · Web : {contactDetails.website}
                </div>
              </div>
            </div>
            <div className="w-[118px] shrink-0 bg-white/10 flex flex-col items-center justify-center gap-1 py-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" className="size-[84px] bg-white p-0.5 rounded-[3px]" />
              ) : null}
              <span className="text-[8.5px] font-bold tracking-widest text-white">SCAN PROFILE</span>
            </div>
          </div>

          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-2 border-b-2" style={{ borderColor: NAVY }}>
            <div>
              <div className="text-[17px] font-extrabold" style={{ color: NAVY }}>এস ই ইলেকট্রনিক্স এর জনবল নিয়োগ ফর্ম</div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-[#3d4a63]">{roleEn} PROFILE / {roleBn} প্রোফাইল</div>
            </div>
            <div className="text-right text-[10.5px] leading-tight">
              <div>স্থাপিত : ২০০৯ ইং</div>
              <div className="text-[#5b6784]">Email : sebofficial@gmail.com</div>
              <div className="text-[#5b6784]">Phone : 09638086438, 01812544466</div>
            </div>
          </div>

          <div className="px-5 pt-2 pb-1 flex flex-col gap-2">
            {/* Form meta + photo */}
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <Row i={0} label="ফর্ম নাম্বার" en="Form No." value={<span className="font-mono">SE - 3300488</span>} />
                    <Row i={1} label="স্টাফ আইডি" en="Staff ID" value={<span className="font-mono font-bold">{staffData.staffId}</span>} />
                    <Row i={2} label="নিবন্ধনের তারিখ" en="Registration Date" value={fmtDate(staffData.createdAt)} />
                    <Row
                      i={3}
                      label="অবস্থা"
                      en="Status"
                      value={
                        <span className="inline-flex items-center gap-2">
                          <span className={`px-2 py-[1px] rounded-[3px] text-[10px] font-bold text-white ${staffData.isActiveStaff === false ? "bg-[#c81f38]" : "bg-[#178a42]"}`}>{staffData.isActiveStaff === false ? "BLOCKED" : "ACTIVE"}</span>
                          {staffData.isVerified ? <span className="px-2 py-[1px] rounded-[3px] text-[10px] font-bold text-white" style={{ background: NAVY }}>VERIFIED</span> : null}
                        </span>
                      }
                    />
                  </tbody>
                </table>
              </div>
              <div className="w-[112px] shrink-0 flex flex-col items-center gap-1">
                <div className="w-[104px] h-[124px] border-2 overflow-hidden bg-[#f4f7fc] flex items-center justify-center" style={{ borderColor: NAVY }}>
                  {staffData.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={staffData.photoUrl} alt="Profile" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="text-center text-[11px] font-bold text-[#5b6784]">
                      <p>ছবি</p>
                      <p>যোগ করুন</p>
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-semibold text-[#5b6784]">পাসপোর্ট সাইজ ছবি</span>
              </div>
            </div>

            {/* 1. Personal */}
            <div className="border border-[#c9d4e6] break-inside-avoid">
              <SectionTitle n={1} bnTitle="ব্যক্তিগত তথ্য" enTitle="Personal Information" />
              <table className="w-full border-collapse">
                <tbody>
                  <Row i={0} label="ইংরেজী বড় অক্ষরে নাম" en="Full Name" value={<span className="font-bold uppercase">{staffData.name}</span>} />
                  <Row i={1} label="পিতার নাম" en="Father's Name" value={staffData.fatherName} />
                  <Row i={2} label="মোবাইল নাম্বার" en="Mobile" value={staffData.phone} />
                  <Row i={3} label="জাতীয়তা" en="Nationality" value="বাংলাদেশী" />
                  <Row i={4} label="লিঙ্গ" en="Gender" value={<><Check label="পুরুষ" /><Check label="মহিলা" /></>} />
                  <Row i={5} label="জন্ম তারিখ" en="Date of Birth" />
                  <Row i={6} label="শিক্ষাগত যোগ্যতা ও পাসের সাল" en="Education / Passing Year" />
                  <Row i={7} label="পরিচয়ের ডকুমেন্ট" en="ID Document" value={<><Check label="জাতীয় পরিচয় পত্র" checked={!!(staffData.nidFrontPhotoKey || nidFront)} /><Check label="জন্ম নিবন্ধন পত্র" /><Check label="শিক্ষা সনদ" /></>} />
                  <Row i={8} label="টিকমার্ক দেওয়া ডকুমেন্টের নাম্বার" en="Document No." />
                  <Row i={9} label="রক্তের গ্রুপ" en="Blood Group" />
                </tbody>
              </table>
            </div>

            {/* 2. Address */}
            <div className="border border-[#c9d4e6] break-inside-avoid">
              <SectionTitle n={2} bnTitle="ঠিকানা" enTitle="Address" />
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#e8f1ff]">
                    <th className="border border-[#c9d4e6] px-2 py-1 w-[22%] text-left font-semibold"> </th>
                    <th className="border border-[#c9d4e6] px-2 py-1 text-left font-bold" style={{ color: NAVY }}>বর্তমান ঠিকানা <span className="text-[9.5px] font-semibold text-[#5b6784]">Present</span></th>
                    <th className="border border-[#c9d4e6] px-2 py-1 text-left font-bold" style={{ color: NAVY }}>স্থায়ী ঠিকানা <span className="text-[9.5px] font-semibold text-[#5b6784]">Permanent</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["গ্রাম/বাসা", "Village / House", staffData.currentStreetAddress, staffData.permanentStreetAddress],
                    ["ডাকঘর", "Post Office", staffData.currentPostOffice, staffData.permanentPostOffice],
                    ["থানা", "Police Station", staffData.currentPoliceStation, staffData.permanentPoliceStation],
                    ["জেলা", "District", staffData.currentDistrict, staffData.permanentDistrict],
                  ].map(([bnL, enL, cur, per], i) => (
                    <tr key={bnL as string} className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
                      <td className="border border-[#c9d4e6] px-2 py-[3px]"><span className="font-semibold">{bnL}</span><span className="block text-[8.5px] text-[#5b6784] leading-none">{enL}</span></td>
                      <td className="border border-[#c9d4e6] px-2 py-[3px] font-medium">{cur || <span className="block h-4 border-b border-dotted border-[#8a95ab]" />}</td>
                      <td className="border border-[#c9d4e6] px-2 py-[3px] font-medium">{per || <span className="block h-4 border-b border-dotted border-[#8a95ab]" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Professional + 4. Payment side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#c9d4e6] break-inside-avoid">
                <SectionTitle n={3} bnTitle="পেশাগত তথ্য" enTitle="Professional" />
                <table className="w-full border-collapse">
                  <tbody>
                    <Row i={0} label="এস ই বিডি এর পদবী" en="Designation" value={<span className="font-bold uppercase">{staffData.role}</span>} />
                    <Row i={1} label="মেরামতের অভিজ্ঞতা" en="Repair Experience" value={staffData.hasRepairExperience ? `${staffData.repairExperienceYears ?? 0} বছর` : "না"} />
                    <Row i={2} label="ইনস্টলেশনের অভিজ্ঞতা" en="Installation Experience" value={staffData.hasInstallationExperience ? `${staffData.installationExperienceYears ?? 0} বছর` : "না"} />
                    <Row i={3} label="দক্ষতা" en="Skills" value={Array.isArray(staffData.skills) ? staffData.skills.join(", ") : staffData.skills} />
                    <Row i={4} label="কর্মস্থান জেলা / থানা" en="Work District / Thana" />
                  </tbody>
                </table>
              </div>
              <div className="border border-[#c9d4e6] break-inside-avoid">
                <SectionTitle n={4} bnTitle="পেমেন্ট মাধ্যম" enTitle="Payment Preference" />
                <table className="w-full border-collapse">
                  <tbody>
                    <Row i={0} label="মাধ্যম" en="Method" value={pay ? <span className="font-bold uppercase">{pay}</span> : ""} />
                    {pay === "bank" ? (
                      <>
                        <Row i={1} label="ব্যাংক" en="Bank" value={bank?.bankName} />
                        <Row i={2} label="একাউন্ট নাম্বার" en="Account No." value={bank?.accountNumber} />
                        <Row i={3} label="শাখা" en="Branch" value={bank?.branchName || bank?.branch} />
                      </>
                    ) : (
                      <Row i={1} label="ওয়ালেট নাম্বার" en="Wallet No." value={staffData.walletNumber} />
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Emergency / declarations */}
            <div className="border border-[#c9d4e6] break-inside-avoid">
              <SectionTitle n={5} bnTitle="জরুরি যোগাযোগ ও অন্যান্য" enTitle="Emergency & Other" />
              <table className="w-full border-collapse">
                <tbody>
                  <Row i={0} label="দুর্ঘটনা/জরুরি প্রয়োজনে যোগাযোগ" en="Emergency Contact (Name · Relation · Phone)" />
                  <Row i={1} label="আপনার নামে কোন থানায় বা আদালতে কোন মামলা আছে কি?" en="Any police/court case?" value={<><Check label="হ্যাঁ" /><Check label="না" /></>} />
                </tbody>
              </table>
            </div>

            {/* 6. Declaration + signatures */}
            <div className="border border-[#c9d4e6] break-inside-avoid">
              <SectionTitle n={6} bnTitle="অঙ্গীকারনামা" enTitle="Declaration" />
              <div className="px-3 py-2">
                <p className="text-justify font-medium text-[10.5px] leading-[1.5]">
                  আমি এই মর্মে ঘোষণা করিতেছি যে, আমি SE ELECTRONICS কোম্পানির সকল নির্দেশনা মানিয়া চলিব এবং আমার উপরোক্ত তথ্যবলি নির্ভুল ও সত্য। আমি জ্ঞানতঃ কোনো তথ্য গোপন করি নাই ৷ যদি আমি ভবিষ্যতে আমার বিরুদ্ধে ভুল তথ্য দাখিল কিংবা প্রধান সম্পর্কিত কোনো ধরনের অভিযোগ পাওয়া যায়, তাহলে এস ই বিডি কতৃকপক্ষ আমার বিরুদ্ধে যথাযথ ব্যবস্হা গ্রহন করিতে পারিবে এবং এতে আমার কোনো অপত্তি থাকবেনা। আমি কোনো অপত্তি করিলে সর্বস্হর আদালতে তাহ্য অগ্যাহ্য বলিয়া গণ্য হইবে। আমার বর্তমান ঠিকানা পরিবর্তন হলে পরিবর্তীত নতুন ঠিকানা পরবর্তী ০৩ দিনের মধ্যে লিখিতভাবে এস ই বিডির প্রশাসনিক বিভাগে জানাতে বাধ্য থাকবো৷
                </p>
                <div className="mt-2 text-[11px]">তারিখ : <span className="inline-block w-[140px] border-b border-dotted border-[#16213a]" /></div>
                <div className="mt-5 grid grid-cols-4 gap-3 items-end text-center text-[10px] font-semibold">
                  <div><div className="border-t border-[#16213a] pt-1">সিলমোহর যুক্ত<br />এস ই বিডি চেয়ারম্যানের স্বাক্ষর</div></div>
                  <div><div className="border-t border-[#16213a] pt-1">সিলমোহর যুক্ত<br />অফিস সহকারির স্বাক্ষর</div></div>
                  <div>
                    <div className="h-[44px] flex items-end justify-center mb-0.5">
                      {staffData.signatureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={staffData.signatureUrl} alt="Signature" className="max-h-[44px] max-w-full object-contain" />
                      ) : null}
                    </div>
                    <div className="border-t border-[#16213a] pt-1">প্রার্থীর স্বাক্ষর<br />Staff Signature</div>
                  </div>
                  <div><div className="border border-[#16213a] h-[44px] mb-1" /><div className="border-t border-[#16213a] pt-1">টিপসহি</div></div>
                </div>
              </div>
            </div>

            {/* Submission note */}
            <div className="text-[9.5px] border border-dashed border-[#8a95ab] bg-[#fbfcfe] p-2 leading-tight font-medium">
              * জমা দিতে হবে ১) ক) জাতীয় পরিচয় পত্র/জন্ম নিবন্ধন [ফটোকপি] খ) চারিত্রিক সনদ পত্র [ফটোকপি] গ) ০৩ কপি রঙ্গিন পাসপোর্ট ছবি ঘ) শিক্ষাগত সনদ [ফটোকপি] ঙ) দক্ষতা সনদ [প্রযোজ্য ক্ষেত্রে] চ) নমিনির ০১ কপি রঙ্গিন পাসপোর্ট সাইজ ছবি ছ) বর্তমান ঠিকানার এলাকায় কমিশনারের সনদ পত্র।
            </div>
          </div>

          {/* Footer */}
          <div className="mt-1 px-5 py-1.5 flex items-center justify-between text-[9.5px] text-white" style={{ background: NAVY }}>
            <span className="font-bold tracking-wide">SE ELECTRONICS · Sales and Service Center</span>
            <span>Staff ID: {staffData.staffId} · Printed: {printedOn}</span>
          </div>

          {/* 7. NID images on a new page */}
          {(nidFront || nidBack) && (
            <div className="px-5 pt-3 pb-4" style={{ breakInside: "avoid" }}>
              <div className="border border-[#c9d4e6] break-inside-avoid">
                <SectionTitle n={7} bnTitle="জাতীয় পরিচয় পত্র (সামনে ও পেছনে)" enTitle="NID Front & Back" />
                <div className="grid grid-cols-2 gap-3 p-3">
                  {[nidFront, nidBack].map((src, i) => (
                    <div key={i} className="border border-[#c9d4e6] p-1.5 bg-white">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={i ? "NID Back" : "NID Front"} className="w-full h-auto object-contain" />
                      ) : (
                        <div className="h-40 flex items-center justify-center text-[#8a95ab]">—</div>
                      )}
                      <div className="text-center text-[10px] font-semibold text-[#5b6784] mt-1">{i ? "পেছনের অংশ" : "সামনের অংশ"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #staff-resume, #staff-resume * { visibility: visible; }
          #staff-resume { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `,
        }}
      />
    </div>
  );
}
