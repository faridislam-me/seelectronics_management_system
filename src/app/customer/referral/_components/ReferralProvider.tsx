"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCustomerReferralData } from "@/actions";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

type ReferralContextType = {
  data: any;
  refetch: () => Promise<void>;
};

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await getCustomerReferralData();
    if (res.success) {
      setData(res.data);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Skeleton shaped like the referral screen so the footer doesn't float
  // mid-page while data loads.
  if (loading)
    return (
      <div className="flex flex-col gap-2.5 animate-pulse" aria-busy="true" aria-label="লোডিং হচ্ছে...">
        <div className="h-[170px] rounded-md bg-[#c9d8f0]" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-[64px] rounded-md bg-white border border-[#dfe6f2]" />
          <div className="h-[64px] rounded-md bg-white border border-[#dfe6f2]" />
        </div>
        <div className="h-6 w-40 rounded-md bg-[#dbe4f3]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[92px] rounded-md bg-white border border-[#dfe6f2]" />
        ))}
      </div>
    );

  if (!data?.vipCardNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-slate-50">
        <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-xl max-w-sm w-full">
          <AlertCircle className="size-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            VIP মেম্বারশিপ প্রয়োজন
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            রেফারেল ফিচারটি শুধুমাত্র আমাদের ভিআইপি কার্ড হোল্ডারদের জন্য।
            পয়েন্ট আর্ন করতে আজই ভিআইপি কার্ডের জন্য আবেদন করুন!
          </p>
          <Link
            href="/customer/vip-card"
            className="w-full bg-brand text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-brand/20 hover:scale-[1.02] transition-transform inline-block"
          >
            আবেদন করুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReferralContext.Provider value={{ data, refetch: fetchData }}>
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return context;
}
