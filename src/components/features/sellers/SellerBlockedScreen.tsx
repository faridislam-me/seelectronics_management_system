import { sellerLogout } from "@/actions/sellerActions";
import { contactDetails } from "@/constants";
import { ChevronRight, Headset, Lock, LogIn, Phone, ShieldAlert, ShieldCheck, X } from "lucide-react";

type SellerBlockedProps = {
  name?: string | null;
  sellerId?: string | null;
  shopName?: string | null;
};

function WaveFooter() {
  return (
    <footer className="relative mt-auto pt-10 text-center text-white">
      <svg aria-hidden className="absolute inset-x-0 bottom-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0 40 Q200 -10 400 40 L400 100 L0 100 Z" fill="#0b2a66" />
        <path d="M0 28 Q200 -18 400 28" stroke="#7fb4ff" strokeWidth="1.5" fill="none" opacity=".6" />
      </svg>
      <div className="relative pb-3 flex flex-col items-center gap-0.5">
        <span className="text-[13px] font-extrabold tracking-[4px]">SE ELECTRONICS</span>
        <span className="flex items-center gap-2 text-[11px] text-white/85"><span className="h-px w-8 bg-white/40" />Smart Solution&nbsp; Better Life<span className="h-px w-8 bg-white/40" /></span>
      </div>
    </footer>
  );
}

/**
 * Blocked view shown on every in-app seller page: a blocked seller is redirected
 * to /seller/blocked instead of looping between /seller/profile and /seller/login.
 */
export function SellerBlockedAppView({ name, sellerId, shopName }: SellerBlockedProps) {
  const care = contactDetails.customerCare;
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_60%,#e8f1ff_100%)] flex flex-col text-[#16213a]">
      <div className="w-full max-w-[480px] mx-auto px-2 pt-3 pb-3 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_10px_30px_rgba(11,61,145,0.10)]">
          {/* Curved header with shield */}
          <div className="relative h-[150px] flex items-end justify-center">
            <svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0 0 H400 V92 Q200 150 0 92 Z" fill="#0b2a66" />
              <path d="M0 80 Q200 136 400 80" stroke="#7fb4ff" strokeWidth="1.5" fill="none" opacity=".5" />
            </svg>
            <span className="absolute top-4 left-6 size-1.5 rounded-full bg-white/40" />
            <span className="absolute top-10 right-8 size-1 rounded-full bg-white/50" />
            <div className="relative mb-1 size-28 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-white/80 border border-[#dbe7fb]" />
              <span className="absolute inset-2 rounded-full bg-[#e8f1ff]" />
              <span className="relative size-20 flex items-center justify-center">
                <ShieldCheck className="absolute inset-0 size-20 text-[#1f5fc9] fill-[#1f5fc9]" strokeWidth={1} />
                <Lock size={26} className="relative text-white" strokeWidth={2.6} />
              </span>
              <span className="absolute right-2 bottom-2 size-8 rounded-full bg-[#e0243f] border-[3px] border-white text-white flex items-center justify-center"><X size={15} strokeWidth={3.2} /></span>
            </div>
          </div>

          <div className="flex-1 px-3 pb-4 pt-3 flex flex-col items-center justify-evenly gap-3 text-center">
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#fff1f2] border border-[#f5b8c1] text-[#0b2a66] text-[clamp(17px,5.2vw,21px)] font-extrabold"><Lock size={18} className="text-[#e0243f]" />Account Blocked</span>
            <p className="text-[12.5px] leading-snug text-[#3d4a63]">Your seller account has been temporarily blocked for security reasons.<br /><span className="text-[#1f5fc9] font-semibold">আপনার সেলার অ্যাকাউন্টটি নিরাপত্তার স্বার্থে সাময়িকভাবে ব্লক করা হয়েছে।</span></p>

            <div className="w-full rounded-md bg-[#fff4f5] border border-[#f7d4d9] p-2.5 flex items-center gap-3 text-left">
              <span className="size-11 rounded-full bg-[#e0243f] text-white flex items-center justify-center shrink-0"><ShieldAlert size={22} /></span>
              <span className="w-px self-stretch bg-[#f1c4cb]" />
              <span className="flex flex-col gap-0.5 min-w-0 text-[13px]">
                <span className="truncate"><span className="text-[#5b6784]">Name: </span><b>{name || "N/A"}</b></span>
                {shopName ? <span className="truncate"><span className="text-[#5b6784]">Shop: </span><b>{shopName}</b></span> : null}
                <span className="truncate"><span className="text-[#5b6784]">Seller ID: </span><b>{sellerId || "N/A"}</b></span>
              </span>
            </div>

            {/* Clears the blocked session, then lands on the seller login page */}
            <form action={sellerLogout} className="w-full">
              <button type="submit" className="w-full h-12 rounded-md bg-[linear-gradient(100deg,#0b2a66_0%,#1259c9_100%)] text-white text-[14px] font-extrabold tracking-wide inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(11,42,102,0.30)] active:scale-[0.99] transition-transform">
                <LogIn size={18} />SIGN IN TO PORTAL<ChevronRight size={18} />
              </button>
            </form>

            <a href={`tel:${care}`} className="w-full rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2.5 flex items-center gap-3 text-left">
              <span className="size-10 rounded-full bg-white text-[#1f5fc9] flex items-center justify-center shrink-0 border border-[#dbe7fb]"><Headset size={20} /></span>
              <span className="flex flex-col leading-tight min-w-0">
                <b className="text-[13px] text-[#0b2a66]">Need Help?</b>
                <span className="text-[11.5px] text-[#5b6784]">Contact Admin for further assistance.</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#1f5fc9]"><Phone size={13} />{care}</span>
              </span>
            </a>

            <div className="w-full border-t border-[#eef1f6] pt-2.5 flex items-center gap-2 text-left">
              <ShieldCheck size={26} className="text-[#0b2a66] fill-[#0b2a66]/10 shrink-0" />
              <span className="flex flex-col leading-tight flex-1 min-w-0"><b className="text-[12.5px] text-[#0b2a66]">SE ELECTRONICS</b><span className="text-[11px] text-[#5b6784]">Authorized Seller Portal</span></span>
              <span className="w-px self-stretch bg-[#e3e8f1]" />
              <span className="text-[11.5px] font-semibold text-[#3d4a63] text-center shrink-0">&ldquo;নিরাপত্তাই আমাদের<br />অগ্রাধিকার&rdquo;</span>
            </div>
          </div>
        </div>
      </div>
      <WaveFooter />
    </div>
  );
}
