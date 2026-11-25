import { StaffNotGuiltyTemplateData } from "@/app/pdf/download/actions/pdfTypes";

type StaffNotGuiltyTemplateProps = {
  data: StaffNotGuiltyTemplateData;
};

export default function StaffNotGuiltyTemplate({
  data,
}: StaffNotGuiltyTemplateProps) {
  const today = new Date().toLocaleDateString("bn-BD");

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white pt-[0.75in] pr-[0.75in] pb-[0.5in] pl-[1.5in] text-[#111] overflow-hidden box-border flex flex-col"
      style={{
        fontFamily: "'SolaimanLipi', sans-serif",
        lineHeight: "1.6",
        fontSize: "15px",
      }}
    >
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-black underline underline-offset-4">
          অভিযোগ নিষ্পত্তি ও দায়মুক্তি পত্র (Resolution & Clean Chit Notice)
        </h1>
      </div>

      <div className="mb-6 font-bold flex justify-between">
        <p>
          স্মারক নংঃ SE/HR/{new Date().getFullYear()}/{data.receiptNo}
        </p>
        <p>তারিখঃ {data.resolvedDateBn || today} ইং</p>
      </div>

      <div className="mb-6">
        <p className="font-bold underline mb-2">সংশ্লিষ্ট বিবরণঃ</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>
              <span className="font-bold">অভিযুক্ত স্টাফঃ</span>{" "}
              {data.staff.name}
            </p>
            <p>
              <span className="font-bold">স্টাফ আইডিঃ</span>{" "}
              {data.staff.staffId}
            </p>
          </div>
          <div>
            <p>
              <span className="font-bold">অভিযোগকারীঃ</span>{" "}
              {data.customer.name}
            </p>
            <p>
              <span className="font-bold">কমপ্লেইন আইডিঃ</span>{" "}
              {data.complaintId}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="font-bold underline mb-2">তদন্ত রিপোর্ট ও সিদ্ধান্তঃ</p>
        <p className="text-justify leading-relaxed">
          গত {data.resolvedDateBn || today} ইং আপনার বিরুদ্ধে আনীত অভিযোগের
          প্রেক্ষিতে যে তদন্ত কার্যক্রম এবং শুনানী অনুষ্ঠিত হয়েছে, তার সার্বিক
          ফলাফল পর্যালোচনা পূর্বক এই সিদ্ধান্তে উপনীত হওয়া গেছে যে, আপনার
          বিরুদ্ধে উত্থাপিত অভিযোগগুলো সন্দেহাতীতভাবে প্রমাণিত হয়নি।
        </p>
        <p className="text-justify leading-relaxed mt-4">
          তদন্তে দেখা গেছে যে, গ্রাহকের সেবার ক্ষেত্রে যে অনাকাঙ্ক্ষিত পরিস্থিতি
          সৃষ্টি হয়েছিল, তা মূলত কারিগরি সীমাবদ্ধতা বা অন্য কোনো বাহ্যিক কারণে
          যা আপনার সরাসরি নিয়ন্ত্রণে ছিল না। আপনার পেশাদারিত্ব এবং প্রতিষ্ঠানের
          নিয়মাবলীর প্রতি আপনার আনুগত্য সন্তোষজনক পাওয়া গেছে।
        </p>
      </div>

      <div className="mb-6">
        <p className="font-bold underline mb-2">কার্যকরী পদক্ষেপসমূহঃ</p>
        <ol className="list-decimal list-inside space-y-1 pl-2 text-justify">
          <li>
            আপনাকে উক্ত অভিযোগ থেকে সম্পূর্ণ "দায়মুক্তি" (Clear Chit) প্রদান করা
            হলো।
          </li>
          <li>
            আপনার সার্ভিস রেকর্ডে এই অভিযোগটি নেতিবাচক হিসেবে গণ্য করা হবে না।
          </li>
          <li>
            গ্রাহককে তদন্তের ফলাফল এবং আপনার নির্দোষ হওয়ার বিষয়টি আনুষ্ঠানিকভাবে
            অবহিত করা হয়েছে।
          </li>
        </ol>
      </div>

      <div className="mb-6 text-justify">
        <p className="font-bold underline mb-2">পরামর্শ:</p>
        <p>
          ভবিষ্যতে গ্রাহকসেবা প্রদানের ক্ষেত্রে আরও সতর্ক ও ধৈর্যশীল হওয়ার এবং
          প্রতিষ্ঠানের ভাবমূর্তি বজায় রাখার জন্য আপনাকে পরামর্শ প্রদান করা
          হচ্ছে।{" "}
          {data.adminNote && (
            <span>
              <br />
              <br />
              <strong>প্রশাসনিক মন্তব্য:</strong> {data.adminNote}
            </span>
          )}
        </p>
      </div>

      <div className="flex justify-between items-end mt-auto pt-2">
        <div className="text-left w-64">
          {data.documentSeal && (
            <img src={data.documentSeal} alt="Logo" className="w-[30mm] mb-2" />
          )}
        </div>

        <div className="text-center w-64">
          <div className="h-16 flex items-center justify-center mb-2">
            {data.atikurSign && (
              <img
                src={data.atikurSign}
                alt="Signature"
                width={160}
                height={80}
              />
            )}

            {data.chairmanSign && (
              <img
                src={data.chairmanSign}
                alt="Signature"
                width={160}
                height={80}
              />
            )}
          </div>

          <p className="text-sm">কর্তৃপক্ষের আদেশক্রমে,</p>
          <div className="border-b border-black w-full my-1"></div>
          <p className="font-bold">
            {data.officerName || "মোঃ সাহাব উদ্দিন মাহমুদ"}
          </p>
          <p className="text-sm">চেয়ারম্যান ও অভিযোগ নিষ্পত্তিকারী,</p>
          <p className="text-sm">এস ই ইলেক্ট্রনিক্স হেড অফিস সিলেট</p>
        </div>
      </div>
      <div className="text-[10px] mt-3 text-center text-gray-500 uppercase tracking-widest border-t pt-2">
        SE Electronics / SE Power IPS - সিলেট বিভাগীয় কার্যালয়
      </div>
    </div>
  );
}
