import { PunishmentTemplateData } from "@/app/pdf/download/actions/pdfTypes";

type ComplaintTemplateProps = {
  data: PunishmentTemplateData;
};

export default function ComplaintTemplate({ data }: ComplaintTemplateProps) {
  const today = new Date().toLocaleDateString("bn-BD");
  const orderNum = data.orderNumber || "SE/HR/2026/001";

  return (
    <div
      className="relative w-[210mm] mx-auto bg-white pt-[1in] pr-[1in] pb-[0.5in] pl-[1in] text-[#111] overflow-hidden box-border"
      style={{
        fontFamily: "'SolaimanLipi', sans-serif",
        lineHeight: "1.6",
        fontSize: "15px",
      }}
    >
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-black underline underline-offset-4">
          শাস্তিমূলক রায়ের আদেশনামা (Disciplinary Action Order)
        </h1>
      </div>

      {/* META INFO */}
      <div className="mb-6 space-y-1">
        <div className="flex gap-2">
          <span className="font-bold whitespace-nowrap">স্মারক নংঃ</span>
          <span>রেফারেন্স নম্বর: {orderNum}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold whitespace-nowrap">তারিখঃ</span>
          <span>{data.complaintDate || today} ইং</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold whitespace-nowrap">বিষয়ঃ</span>
          <span className="font-bold underline">
            {" "}
            শৃঙ্খলা ভঙ্গ ও অসদাচরণের দায়ে শাস্তিমূলক ব্যবস্থা গ্রহণ প্রসঙ্গে।
          </span>
        </div>
      </div>

      {/* STAFF INFO */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-bold whitespace-nowrap">
          সংশ্লিষ্ট টেকনিশিয়ান:
        </span>
        <span className="mr-2">নামঃ {data.staffName}</span>
        <span className="font-bold">আইডি:</span>
        <span className="font-mono mr-2">{data.staffId}</span>
        <span className="font-bold">পদবিঃ</span>
        <span className="mr-2">{data.staffRole || "টেকনিশিয়ান"}</span>
        <span className="font-bold">বিভাগঃ</span>
        <span>{data.staffOffice || "বিভাগ/সার্ভিস সেন্টার"}</span>
      </div>

      <div className="mb-6">
        <p className="font-bold underline mb-2">ঘটনার প্রেক্ষাপটঃ</p>
        <p className="text-justify leading-relaxed">
          গত {data.complaintDate} ইং তারিখে সার্ভিস আইডিঃ {data.trackingNumber}{" "}
          এর বিপরীতে একজন সম্মানিত গ্রাহক আপনার বিরুদ্ধে অসদাচরণ ও অপেশাদার
          ব্যবহারের লিখিত অভিযোগ দাখিল করেন। উক্ত অভিযোগের প্রেক্ষিতে গঠিত তদন্ত
          কমিটি এবং গত {data.complaintDate} ইং অনুষ্ঠিত শুনানিতে আপনার আত্মপক্ষ
          সমর্থনমূলক বক্তব্য পর্যালোচনা করা হয়েছে।
        </p>
      </div>

      <div className="mb-4">
        <p className="font-bold underline mb-1">তদন্তের ফলাফল ও পর্যবেক্ষণঃ</p>
        <p className="text-justify leading-relaxed">
          {data.investigationResult ||
            "তদন্তে প্রমাণিত হয়েছে যে, গ্রাহকের সাথে আপনার আচরণ প্রতিষ্ঠানের আচরণবিধি (Code of Conduct) এর পরিপন্থী ছিল। আপনার বিরুদ্ধে আনীত অভিযোগগুলো বস্তুনিষ্ঠ প্রমাণের ভিত্তিতে সত্য বলে প্রমাণিত হয়েছে, যা প্রতিষ্ঠানের ভাবমূর্তি ক্ষুণ্ন করেছে।"}
        </p>
      </div>

      {/* PUNISHMENT SECTION */}
      <div className="mb-4">
        <p className="font-bold underline mb-1">শাস্তিমূলক আদেশ</p>
        <p className="mb-2">
          আপনার অপরাধের গুরুত্ব বিবেচনা করে এবং প্রতিষ্ঠানের শৃঙ্খলা নীতি
          অনুযায়ী নিম্নোক্ত শাস্তিমূলক ব্যবস্থা গ্রহণ করা হলো:
        </p>

        <div>
          {data.punishment === "warning" && (
            <div>
              <p className="font-bold">শাস্তি: তিরস্কার ও সতর্কীকরণ</p>
              <p className="font-normal mt-1 pl-3 text-justify">
                আপনাকে এই মর্মে কঠোরভাবে সতর্ক করা হচ্ছে যে, ভবিষ্যতে এ ধরনের
                ঘটনার পুনরাবৃত্তি ঘটলে সরাসরি চাকুরি চ্যুত করা হবে।
              </p>
            </div>
          )}

          {data.punishment === "fine" && (
            <div>
              <p className="font-bold">শাস্তি: আর্থিক জরিমানা</p>
              <p className="font-normal mt-1 pl-3 text-justify">
                আপনার মাসিক বেতন/ভাতা হতে {data.fineAmount || "----"} টাকা
                জরিমানা স্বরূপ কর্তন করা হবে।
              </p>
            </div>
          )}

          {data.punishment === "suspension" && (
            <div>
              <p className="font-bold">শাস্তি: সাময়িক বরখাস্ত (Suspension)</p>
              <p className="font-normal mt-1 pl-3 text-justify">
                আগামী {data.punishmentStartDate || "----"} হতে{" "}
                {data.punishmentEndDate || "----"} তারিখ পর্যন্ত আপনাকে সকল
                প্রকার দাপ্তরিক/অনলাইনের কাজ থেকে সাময়িকভাবে বরখাস্ত করা হলো। এই
                সময়ে আপনি কোনো সার্ভিস প্রদান করতে পারবেন না।
              </p>
            </div>
          )}

          {data.punishment === "demotion" && (
            <div>
              <p className="font-bold">শাস্তি: পদাবনতি (Demotion)</p>
              <p className="font-normal mt-1 pl-3 text-justify">
                আপনাকে বর্তমান পদ থেকে অবনমিত করে {data.newPosition || "----"}{" "}
                পদে স্থলাভিষিক্ত করা হলো।
              </p>
            </div>
          )}

          {data.punishment === "termination" && (
            <div>
              <p className="font-bold">শাস্তি: চাকুরি অবসান (Termination)</p>
              <p className="font-normal mt-1 pl-3 text-justify">
                আপনার নিয়োগ আদেশ অদ্য হতে {data.punishmentStartDate || today}{" "}
                বাতিল করা হলো এবং আপনাকে চাকুরিতে অব্যহতি প্রদান করা হলো।
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-bold underline mb-1">নির্দেশনা:</p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>এই আদেশ অবিলম্বে কার্যকর হবে।</li>
          <li>
            ভবিষ্যতে পেশাদারিত্ব বজায় রাখার জন্য আপনাকে আচরণগত প্রশিক্ষণ গ্রহণের
            নির্দেশ দেওয়া যাচ্ছে।
          </li>
          <li>
            গ্রাহকের কাছে প্রতিষ্ঠানের পক্ষ থেকে দুঃখ প্রকাশ করা হয়েছে, যা আপনার
            ব্যক্তিগত নথিতে (Service Record) লিপিবদ্ধ থাকবে।
          </li>
        </ol>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="flex justify-between items-end mt-4">
        <div className="text-left">
          {data.documentSeal && (
            <img src={data.documentSeal} alt="Logo" className="w-[40mm] mb-2" />
          )}
        </div>
        <div className="text-center w-64">
          <div className="h-16 flex items-center justify-center mb-2">
            {data.atikurSign && (
              <img
                src={data.atikurSign}
                alt="Signature"
                className="max-h-full max-w-full object-contain"
              />
            )}
            {data.chairmanSign && (
              <img
                src={data.chairmanSign}
                alt="Signature"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
          <p className="text-sm">কর্তৃপক্ষের আদেশক্রমে,</p>
          <div className="border-b border-black w-full my-1"></div>
          <p className="font-bold">
            {data.signatoryName || "মোঃ সাহাব উদ্দিন মাহমুদ"}
          </p>
          <p className="text-sm">
            {data.signatoryTitle || "চেয়ারম্যান, এস ই ইলেকট্রনিক্স"}
          </p>
        </div>
      </div>

      <div className="text-xs font-bold pt-2 mt-4">
        {data.companyName || "SE Electronics / SE Power IPS"}
      </div>
    </div>
  );
}
