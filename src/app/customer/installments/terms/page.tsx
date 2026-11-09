import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "কিস্তির শর্তাবলী — SE Electronics" };

export default function InstallmentTermsPage() {
  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-6 text-[#16213a]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/customer/installments/apply"
          className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[16px] font-extrabold truncate">কিস্তির শর্তাবলী</span>
          <span className="text-[11px] font-bold text-[#5b6784]">SE Electronics</span>
        </span>
        <ShieldCheck size={22} className="text-[#0b3d91] shrink-0" />
      </div>

      {/* Policy card */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#0b3d91]">
          <FileText size={18} />
          <h2 className="text-[14px] font-extrabold">কিস্তিতে পণ্য ক্রয়ের শর্তাবলী ও নীতিমালা</h2>
        </div>

        <div className="flex flex-col gap-3 text-[12px] leading-relaxed text-[#3a4660]">
          <Section num="১" title="কিস্তির যোগ্যতা">
            কিস্তিতে পণ্য ক্রয়ের জন্য আবেদনকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে। একজন বৈধ জামিনদার (Guarantor) এর তথ্য বাধ্যতামূলকভাবে প্রদান করতে হবে। আবেদনকারীর জাতীয় পরিচয়পত্র (NID), স্থায়ী ও বর্তমান ঠিকানা এবং ব্যাংক অ্যাকাউন্টের তথ্য সঠিকভাবে দিতে হবে।
          </Section>

          <Section num="২" title="কিস্তির মেয়াদ ও পরিশোধ">
            কিস্তির মেয়াদ এবং মাসিক কিস্তির পরিমাণ অনুমোদনের সময় নির্ধারিত হবে। প্রতিটি কিস্তি নির্দিষ্ট তারিখের মধ্যে পরিশোধ করতে হবে। কিস্তি পরিশোধের রসিদ বা ডিজিটাল প্রমাণ সংরক্ষণ করা আবেদনকারীর দায়িত্ব।
          </Section>

          <Section num="৩" title="কিস্তি খেলাপি ও পণ্য ফেরত">
            <span className="font-extrabold text-[#c81f38]">
              পরপর দুই (০২) কিস্তি খেলাপি হলে SE Electronics কোনো পূর্ব নোটিশ ছাড়াই পণ্য ফেরত নেওয়ার অধিকার রাখে।
            </span>{" "}
            খেলাপি হলে ইতোপূর্বে পরিশোধিত কিস্তির টাকা ফেরতযোগ্য নয় — এটি পণ্য ব্যবহারের ভাড়া হিসেবে গণ্য হবে। পণ্য ফেরতের সময় পণ্যের কোনো ক্ষতি পরিলক্ষিত হলে অতিরিক্ত ক্ষতিপূরণ প্রদান করতে হবে।
          </Section>

          <Section num="৪" title="পণ্যের মালিকানা">
            সম্পূর্ণ কিস্তি পরিশোধ না হওয়া পর্যন্ত পণ্যের মালিকানা SE Electronics-এর কাছে থাকবে। কিস্তি চলাকালীন পণ্য বিক্রি, হস্তান্তর বা বন্ধক রাখা সম্পূর্ণ নিষিদ্ধ। সকল কিস্তি সফলভাবে পরিশোধ হলে পণ্যের পূর্ণ মালিকানা ক্রেতার কাছে হস্তান্তর করা হবে।
          </Section>

          <Section num="৫" title="পণ্যের যত্ন ও রক্ষণাবেক্ষণ">
            কিস্তি চলাকালীন পণ্যের যথাযথ যত্ন নেওয়া ক্রেতার দায়িত্ব। ইচ্ছাকৃত বা অবহেলাজনিত ক্ষতির জন্য ক্রেতা দায়ী থাকবেন। ওয়ারেন্টি সুবিধা শুধুমাত্র প্রস্তুতকারকের শর্ত অনুযায়ী প্রযোজ্য হবে।
          </Section>

          <Section num="৬" title="জামিনদারের দায়িত্ব">
            আবেদনকারী কিস্তি পরিশোধে ব্যর্থ হলে জামিনদার বকেয়া কিস্তি পরিশোধের জন্য দায়বদ্ধ থাকবেন। জামিনদার পণ্য ফেরতে সহায়তা করতে বাধ্য থাকবেন।
          </Section>

          <Section num="৭" title="আইনগত ব্যবস্থা">
            শর্ত লঙ্ঘনের ক্ষেত্রে SE Electronics আইনানুগ ব্যবস্থা গ্রহণের অধিকার সংরক্ষণ করে। যেকোনো বিরোধ নিষ্পত্তিতে সিলেট জেলার আদালতের এখতিয়ার প্রযোজ্য হবে।
          </Section>

          <Section num="৮" title="শর্তাবলী পরিবর্তন">
            SE Electronics যেকোনো সময় এই শর্তাবলী পরিবর্তন বা সংশোধন করার অধিকার রাখে। পরিবর্তিত শর্তাবলী SE Electronics-এর পোর্টালে প্রকাশ করা হবে।
          </Section>
        </div>

        <div className="rounded-md bg-[#f0f6ff] border border-[#d0e0f7] p-3 text-[11px] text-[#0b3d91] font-semibold leading-relaxed">
          আবেদন জমা দেওয়ার মাধ্যমে আপনি উপরোক্ত সকল শর্তাবলী পড়েছেন এবং সম্মতি প্রদান করেছেন বলে গণ্য হবে।
        </div>
      </div>

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — 09649355555
      </p>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-extrabold text-[#16213a] mb-0.5">{num}. {title}</p>
      <p>{children}</p>
    </div>
  );
}
