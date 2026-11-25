import { COMPLAINT_STATUS_BN } from "@/constants/complaintData";
import { db } from "@/db/drizzle";
import { staffComplaints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "অভিযোগ যাচাই | SE Electronics",
  robots: { index: false, follow: false },
};

const bnDateTime = (d: Date) =>
  new Date(d).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

/**
 * PUBLIC page the QR code on a complaint (GD) copy opens. It confirms the
 * document is genuine and shows the complaint's current status. No session is
 * required, so it exposes the status and the assigned officer's office contact
 * only: nothing about the complainant or the accused (no names, phone numbers,
 * addresses, subject or description).
 */
export default async function ComplaintVerifyPage({ params }: { params: Promise<{ complaintId: string }> }) {
  const { complaintId: raw } = await params;
  const complaintId = raw.trim().toUpperCase();

  // Complaint ids are "SE" + 8 random characters; anything else cannot match.
  const row = /^[A-Z0-9]{4,32}$/.test(complaintId)
    ? await db.query.staffComplaints.findFirst({
        where: eq(staffComplaints.complaintId, complaintId),
        columns: {
          complaintId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          hearingOfficerName: true,
          hearingOfficerDesignation: true,
          hearingOfficerPhone: true,
        },
      })
    : undefined;

  return (
    <main className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4 text-[#16213a]">
      <div className="w-full max-w-md rounded-xl bg-white border border-[#dfe6f2] shadow-[0_8px_28px_rgba(11,61,145,0.12)] overflow-hidden">
        <div className="bg-[#0b3d91] text-white text-center px-4 py-4">
          <p className="text-[20px] font-extrabold leading-tight">এস ই ইলেকট্রনিক্স</p>
          <p className="text-[12.5px] font-semibold text-white/80">অভিযোগ নথি যাচাই (Complaint Verification)</p>
        </div>

        {row ? (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-[#e9f9ef] border border-[#bfe8cd] px-3 py-2.5 text-[#178a42]">
              <BadgeCheck size={26} className="shrink-0" />
              <span className="text-[13.5px] font-extrabold leading-snug">
                নথিটি সঠিক — এই অভিযোগটি এস ই ইলেকট্রনিক্সে নথিভুক্ত আছে।
              </span>
            </div>

            <dl className="rounded-lg border border-[#eef1f6] divide-y divide-[#eef1f6] text-[13.5px]">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="font-bold text-[#5b6784]">অভিযোগ (জিডি) নম্বর</dt>
                <dd className="font-extrabold font-mono tracking-wide">{row.complaintId}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="font-bold text-[#5b6784]">বর্তমান অবস্থা</dt>
                <dd className="font-extrabold text-[#0b3d91] text-right">{COMPLAINT_STATUS_BN[row.status] || row.status}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="font-bold text-[#5b6784]">দাখিলের তারিখ</dt>
                <dd className="font-bold text-right">{bnDateTime(row.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="font-bold text-[#5b6784]">সর্বশেষ হালনাগাদ</dt>
                <dd className="font-bold text-right">{bnDateTime(row.updatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="font-bold text-[#5b6784]">দায়িত্বপ্রাপ্ত কর্মকর্তা</dt>
                <dd className="font-bold text-right">{row.hearingOfficerName || "এখনও নিযুক্ত হয়নি"}</dd>
              </div>
              {(row.hearingOfficerDesignation || row.hearingOfficerPhone) && (
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <dt className="font-bold text-[#5b6784]">পদবি / মোবাইল</dt>
                  <dd className="font-bold text-right">
                    {row.hearingOfficerDesignation}
                    {row.hearingOfficerDesignation && row.hearingOfficerPhone ? <br /> : null}
                    {row.hearingOfficerPhone && (
                      <a href={`tel:${row.hearingOfficerPhone}`} className="font-mono text-[#0b3d91]">{row.hearingOfficerPhone}</a>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            <p className="text-[11.5px] text-[#5b6784] leading-relaxed">
              গোপনীয়তার স্বার্থে এখানে অভিযোগকারী বা অভিযুক্তের কোনো ব্যক্তিগত তথ্য দেখানো হয় না। বিস্তারিত দেখতে গ্রাহক অ্যাপে লগইন করুন।
            </p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-[#ffe9ec] border border-[#f7c3ca] px-3 py-2.5 text-[#c81f38]">
              <ShieldAlert size={26} className="shrink-0" />
              <span className="text-[13.5px] font-extrabold leading-snug">
                এই নম্বরে কোনো অভিযোগ নথিভুক্ত পাওয়া যায়নি।
              </span>
            </div>
            <p className="text-[12.5px] text-[#5b6784] leading-relaxed">
              নম্বরটি সঠিক আছে কি না যাচাই করুন, অথবা আমাদের হটলাইনে যোগাযোগ করুন।
            </p>
          </div>
        )}

        <div className="border-t border-[#eef1f6] px-4 py-3 text-center text-[12.5px] font-bold text-[#5b6784]">
          হটলাইন: ০৯৬৪৯৩৫৫৫৫৫
        </div>
      </div>
    </main>
  );
}
