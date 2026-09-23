"use client";

import { sellerLogin } from "@/actions";
import { contactDetails } from "@/constants";
import { PhoneCall } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";

export default function SellerLoginPage() {
  const [state, loginAction, isPending] = useActionState(sellerLogin, undefined);
  const inputCls = "w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 placeholder:font-medium placeholder:uppercase placeholder:text-[11px] placeholder:tracking-wider focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-md shadow-2xl">
        <div className="bg-brand px-6 pt-10 pb-16 text-center relative">
          <div className="flex justify-center mb-3"><Image src="/logo.jpg" alt="SE Electronics Logo" width={72} height={72} className="rounded-full border-2 border-white/20" /></div>
          <h1 className="text-xl font-bold text-white tracking-wider uppercase">SE Electronics</h1>
        </div>
        <div className="bg-white -mt-8 rounded-t-2xl relative z-10 px-6 pt-2 pb-8">
          <div className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-md py-3 px-4 mb-6 mt-4 border border-sky-200">
            <h2 className="text-center text-[13px] font-extrabold text-brand tracking-wider uppercase">Seller / Dealer Portal Login</h2>
          </div>
          <form action={loginAction} className="space-y-4">
            <input type="text" name="username" className={inputCls} placeholder="Your Username" required autoComplete="username" />
            <input type="password" name="password" className={inputCls} placeholder="Your Password" required autoComplete="current-password" />
            {state && !state.success && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md text-sm font-semibold text-center">
                {state.message}
                {(state as any).isBlocked && <a href={`tel:${contactDetails.customerCare}`} className="flex items-center justify-center gap-2 mt-2 text-brand font-black"><PhoneCall size={14} />{contactDetails.customerCare}</a>}
              </div>
            )}
            <button type="submit" disabled={isPending} className="w-full bg-brand text-white font-bold py-3.5 px-4 rounded-md text-sm uppercase tracking-[0.15em] hover:bg-brand-800 disabled:bg-brand/50 transition-all active:scale-[0.98] mt-2">{isPending ? "Logging in..." : "Login"}</button>
          </form>
          <div className="mt-6 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            <p>Authorized Seller &amp; Dealer Portal</p>
            <p className="mt-1">Helpline {contactDetails.customerCare}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
