import { staffLogout } from "@/actions/staffActions";
import { contactDetails } from "@/constants";
import { AlertCircle, ChevronRight, Headset, Lock, LogIn, Phone, ShieldAlert, ShieldCheck, User, X } from "lucide-react";

type BlockedProps = {
  /** Optional extra control rendered under "Need Help?" (e.g. a back button). */
  action?: React.ReactNode;
  name?: string | null;
  staffId?: string | null;
  photoUrl?: string | null;
  /** Optional block reason; the default Bangla text is shown when absent. */
  reason?: string | null;
};

const DEFAULT_REASON = "আপনার অ্যাকাউন্টটি বর্তমানে ব্লক করা আছে। পুনরায় সক্রিয় করতে আমাদের এডমিন প্যানেলের সাথে যোগাযোগ করুন।";

function Avatar({ name, photoUrl, className }: { name?: string | null; photoUrl?: string | null; className: string }) {
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={name || "Staff"} className={`${className} object-cover object-top`} />
  ) : (
    <span className={`${className} bg-[#0b2a66] text-white flex items-center justify-center`}><User size={34} /></span>
  );
}

function WaveFooter({ spaced }: { spaced?: boolean }) {
  return (
    <footer className="relative mt-auto pt-10 text-center text-white">
      <svg aria-hidden className="absolute inset-x-0 bottom-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0 40 Q200 -10 400 40 L400 100 L0 100 Z" fill="#0b2a66" />
        <path d="M0 28 Q200 -18 400 28" stroke="#7fb4ff" strokeWidth="1.5" fill="none" opacity=".6" />
      </svg>
      <div className="relative pb-3 flex flex-col items-center gap-0.5">
        <span className={`text-[13px] font-extrabold ${spaced ? "tracking-[4px]" : "tracking-wide"}`}>SE ELECTRONICS</span>
        <span className="flex items-center gap-2 text-[11px] text-white/85"><span className="h-px w-8 bg-white/40" />Smart Solution&nbsp; Better Life<span className="h-px w-8 bg-white/40" /></span>
      </div>
    </footer>
  );
}

/**
 * (A) Blocked view for the staff LOGIN page: red shield, pink identity card,
 * reason card and a big "CALL ADMIN NOW" button.
 */
export function StaffBlockedLoginView({ name, staffId, photoUrl, reason, action }: BlockedProps) {
  const care = contactDetails.customerCare;
  return (
    <div className="relative overflow-hidden min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_60%,#e8f1ff_100%)] flex flex-col text-[#16213a]">
      {/* light diagonal panels in the background */}
      <span aria-hidden className="pointer-events-none absolute -left-24 top-24 h-72 w-48 rotate-[28deg] bg-white/60" />
      <span aria-hidden className="pointer-events-none absolute -right-20 top-40 h-80 w-40 -rotate-[28deg] bg-[#dfeafc]/60" />
      <header className="relative w-full bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white">
        <div className="max-w-[480px] mx-auto px-3 h-14 flex items-center">
          <span className="flex flex-col leading-tight"><span className="text-[17px] font-extrabold">SE Electronics</span><span className="text-[11px] text-white/85 font-medium">Smart Solution &nbsp;Better Life</span></span>
        </div>
      </header>
      <div className="relative w-full max-w-[480px] mx-auto px-3 pt-4 flex flex-col items-center gap-3 text-center">
        {/* Shield */}
        <div className="relative size-40 flex items-center justify-center">
          {/* soft pink glow behind the shield */}
          <span className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(255,196,205,0.75)_0%,rgba(255,225,230,0.55)_45%,rgba(255,240,242,0)_72%)]" />
          <span className="absolute inset-4 rounded-full bg-[#ffe3e7] shadow-[0_0_30px_rgba(224,36,63,0.18)]" />
          <span className="absolute left-0 top-1/2 flex flex-col gap-1.5 -translate-y-1/2"><i className="block h-0.5 w-4 bg-[#e0243f] rounded" /><i className="block h-0.5 w-2 bg-[#e0243f] rounded ml-2" /></span>
          <span className="absolute right-0 top-1/2 flex flex-col items-end gap-1.5 -translate-y-1/2"><i className="block h-0.5 w-4 bg-[#e0243f] rounded" /><i className="block h-0.5 w-2 bg-[#e0243f] rounded mr-2" /></span>
          <span className="relative size-24 flex items-center justify-center">
            <ShieldAlert className="absolute inset-0 size-24 text-[#e0243f] fill-[#e0243f]" strokeWidth={1} />
            <Lock size={30} className="relative text-white" strokeWidth={2.6} />
          </span>
          <span className="absolute right-3 bottom-3 size-9 rounded-full bg-[#e0243f] border-[3px] border-white text-white flex items-center justify-center"><X size={18} strokeWidth={3.2} /></span>
        </div>

        <span className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[linear-gradient(90deg,#e0243f,#c81f38)] text-white text-[clamp(18px,5.6vw,24px)] font-extrabold shadow-[0_8px_20px_rgba(224,36,63,0.35)]"><Lock size={20} />Account Blocked</span>
        <p className="text-[13px] leading-snug text-[#3d4a63]">Your account has been temporarily blocked for security reasons.<br />আপনার অ্যাকাউন্টটি নিরাপত্তার স্বার্থে সাময়িকভাবে ব্লক করা হয়েছে।</p>

        {/* Identity */}
        <div className="w-full rounded-md bg-[#fff4f5] border border-[#f7d4d9] p-2.5 flex items-center gap-3 text-left">
          <span className="rounded-full p-1 bg-white border border-[#f1c4cb] shrink-0"><Avatar name={name} photoUrl={photoUrl} className="size-16 rounded-full" /></span>
          <span className="flex flex-col gap-1 min-w-0 flex-1 text-[12px]">
            <span className="text-[#5b6784]">Name<b className="block text-[14px] text-[#16213a] truncate">{name || "N/A"}</b></span>
            <span className="text-[#5b6784]">Technician ID<b className="block text-[14px] text-[#16213a] truncate">{staffId || "N/A"}</b></span>
          </span>
          <span className="self-start shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#ffe3e7] text-[#c81f38] text-[12px] font-extrabold"><AlertCircle size={14} className="fill-[#e0243f] text-white" />Blocked</span>
        </div>

        {/* Reason */}
        <div className="w-full rounded-md bg-[#ffecee] border border-[#f7d4d9] p-2.5 flex items-start gap-3 text-left">
          <span className="size-10 rounded-full bg-[#e0243f] text-white flex items-center justify-center shrink-0 text-[20px] font-extrabold">!</span>
          <span className="flex flex-col gap-1 min-w-0">
            <b className="text-[15px] text-[#c81f38]">ব্লক হওয়ার কারণ</b>
            <span className="text-[12.5px] leading-relaxed text-[#3d4a63]">{reason || DEFAULT_REASON}</span>
            <a href={`tel:${care}`} className="text-[13.5px] font-extrabold text-[#c81f38]">বিস্তারিত জানতে {care}</a>
          </span>
        </div>

        {/* Call admin */}
        <a href={`tel:${care}`} className="w-full rounded-md bg-[linear-gradient(100deg,#0b2a66_0%,#1259c9_100%)] text-white px-3 py-2.5 flex items-center gap-3 shadow-[0_10px_24px_rgba(11,42,102,0.35)] active:scale-[0.99] transition-transform">
          <span className="size-12 rounded-full bg-[#1f7cf0] border-2 border-white/30 flex items-center justify-center shrink-0"><Phone size={22} /></span>
          <span className="flex flex-col flex-1 text-left leading-tight"><span className="text-[11px] font-bold tracking-wide text-white/85">CALL ADMIN NOW</span><span className="text-[clamp(20px,6.4vw,26px)] font-extrabold">{care}</span></span>
          <ChevronRight size={22} />
        </a>

        <div className="flex items-center gap-2 text-left text-[#5b6784]">
          <ShieldCheck size={26} className="text-[#5b6784] shrink-0" />
          <span className="leading-tight"><span className="block text-[13px] font-bold">Need Help?</span><span className="text-[11px]">Contact Admin for further assistance.</span></span>
        </div>
        {action}
      </div>
      <WaveFooter />
    </div>
  );
}

