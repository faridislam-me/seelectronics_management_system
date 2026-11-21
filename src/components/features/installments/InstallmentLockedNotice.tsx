import { contactDetails } from "@/constants";
import { ArrowLeft, Lock, Phone } from "lucide-react";
import Link from "next/link";

/**
 * Locked state for the customer installment pages — shown instead of the page
 * content when an admin has banned the customer's installment profile.
 */
export default function InstallmentLockedNotice({
  backHref,
  planCode,
}: {
  /** Where the back arrow goes; omit to render the notice without a header. */
  backHref?: string;
  planCode?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      {backHref && (
        <div className="flex items-center gap-2.5">
          <Link href={backHref} className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[16px] font-extrabold truncate">কিস্তি প্রোফাইল</span>
            {planCode && <span className="text-[11px] font-bold text-[#5b6784] font-mono">{planCode}</span>}
          </span>
          <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]">লকড</span>
        </div>
      )}

      <div className="rounded-xl bg-white border-2 border-[#f7c3ca] p-5 flex flex-col items-center text-center gap-3 shadow-[0_8px_22px_rgba(200,31,56,0.12)]">
        <span className="size-16 rounded-full bg-[#ffe9ec] text-[#c81f38] flex items-center justify-center">
          <Lock size={30} />
        </span>
        <p className="text-[18px] font-black text-[#c81f38] leading-tight">আপনার কিস্তি প্রোফাইল লক করা হয়েছে</p>
        <p className="text-[13px] font-semibold text-[#5b6784] leading-relaxed">
          এই মুহূর্তে আপনার কিস্তির তথ্য, পেমেন্ট জমা, ডকুমেন্ট ডাউনলোড এবং নতুন কিস্তির আবেদন বন্ধ রয়েছে।
          প্রোফাইল আবার চালু করতে অনুগ্রহ করে আমাদের অফিসে যোগাযোগ করুন।
        </p>
        <a
          href={`tel:${contactDetails.customerCare}`}
          className="w-full h-11 rounded-lg bg-[#c81f38] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(200,31,56,0.28)]"
        >
          <Phone size={17} /> কল করুন — {contactDetails.customerCare}
        </a>
      </div>
    </div>
  );
}
