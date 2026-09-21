import {
  applyForVipCard,
  verifyCustomerSession,
} from "@/actions/customerActions";
import { contactDetails } from "@/constants";
import {
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Clock,
  Crown,
  MessageCircle,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { VipFlipCard } from "./VipFlipCard";
import vipBg from "@/assets/images/vipbg.jpeg";

export default async function VipCardPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please log in to view this page
          </h2>
          <Link
            href="/customer/login"
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const customer = session.customer;
  const vipStatus = (customer as any).vipStatus;
  const vipCardNumber = (customer as any).vipCardNumber;

  const benefits = [
    "Priority Customer Support - Skip the queue!",
    "Exclusive Discounts on all regular maintenance plans",
    "Free minor repairs on selected services",
    "Extended warranty features for featured products",
    "Special home-delivery rates",
  ];

  async function handleApply(formData: FormData) {
    "use server";
    await applyForVipCard();
    revalidatePath("/customer/vip-card");
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto pb-20">
        
        {vipStatus === "approved" ? (
          <div className="relative my-8">
            <VipFlipCard 
              customer={customer} 
              vipCardNumber={vipCardNumber} 
              vipBgSrc={vipBg?.src || '/vipbg.jpeg'} 
              baseUrl={process.env.NEXT_PUBLIC_BASE_URL}
            />
          </div>
        ) : (
          /* Normal/Pending State */
          <div className="bg-slate-900 rounded-md p-4 sm:p-12 text-white shadow-xl border border-white/5 relative overflow-hidden group mx-2 my-3">
            {/* Dark theme background accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs mb-2">
                    SE Electronics
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    VIP Card Application
                  </h2>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <Crown size={32} className="text-blue-400 opacity-80" />
                </div>
              </div>

              <p className="text-slate-400 mb-8 leading-relaxed font-medium">
                {vipStatus === "pending" || vipStatus === "processing"
                  ? "Your application is currently being reviewed by our administrative team. We will notify you once it's approved."
                  : vipStatus === "expired"
                    ? "Your previous VIP card has expired. Re-apply now to continue enjoying exclusive benefits, priority support, and special discounts."
                    : "Join our elite membership program to enjoy exclusive benefits, priority support, and special discounts on all services."}
              </p>

              {vipStatus === "pending" || vipStatus === "processing" ? (
                <div className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-widest text-sm bg-blue-400/10 p-5 rounded-2xl border border-blue-400/20">
                  <Clock className="animate-pulse" size={20} />
                  Status: {vipStatus.toUpperCase()}
                </div>
              ) : vipStatus === "rejected" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-red-400 font-black uppercase tracking-widest text-sm bg-red-400/10 p-5 rounded-2xl border border-red-400/20">
                    <CheckCircle2 size={20} />
                    Status: Rejected
                  </div>
                  <form action={handleApply}>
                    <button className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
                      Apply Again
                    </button>
                  </form>
                </div>
              ) : vipStatus === "expired" ? (
                <form action={handleApply}>
                  <button className="w-full bg-orange-600 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-orange-600/20 hover:shadow-2xl hover:bg-orange-700 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                    <Crown size={20} />
                    Renew VIP Card
                  </button>
                </form>
              ) : (
                <form action={handleApply}>
                  <button className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                    <Crown size={20} />
                    Apply for VIP Card
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 bg-white rounded-md p-3 sm:p-12 shadow-sm border border-gray-100">
          <div className="text-center mb-12">
            {vipStatus !== "approved" ? (
              <div className="inline-block mb-4 px-4 py-2 rounded-md bg-emerald-100 text-emerald-700 font-bold text-sm shadow-sm">
                VIP Card আবেদন ফি: ১৫০০ টাকা
              </div>
            ) : (
              <div className="inline-block mb-4 px-4 py-2 rounded-md bg-emerald-500 text-white font-bold text-sm shadow-md">
                স্বাগতম! আপনি এখন আমাদের VIP সদস্য। বিশেষ সুবিধা উপভোগ করুন।
              </div>
            )}
            <span className="text-3xl mb-4 block">🌟</span>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              এস ই ইলেকট্রনিক্স – ভিআইপি মেম্বারশিপ বেনিফিট
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-lg mx-auto font-medium">
              আপনার নিরবচ্ছিন্ন বিদ্যুৎ সেবা এবং মানসিক প্রশান্তি নিশ্চিত করতে
              এস ই ইলেকট্রনিক্স নিয়ে এলো বিশেষ VIP Member Card। এই কার্ডধারী
              গ্রাহকগণ আমাদের আইপিএস, ব্যাটারী এবং ভোল্টেজ স্ট্যাবিলাইজার সেবার
              ওপর বিশেষ অগ্রাধিকার ও সাশ্রয়ী সুবিধা উপভোগ করবেন।
            </p>
          </div>

          <div className="space-y-12">
            {/* Special Benefits */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Crown size={20} className="text-orange-600" />
                </div>
                কার্ডধারীদের জন্য বিশেষ সুবিধাসমূহ
              </h3>
              <div className="grid gap-6">
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-blue-600" />
                    ১. সার্ভিসিং-এ ৫% নগদ ছাড় (Service Discount)
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    আপনার ব্যবহৃত আইপিএস, ব্যাটারী কিংবা ভোল্টেজ
                    স্ট্যাবিলাইজার-এর যেকোনো ধরণের মেরামত বা নিয়মিত সার্ভিসিং
                    ফি-র ওপর সরাসরি ৫% ডিসকাউন্ট পাবেন। আমাদের দক্ষ টেকনিশিয়ান
                    দ্বারা দ্রুত ও মানসম্মত সেবার নিশ্চয়তা দিচ্ছি।
                  </p>
                </div>
                <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-purple-600" />
                    ২. নতুন ক্রয়ে বিশেষ ছাড় ও রেফারেল বোনাস
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    এই ভিআইপি কার্ড নাম্বার ব্যবহার করে আপনি নিজে অথবা আপনার
                    রেফারেন্সে অন্য কেউ যদি নতুন আইপিএস, ব্যাটারি বা
                    স্ট্যাবিলাইজার ক্রয় করেন, তাহলে মোট মূল্যের ওপর ৪% বিশেষ ছাড়
                    প্রদান করা হবে ক্রেতাকে। পাশাপাশি, যাঁর ভিআইপি কার্ড ব্যবহার
                    করা হবে, তিনি অতিরিক্ত ২% রেফারেল বোনাস উপভোগ করবেন। এটি
                    আপনার এবং আপনার পরিচিতদের জন্য একটি লাভজনক ও সাশ্রয়ী সুবিধা।
                  </p>
                </div>
              </div>
            </section>

            {/* Other Services */}
            <section className="bg-gray-50/50 p-3 rounded-md border border-gray-100">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h5 className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                    ইলেক্ট্রিক সার্ভিস
                  </h5>
                  <p className="text-[13px] text-gray-600 font-medium">
                    নতুন আইপিএস ইনস্টলেশন বা ফিটিং।
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                    বাসা বদল সার্ভিস
                  </h5>
                  <p className="text-[13px] text-gray-600 font-medium">
                    বাসা বা অফিস পরিবর্তনের সময় ফ্যান, লাইট, এসি এবং ইলেকট্রিক
                    ওয়্যারিং খোলা বা নতুন করে ফিটিং করা।
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-black text-gray-900 uppercase tracking-wider text-[11px]">
                    রক্ষণাবেক্ষণ প্যাকেজ
                  </h5>
                  <p className="text-[13px] text-gray-600 font-medium">
                    ব্যাটারী রিফিল প্যাক এবং আইপিএস ও ব্যাটারীর "সম্পূর্ণ
                    রক্ষণাবেক্ষণ (Full Maintenance) প্যাক"-এর ওপর ৫% ছাড়।
                  </p>
                </div>
              </div>
            </section>

            {/* Membership Services */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Crown size={20} className="text-green-600" />
                </div>
                আমাদের বিশেষ ভিআইপি মেম্বারশিপ সেবাসমূহ
              </h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    t: "দক্ষ টেকনিশিয়ান",
                    d: "অভিজ্ঞ ইলেকট্রিশিয়ান দ্বারা নিরাপদ ওয়্যারিং ও ফিটিং।",
                  },
                  {
                    t: "ব্যাটারী কেয়ার",
                    d: "ব্যাটারীর দীর্ঘস্থায়িত্ব নিশ্চিত করতে প্রফেশনাল রিফিল ও চেকআপ।",
                  },
                  {
                    t: "হোম সার্ভিস",
                    d: "সিলেট শহর ও এর আশেপাশে দ্রুত হোম ডেলিভারি ও সার্ভিস সুবিধা।",
                  },
                ].map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100"
                  >
                    <CheckCircle2
                      size={20}
                      className="text-green-600 flex-shrink-0"
                    />
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm mb-1">
                        {s.t}
                      </h5>
                      <p className="text-[12px] text-gray-500 font-medium">
                        {s.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Why Choose Us */}
            <section className="bg-gray-900 rounded-md p-3 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                  কেন আমাদের বেছে নেবেন?
                </h3>
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        ✓
                      </div>
                      <p className="text-gray-300 font-medium text-sm">
                        দ্রুত বিক্রয়োত্তর সেবা।
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        ✓
                      </div>
                      <p className="text-gray-300 font-medium text-sm">
                        অরিজিনাল পার্টসের নিশ্চয়তা।
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        ✓
                      </div>
                      <p className="text-gray-300 font-medium text-sm">
                        দক্ষ টেকনিশিয়ান দ্বারা সার্ভিসিং।
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        ✓
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          নির্ভরযোগ্যতা
                        </p>
                        <p className="text-gray-400 text-[12px]">
                          দীর্ঘস্থায়ী ব্যাটারী এবং সেনসিটিভ ডিভাইসের জন্য সেরা
                          ভোল্টেজ স্ট্যাবিলাইজার।
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                        ✓
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          দ্রুত সেবা
                        </p>
                        <p className="text-gray-400 text-[12px]">
                          সিলেট শহর ও এর আশেপাশে আমাদের টেকনিশিয়ান টিম দ্রুত হোম
                          সার্ভিস প্রদান করে।
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms and Conditions */}
            <section className="bg-rose-50/50 p-3 rounded-md border border-rose-100">
              <h3 className="text-lg font-bold text-rose-900 mb-6 flex items-center gap-2">
                <CheckCircle className="text-rose-600" size={20} />
                📌 নিয়ম ও শর্তাবলী:
              </h3>
              <ul className="space-y-4">
                {[
                  "সার্ভিস গ্রহণ বা পণ্য ক্রয়ের সময় অবশ্যই ভিআইপি কার্ড বা কার্ড নাম্বারটি প্রদর্শন করতে হবে।",
                  "ইলেকট্রিক ওয়্যারিং বা ফিটিং সার্ভিসের ক্ষেত্রে কাজ শুরুর আগেই কার্ড নাম্বারটি নিশ্চিত করতে হবে।",
                  "অন্য কোনো রানিং অফারের সাথে এই ডিসকাউন্টটি যুক্ত করা যাবে না।",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[13px] text-gray-700 font-medium"
                  >
                    <span className="text-rose-400 font-black">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-12 bg-gray-50 rounded-md p-3 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-gray-900">Need Assistance?</h4>
              <p className="text-sm text-gray-500 font-medium">
                Our support team is ready to help you with your VIP membership.
              </p>
            </div>
            <a
              href={`https://wa.me/${contactDetails.whatsApp.replace(/\+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest whitespace-nowrap"
            >
              <MessageCircle size={20} />
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
