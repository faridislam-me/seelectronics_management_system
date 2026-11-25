import { CompletionNoticeTemplateData } from "@/app/pdf/download/actions/pdfTypes";

type CompletionNoticeTemplateProps = {
  data: CompletionNoticeTemplateData;
};

export default function CompletionNoticeTemplate({
  data,
}: CompletionNoticeTemplateProps) {
  const today = new Date().toLocaleDateString("bn-BD");

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white pt-[0.75in] pr-[0.75in] pb-[0.5in] pl-[1.5in] text-[#111] overflow-hidden box-border flex flex-col"
      style={{
        fontFamily: "'SolaimanLipi', sans-serif",
        lineHeight: "1.45",
        fontSize: "14px",
      }}
    >
      {/* Title */}
      <div className="mb-3">
        <h1 className="text-xl font-black underline underline-offset-4">
          গ্রাহক অবহিতকরণ পত্র (Customer Resolution Notice)
        </h1>
      </div>

      {/* Date */}
      <div className="mb-3 font-bold">
        <p>তারিখঃ {data.resolvedDateBn || today} ইং</p>
      </div>

      {/* Recipient */}
      <div className="mb-3 text-left">
        <p>
          প্রিয় সম্মানীত গ্রাহক{" "}
          <span className="font-bold">{data.customer.name}</span>, <br />
          ঠিকানাঃ {data.customer.address} <br />
          মোবাইল নম্বর: <span className="font-bold">{data.customer.phone}</span>
        </p>
        <p className="mt-2 font-bold underline underline-offset-2">
          বিষয়ঃ আপনার দাখিলকৃত অভিযোগের সার্ভিস আইডিঃ {data.complaintId}{" "}
          নিষ্পত্তি ও গৃহীত ব্যবস্থা প্রসঙ্গে।
        </p>
      </div>

      {/* Salutation */}
      <div className="mb-2">
        <p>সম্মানিত গ্রাহক,</p>
      </div>

      {/* Apology & Resolution */}
      <div className="text-justify mb-3">
        <p>
          শুভেচ্ছা নিবেন। প্রথমেই আমাদের প্রতিষ্ঠানের পক্ষ থেকে আন্তরিক দুঃখ
          প্রকাশ করছি যে, গত {data.resolvedDateBn || today} ইং তারিখে আমাদের
          টেকনিশিয়ানের কাছ থেকে আপনি অনাকাঙ্ক্ষিত ও অপেশাদার আচরণের সম্মুখীন
          হয়েছেন। আপনার অভিযোগটি পাওয়ার পর আমরা আমাদের অভ্যন্তরীণ তদন্ত কমিটি
          এবং ব্যক্তিগত শুনানির মাধ্যমে বিষয়টি অত্যন্ত গুরুত্বের সাথে যাচাই
          করেছি। তদন্তে আপনার অভিযোগের সত্যতা প্রমাণিত হয়েছে এবং সংশ্লিষ্ট
          টেকনিশিয়ান{" "}
          <span className="font-bold text-black">{data.staff.name}</span> (ID:{" "}
          <span className="font-mono text-xs">{data.staff.staffId}</span>) দোষী
          সাব্যস্ত হয়েছেন।
        </p>
      </div>

      {/* Punishment Section */}
      <div className="mb-3">
        <p className="font-bold underline mb-1.5">গৃহীত শাস্তিমূলক ব্যবস্থা</p>
        <p className="mb-2 text-justify">
          প্রতিষ্ঠানের শৃঙ্খলা ও সেবার মান বজায় রাখতে উক্ত টেকনিশিয়ানের বিরুদ্ধে
          নিম্নোক্ত শাস্তিমূলক ব্যবস্থা গ্রহণ করা হয়েছে:
        </p>

        <div className="space-y-1.5">
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap">বিভাগীয় শাস্তি:</span>
            <p className="text-justify">
              উক্ত টেকনিশিয়ানকে তার আচরণের দায়ে শাস্তির ধরন হিসেবে:{" "}
              <span className="font-bold underline underline-offset-2">
                {data.punishmentType || "চূড়ান্ত সতর্কীকরণ"}
              </span>{" "}
              প্রদান করা হয়েছে।
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap">সার্ভিস রেকর্ড:</span>
            <p className="text-justify">
              তার ব্যক্তিগত সার্ভিস প্রোফাইলে এই ঘটনাটি নেতিবাচক আচরণ হিসেবে
              লিপিবদ্ধ করা হয়েছে, যা তার ক্যারিয়ার ও পদোন্নতির ক্ষেত্রে প্রভাব
              ফেলবে।
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <span className="font-bold whitespace-nowrap">
              ভবিষ্যৎ নির্দেশনা:
            </span>
            <p className="text-justify">
              তাকে পুনরায় পেশাদার আচরণ সংক্রান্ত প্রশিক্ষণে (Behavioral
              Training) পাঠানোর নির্দেশ দেওয়া হয়েছে।
            </p>
          </div>
        </div>
      </div>

      {/* Assurance */}
      <div className="text-justify mb-3 text-sm">
        <p>
          আমরা আপনাকে নিশ্চিত করছি যে, ভবিষ্যতে আমাদের কোনো প্রতিনিধির কাছ থেকে
          আপনি এমন আচরণের সম্মুখীন হবেন না। আপনার মূল্যবান মতামত আমাদের সেবার
          মান উন্নত করতে সাহায্য করেছে। অনাকাক্ষিত এই ঘটনার জন্য আমরা পুনরায়
          ক্ষমাপ্রার্থী। আপনার পরবর্তী কোনো সার্ভিসের প্রয়োজন হলে সরাসরি আমাদের
          হটলাইনে যোগাযোগ করার অনুরোধ রইল।
        </p>
      </div>

      {/* Signature Block - pushed to bottom */}
      <div className="flex justify-between items-end mt-auto pt-2">
        <div className="text-left w-64">
          {data.documentSeal && (
            <img src={data.documentSeal} alt="Logo" className="w-[30mm] mb-2" />
          )}
          <p className="font-bold">যোগাযোগের নম্বরঃ ০১৩২২২৪৭৭৭৪</p>
        </div>

        <div className="text-center w-64">
          <div className="h-14 flex items-center justify-center mb-2">
            {data.chairmanSeal && (
              <img
                src={data.chairmanSeal}
                alt="Signature"
                width={160}
                height={80}
              />
            )}
          </div>
          <p className="text-sm">ধন্যবাদান্তে,</p>

          <p className="font-bold underline underline-offset-4 uppercase tracking-tighter text-[13px]">
            কাস্টমার রিলেশন বিভাগ
          </p>
          <p className="font-bold">এস ই ইলেকট্রনিক্স</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[9px] mt-2 text-center text-gray-500 uppercase tracking-widest border-t pt-1.5">
        SE Electronics / SE Power IPS - সিলেট বিভাগীয় কার্যালয়
      </div>
    </div>
  );
}
