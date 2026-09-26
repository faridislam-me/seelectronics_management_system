import { CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import { contactDetails } from "@/constants";
import { ArrowLeft, Bell, ChevronRight, Clock, ExternalLink, Headset, Home, LayoutGrid, Mail, Map, MapPin, Navigation, Phone, Store, User } from "lucide-react";
import Link from "next/link";

const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d53690.95025677962!2d91.86248830168407!3d24.935065499469935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z4Kas4Ka-4Kam4Ka-4KauIOCmrOCmvuCml-Cmv-CmmuCmviDgp6gg4Kao4KaCIOCmsOCni-CmoSDgprjgpr_gprLgp4fgpp8!5e1!3m2!1sen!2sau!4v1775048999006!5m2!1sen!2sau";
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactDetails.headOffice)}`;

export default function LocationPage() {
  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-24">
      {/* Light header */}
      <header className="bg-white px-2 py-2.5 flex items-center gap-2 border-b border-[#dfe6f2]">
        <Link href="/customer/profile" aria-label="Back" className="size-10 rounded-full bg-[#eef3fb] flex items-center justify-center"><ArrowLeft size={20} /></Link>
        <span className="text-[26px] font-extrabold italic tracking-[-1px] text-[#1f7cf0] leading-none">SE</span>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[17px] font-extrabold">SE Electronics</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">Service · Support · Solution</span>
        </span>
        <Link href="/customer/notifications" aria-label="Notifications" className="size-10 flex items-center justify-center relative"><Bell size={22} /><span className="absolute top-2 right-2 size-2 rounded-full bg-[#e5484d]" /></Link>
      </header>

      <main className="px-2 pt-2 flex flex-col gap-2.5 max-w-[640px] mx-auto">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-3 bottom-3 font-script text-[clamp(14px,4vw,18px)] leading-[1] text-right text-white/90 rotate-[-8deg]">Always<br />Near You</span>
          <MapPin size={64} className="absolute right-16 top-6 text-[#ff4d4f] drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]" fill="#ff4d4f" stroke="#fff" strokeWidth={1.5} />
          <span className="relative inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/15 border border-white/25 text-[12px] font-extrabold"><MapPin size={14} />Our Location</span>
          <h1 className="relative mt-2 text-[clamp(26px,8vw,34px)] font-extrabold leading-[1.05]">Visit Our<br /><span className="text-[#7fd1ff]">Office</span></h1>
          <span className="relative block mt-1 h-0.5 w-10 bg-[#7fd1ff]" />
          <p className="relative mt-2 text-[13px] leading-relaxed text-white/90 max-w-[62%]">We are always here to serve you. Find us at our office location or get directions easily.</p>
        </section>

        {/* Map */}
        <section className="relative rounded-md overflow-hidden border border-[#dfe6f2] h-[240px] bg-[#dfe6f2]">
          <iframe src={MAP_EMBED} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0" />
          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="absolute left-2 top-2 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white text-[#16213a] text-[12px] font-extrabold shadow-md"><MapPin size={14} className="text-[#ff4d4f]" />Open in Maps<ExternalLink size={12} /></a>
        </section>

        {/* Address */}
        <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-3 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
          <span className="size-14 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><MapPin size={26} /></span>
          <span className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-[#5b6784]">Our Address</span>
            <span className="text-[clamp(17px,5vw,20px)] font-extrabold leading-tight">Headquarters</span>
            <span className="text-[14px] font-semibold text-[#3d4a63]">{contactDetails.headOffice.trim()}</span>
          </span>
          <ChevronRight size={18} className="text-[#1f7cf0]" />
        </a>

        {/* Contact tiles */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-1.5">
            <span className="size-11 rounded-full bg-[#ffe9dc] text-[#f0542d] flex items-center justify-center"><Phone size={20} /></span>
            <span className="text-[11px] font-semibold text-[#5b6784]">Contact Numbers</span>
            <span className="text-[13px] font-extrabold tabular-nums leading-tight">{contactDetails.customerCare}<br />{contactDetails.phone}</span>
          </div>
          <a href={`mailto:${contactDetails.email}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-1.5">
            <span className="size-11 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center"><Mail size={20} /></span>
            <span className="text-[11px] font-semibold text-[#5b6784]">Email</span>
            <span className="text-[12px] font-extrabold text-[#1f7cf0] break-all leading-tight">{contactDetails.email}</span>
          </a>
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-1.5">
            <span className="size-11 rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center"><Clock size={20} /></span>
            <span className="text-[11px] font-semibold text-[#5b6784]">Business Hours</span>
            <span className="text-[12px] font-extrabold leading-tight">Saturday – Thursday<br /><span className="font-semibold text-[#5b6784]">9:00 AM – 8:00 PM</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="rounded-md bg-[#1f7cf0] text-white p-2.5 flex items-center gap-2.5 shadow-[0_8px_20px_rgba(31,124,240,0.35)]">
            <span className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Navigation size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">Get Directions</span><span className="text-[11px] text-white/85">Open in Google Maps</span></span>
            <ChevronRight size={16} />
          </a>
          <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="rounded-md bg-white border-2 border-[#1f7cf0] text-[#16213a] p-2.5 flex items-center gap-2.5">
            <span className="size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Map size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">View on Map</span><span className="text-[11px] text-[#5b6784]">Explore the location</span></span>
            <ChevronRight size={16} className="text-[#1f7cf0]" />
          </a>
        </div>

        {/* Come visit */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-3 flex items-center gap-3">
          <span className="size-12 rounded-full bg-white text-[#1f7cf0] flex items-center justify-center shrink-0"><Store size={24} /></span>
          <span className="flex flex-col min-w-0 flex-1"><span className="text-[14px] font-extrabold">Come Visit Us</span><span className="text-[12px] font-medium text-[#3d4a63] leading-snug">We welcome you to our office. Get the best service, support and help from our expert team.</span></span>
          <MapPin size={28} className="text-[#7fb4ff] shrink-0" />
        </div>
      </main>

      <CustomerAppNav active="/location" items={[
        { label: "Home", icon: Home, href: "/customer/profile" },
        { label: "Products", icon: LayoutGrid, href: "/customer/profile" },
        { label: "Location", icon: MapPin, href: "/location" },
        { label: "Support", icon: Headset, href: "/customer/support" },
        { label: "Profile", icon: User, href: "/customer/profile" },
      ]} />
    </div>
  );
}
