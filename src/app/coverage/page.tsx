import { CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import { AlertCircle, Anchor, Bell, Building2, ClipboardList, Home, Leaf, LucideIcon, MapPin, Menu, Mountain, Palmtree, Search, Ship, Sprout, Truck, User } from "lucide-react";
import Link from "next/link";

const divisions: { name: string; regions: string[]; icon: LucideIcon; tile: string; chip: string }[] = [
  { name: "Sylhet", icon: MapPin, tile: "bg-[#d4f3e0] text-[#1a9c4b]", chip: "bg-[#e9f9ef] text-[#178a42]", regions: ["সিলেট", "সুনামগঞ্জ", "মৌলভীবাজার", "হবিগঞ্জ"] },
  { name: "Dhaka", icon: Building2, tile: "bg-[#d6e7ff] text-[#1f7cf0]", chip: "bg-[#e8f1ff] text-[#1b6fd6]", regions: ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "টাঙ্গাইল", "কিশোরগঞ্জ", "নরসিংদী", "ফরিদপুর", "মাদারীপুর", "শরীয়তপুর", "গোপালগঞ্জ", "রাজবাড়ী"] },
  { name: "Chattogram", icon: Ship, tile: "bg-[#e6d6fb] text-[#8b3fe8]", chip: "bg-[#f3e9ff] text-[#7a35d2]", regions: ["চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "নোয়াখালী", "ফেনী", "লক্ষ্মীপুর", "রাঙ্গামাটি", "খাগড়াছড়ি", "বান্দরবান"] },
  { name: "Rajshahi", icon: Mountain, tile: "bg-[#ffe9b8] text-[#e0a11b]", chip: "bg-[#fff6e3] text-[#b8620b]", regions: ["রাজশাহী", "বগুড়া", "সিরাজগঞ্জ", "পাবনা", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "জয়পুরহাট"] },
  { name: "Khulna", icon: Anchor, tile: "bg-[#cdeff1] text-[#1aa5b0]", chip: "bg-[#e6f7f8] text-[#13929c]", regions: ["খুলনা", "যশোর", "সাতক্ষীরা", "কুষ্টিয়া", "ঝিনাইদহ", "বাগেরহাট", "চুয়াডাঙ্গা", "মাগুরা", "নড়াইল", "মেহেরপুর"] },
  { name: "Barishal", icon: Palmtree, tile: "bg-[#ffd6dc] text-[#e0243f]", chip: "bg-[#ffe9ec] text-[#c81f38]", regions: ["বরিশাল", "ভোলা", "পটুয়াখালী", "পিরোজপুর", "বরগুনা", "ঝালকাঠি"] },
  { name: "Rangpur", icon: Sprout, tile: "bg-[#e6d6fb] text-[#8b3fe8]", chip: "bg-[#f3e9ff] text-[#7a35d2]", regions: ["রংপুর", "দিনাজপুর", "কুড়িগ্রাম", "গাইবান্ধা", "নীলফামারী", "ঠাকুরগাঁও", "লালমনিরহাট", "পঞ্চগড়"] },
  { name: "Mymensingh", icon: Leaf, tile: "bg-[#d4f3e0] text-[#1a9c4b]", chip: "bg-[#e9f9ef] text-[#178a42]", regions: ["ময়মনসিংহ", "জামালপুর", "নেত্রকোনা", "শেরপুর"] },
];

export default function CoverageAreaPage() {
  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-24">
      <header className="bg-white px-2 py-2.5 flex items-center gap-2 border-b border-[#dfe6f2]">
        <Link href="/customer/profile" aria-label="Menu" className="size-10 flex items-center justify-center"><Menu size={22} /></Link>
        <span className="text-[26px] font-extrabold italic tracking-[-1px] text-[#1f7cf0] leading-none">SE</span>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[17px] font-extrabold">SE Electronics</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">Service · Support · Solution</span>
        </span>
        <Link href="/customer/services" aria-label="Search" className="size-10 flex items-center justify-center"><Search size={22} /></Link>
        <Link href="/customer/notifications" aria-label="Notifications" className="size-10 flex items-center justify-center relative"><Bell size={22} /><span className="absolute top-2 right-2 size-2 rounded-full bg-[#e5484d]" /></Link>
      </header>

      <main className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-3 bottom-3 font-script text-[clamp(13px,3.8vw,17px)] leading-[1] text-right text-white/90 rotate-[-8deg]">All Districts<br />Covered</span>
          <span className="absolute right-6 top-10 size-14 rounded-full bg-white text-[#1f7cf0] flex items-center justify-center font-extrabold italic text-lg shadow-[0_0_0_10px_rgba(255,255,255,0.15)]">SE</span>
          <span className="relative inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/15 border border-white/25 text-[12px] font-extrabold"><MapPin size={14} />Coverage Area</span>
          <h1 className="relative mt-2 text-[clamp(22px,6.6vw,30px)] font-extrabold leading-[1.1] max-w-[70%]">We are right where <span className="text-[#7fd1ff]">you need us!</span></h1>
          <p className="relative mt-2 text-[12.5px] leading-relaxed text-white/90">
            <b>SE Electronics</b> proudly offers technical <b>support</b>, maintenance, and expert <b>installation</b> services across all 64 districts in Bangladesh. Although our headquarters is in Sylhet, our dedicated network of electricians and technicians ensures that no matter where you are, top-tier service is just a request away.
          </p>
        </section>

        {/* Explore */}
        <div className="flex items-center gap-2 px-0.5 mt-1">
          <span className="size-9 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center"><MapPin size={18} /></span>
          <span className="flex flex-col leading-tight"><span className="text-[18px] font-extrabold">Explore Our Network</span><span className="text-[12px] font-semibold text-[#5b6784]">Select your division to see the districts</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {divisions.map((d, i) => {
            const shown = d.regions.slice(0, 5);
            const more = d.regions.length - shown.length;
            return (
              <div key={d.name} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`size-9 rounded-full ${d.tile} flex items-center justify-center shrink-0`}><d.icon size={18} /></span>
                  <span className="text-[13px] font-extrabold text-[#1f7cf0]">{i + 1}</span>
                  <span className="text-[12.5px] font-extrabold flex-1 min-w-0 leading-tight">{d.name}<br /><span className="text-[10.5px] font-semibold text-[#5b6784]">Division</span></span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {shown.map((r) => <span key={r} className={`px-1.5 h-6 rounded-md text-[10.5px] font-bold inline-flex items-center ${d.chip}`}>{r}</span>)}
                  {more > 0 && (
                    <details className="contents">
                      <summary className="list-none cursor-pointer px-1.5 h-6 rounded-md text-[10.5px] font-bold inline-flex items-center bg-[#eef3fb] text-[#5b6784]">+{more} জেলা</summary>
                      {d.regions.slice(5).map((r) => <span key={r} className={`px-1.5 h-6 rounded-md text-[10.5px] font-bold inline-flex items-center ${d.chip}`}>{r}</span>)}
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notice */}
        <div className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-3 flex items-start gap-3">
          <span className="size-9 rounded-full bg-[#e0a11b] text-white flex items-center justify-center shrink-0"><AlertCircle size={18} /></span>
          <span className="flex flex-col min-w-0 flex-1"><span className="text-[14px] font-extrabold text-[#c0392b]">Notice For Remote Areas</span><span className="text-[12px] font-medium text-[#5a3b00] leading-relaxed">Please note that travel and accommodation charges may apply for technicians traveling outside Sylhet City depending on the nature of the package and urgency. These details will be confirmed prior to finalizing the request.</span></span>
          <Truck size={30} className="text-[#1f7cf0] shrink-0 mt-2" />
        </div>
      </main>

      <CustomerAppNav active="/coverage" items={[
        { label: "Home", icon: Home, href: "/customer/profile" },
        { label: "Coverage Area", icon: MapPin, href: "/coverage" },
        { label: "Service Request", icon: ClipboardList, href: "/get-service" },
        { label: "Profile", icon: User, href: "/customer/profile" },
      ]} />
    </div>
  );
}
