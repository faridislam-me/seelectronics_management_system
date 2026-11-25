import { CompletionNoticeTemplateData } from "@/app/pdf/download/actions/pdfTypes";

type ExParteNoticeTemplateProps = {
  data: CompletionNoticeTemplateData;
};

/**
 * Ex-parte (একতরফা) resolution notice — issued when the customer was called to
 * the hearing but did not attend, so the complaint is closed one-sidedly and
 * recorded. Mirrors the CompletionNotice letterhead but carries ex-parte wording
 * (no guilt finding, since the hearing was one-sided).
 */
export default function ExParteNoticeTemplate({ data }: ExParteNoticeTemplateProps) {
  const today = new Date().toLocaleDateString("bn-BD");

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white pt-[1in] pr-[0.75in] pb-[0.5in] pl-[1.5in] text-[#111] overflow-hidden box-border flex flex-col"
      style={{
        fontFamily: "'SolaimanLipi', sans-serif",
        lineHeight: "1.45",
        fontSize: "14px",
      }}
    >
      {/* Title */}
      <div className="mb-3">
        <h1 className="text-xl font-black underline underline-offset-4">
          একতরফা নিষ্পত্তি পত্র (Ex-Parte Resolution Notice)
        </h1>
      </div>

      {/* Date */}
      <div className="mb-3 font-bold">
        <p>তারিখঃ {data.resolvedDateBn || today} ইং</p>
      </div>

      {/* Recipient */}
      <div className="mb-3 text-left">
        <p>
          প্রিয় সম্মানীত গ্রাহক{" "}
          <span className="font-bold">{data.customer.name}</span>, <br />
          ঠিকানাঃ {data.customer.address} <br />
          মোবাইল নম্বর: <span className="font-bold">{data.customer.phone}</span>
        </p>
        <p className="mt-2 font-bold underline underline-offset-2">
          বিষয়ঃ আপনার দাখিলকৃত অভিযোগ আইডিঃ {data.complaintId} একতরফাভাবে
          নিষ্পত্তি ও নথিভুক্তকরণ প্রসঙ্গে।
        </p>
      </div>

      {/* Salutation */}
      <div className="mb-2">
        <p>সম্মানিত গ্রাহক,</p>
      </div>

      {/* Body — ex-parte */}
      <div className="text-justify mb-3">
        <p>
          শুভেচ্ছা নিবেন। আপনার দাখিলকৃত অভিযোগটি (আইডিঃ{" "}
          <span className="font-bold">{data.complaintId}</span>) যথাযথ প্রক্রিয়ায়
          শুনানির জন্য গ্রহণ করা হয় এবং এ বিষয়ে আপনাকে শুনানিতে উপস্থিত থাকার
          জন্য যথাসময়ে অবহিত করা হয়েছিল। কিন্তু নির্ধারিত শুনানিতে আপনি উপস্থিত
          ছিলেন না।
        </p>
      </div>

      <div className="text-justify mb-3">
        <p>
          যেহেতু বারবার অবহিত করা সত্ত্বেও আপনি শুনানিতে উপস্থিত হননি, সেহেতু
          প্রতিষ্ঠানের নিয়ম অনুযায়ী আপনার অনুপস্থিতিতে বিষয়টি{" "}
          <span className="font-bold underline underline-offset-2">
            একতরফাভাবে (Ex-Parte)
          </span>{" "}
          নিষ্পত্তি করা হলো এবং আপনার অভিযোগের বিপরীতে সংশ্লিষ্ট কর্মীর বিরুদ্ধে
          এই পর্যায়ে কোনো চূড়ান্ত ব্যবস্থা গ্রহণ ছাড়াই বিষয়টি সমাপ্ত ও
          নথিভুক্ত করা হলো।
        </p>
      </div>

      {/* Complaint snapshot */}
      <div className="mb-3">
        <p className="font-bold underline mb-1.5">অভিযোগের সারসংক্ষেপ</p>
        <div className="space-y-1.5">
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap w-40">বিষয়ঃ</span>
            <p className="text-justify">{data.subject || "—"}</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap w-40">অভিযুক্ত কর্মীঃ</span>
            <p className="text-justify">
              {data.staff.name}
              {data.staff.staffId ? (
                <span className="font-mono text-xs"> (ID: {data.staff.staffId})</span>
              ) : null}
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap w-40">অবস্থাঃ</span>
            <p className="text-justify font-bold">
              গ্রাহক উপস্থিত ছিলেন না — একতরফা নিষ্পত্তি ও নথিভুক্ত
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="text-justify mb-3 text-sm">
        <p>
          উল্লেখ্য, এই নিষ্পত্তি সম্পূর্ণরূপে আপনার অনুপস্থিতির ভিত্তিতে গৃহীত।
          পরবর্তীতে এ বিষয়ে আপনার কোনো বক্তব্য বা পুনরায় শুনানির প্রয়োজন হলে
          নির্ধারিত সময়ের মধ্যে আমাদের হটলাইনে যোগাযোগ করার অনুরোধ রইল।
        </p>
      </div>

      {/* Signature Block — two signatories: the investigating officer (left) and
          the resolution officer / chairman (right).
          Each signature image already carries its signatory's printed name and
          designation, so only a short role caption sits under the line. */}
      {/* Round office seal: centred in the free space above the signature row,
          so the two wide name seals never squeeze it. */}
      {data.documentSeal && (
        <div className="flex justify-center mt-auto pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.documentSeal} alt="সিল" className="w-[34mm] h-[34mm] object-contain opacity-90" />
        </div>
      )}

      <div className={`flex justify-between items-end pt-4 ${data.documentSeal ? "" : "mt-auto"}`}>
        {/* LEFT — investigating officer (whoever the complaint is assigned to) */}
        <div className="text-center w-64">
          <div className="h-[22mm] flex items-end justify-center">
            {data.officerSign && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.officerSign} alt="তদন্ত কর্মকর্তা" className="max-h-[22mm] object-contain" />
            )}
          </div>
          <div className="border-t border-black/70 mt-1 pt-1 text-[12px] font-bold">
            তদন্ত কর্মকর্তা
          </div>
        </div>

        {/* RIGHT — resolution officer / chairman */}
        <div className="text-center w-64">
          <div className="h-[22mm] flex items-end justify-center">
            {data.chairmanSeal && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.chairmanSeal} alt="নিষ্পত্তি কর্মকর্তা" className="max-h-[22mm] object-contain" />
            )}
          </div>
          <div className="border-t border-black/70 mt-1 pt-1 text-[12px] font-bold">
            নিষ্পত্তি কর্মকর্তা
          </div>
        </div>
      </div>

      {/* Contact */}
      <p className="font-bold text-[12px] mt-3">যোগাযোগের নম্বরঃ ০১৩২২২৪৭৭৭৪</p>

      {/* Footer */}
      <div className="text-[9px] mt-2 text-center text-gray-500 uppercase tracking-widest border-t pt-1.5">
        SE Electronics / SE Power IPS - সিলেট বিভাগীয় কার্যালয়
      </div>
    </div>
  );
}