/**
 * (B) Blocked view shown on every in-app staff page (rendered by the /staff
 * layout when the logged-in staff account is blocked).
 */
export function StaffBlockedAppView({ name, staffId }: BlockedProps) {
  const care = contactDetails.customerCare;
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_60%,#e8f1ff_100%)] flex flex-col text-[#16213a]">
      <div className="w-full max-w-[480px] mx-auto px-2 pt-3">
        <div className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_10px_30px_rgba(11,61,145,0.10)]">
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

          <div className="px-3 pb-3 pt-2 flex flex-col items-center gap-2.5 text-center">
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#fff1f2] border border-[#f5b8c1] text-[#0b2a66] text-[clamp(17px,5.2vw,21px)] font-extrabold"><Lock size={18} className="text-[#e0243f]" />Account Blocked</span>
            <p className="text-[12.5px] leading-snug text-[#3d4a63]">Your account has been temporarily blocked for security reasons.<br /><span className="text-[#1f5fc9] font-semibold">আপনার অ্যাকাউন্টটি নিরাপত্তার স্বার্থে সাময়িকভাবে ব্লক করা হয়েছে।</span></p>

            <div className="w-full rounded-md bg-[#fff4f5] border border-[#f7d4d9] p-2.5 flex items-center gap-3 text-left">
              <span className="size-11 rounded-full bg-[#e0243f] text-white flex items-center justify-center shrink-0"><ShieldAlert size={22} /></span>
              <span className="w-px self-stretch bg-[#f1c4cb]" />
              <span className="flex flex-col gap-0.5 min-w-0 text-[13px]">
                <span className="truncate"><span className="text-[#5b6784]">Name: </span><b>{name || "N/A"}</b></span>
                <span className="truncate"><span className="text-[#5b6784]">Technician ID: </span><b>{staffId || "N/A"}</b></span>
              </span>
            </div>

            {/* Clears the blocked session, then lands on the staff login page */}
            <form action={staffLogout} className="w-full">
              <button type="submit" className="w-full h-12 rounded-md bg-[linear-gradient(100deg,#0b2a66_0%,#1259c9_100%)] text-white text-[14px] font-extrabold tracking-wide inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(11,42,102,0.30)] active:scale-[0.99] transition-transform">
                <LogIn size={18} />SIGN IN TO DASHBOARD<ChevronRight size={18} />
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
              <span className="flex flex-col leading-tight flex-1 min-w-0"><b className="text-[12.5px] text-[#0b2a66]">SE ELECTRONICS</b><span className="text-[11px] text-[#5b6784]">Authorized Staff Portal</span></span>
              <span className="w-px self-stretch bg-[#e3e8f1]" />
              <span className="text-[11.5px] font-semibold text-[#3d4a63] text-center shrink-0">&ldquo;নিরাপত্তাই আমাদের<br />অগ্রাধিকার&rdquo;</span>
            </div>
          </div>
        </div>
      </div>
      <WaveFooter spaced />
    </div>
  );
}
