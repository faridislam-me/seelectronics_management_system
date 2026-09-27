import { getServiceById } from "@/actions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { formatDate } from "@/utils";
import { warrantyDurationByType } from "@/constants";
import { CustomerAppHeader, CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import clsx from "clsx";
import {
  AlertTriangle, Box, Calendar, CardSim, CheckCircle2, ChevronRight, ClipboardList, Clock, CreditCard, FileText, History,
  Home, MapPin, MessageSquare, Phone, Settings, ShieldCheck, Store, User, Wrench, XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const PRODUCT_IMAGES: Record<string, string> = {
  ips: "/products/ips.jpg",
  battery: "/products/battery.jpg",
  stabilizer: "/products/stabilizer.jpg",
  others: "/products/others.jpg",
};

function InfoRow({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[13px] font-semibold text-[#16213a] leading-snug">
      <Icon size={16} className="text-[#0b3d91] shrink-0 mt-0.5" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function CardHead({ icon: Icon, title, subtitle, tone = "blue" }: { icon: typeof User; title: string; subtitle: string; tone?: "blue" | "red" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={clsx("size-11 rounded-full text-white flex items-center justify-center shrink-0", tone === "red" ? "bg-[#e0243f]" : "bg-[#0b3d91]")}><Icon size={22} /></span>
      <span className="flex flex-col leading-tight min-w-0">
        <span className={clsx("text-[15.5px] font-extrabold", tone === "red" ? "text-[#e0243f]" : "text-[#0b3d91]")}>{title}</span>
        <span className="text-[12px] font-semibold text-[#5b6784]">{subtitle}</span>
      </span>
    </div>
  );
}

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const response = await getServiceById(id);
  if (!response.success) {
    if (response.message === "Service not found") notFound();
    return (
      <div className="p-2">
        <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">{response.message}</div>
      </div>
    );
  }

  const service = response.data;
  if (!service) notFound();

  const latestStatus = service.statusHistory[service.statusHistory.length - 1]?.status as string | undefined;
  const createdDate = new Date(service.createdAt);
  const isInstall = service.type === "install";

  // Warranty duration based on product type
  const warrantyMonths = warrantyDurationByType[service.productType] || 24;
  const expireDate = new Date(createdDate);
  expireDate.setMonth(expireDate.getMonth() + warrantyMonths);
  const isWarrantyExpired = new Date() > expireDate;

  const st = (latestStatus || "").toLowerCase();
  const done = st === "completed";
  const canceled = st === "canceled" || st === "cancelled";
  const StatusIcon = done ? CheckCircle2 : canceled ? XCircle : Clock;
  const statusCls = done ? "bg-[#e9f9ef] text-[#178a42]" : canceled ? "bg-[#ffe9ec] text-[#c81f38]" : "bg-[#fff6e3] text-[#b8620b]";
  const productImg = PRODUCT_IMAGES[service.productType as string] ?? PRODUCT_IMAGES.others;
  const card = "rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]";

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-12">
      <CustomerAppHeader backHref="/customer/services" title="Service Details" subtitle="Service History & Status" />

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5 max-w-3xl mx-auto">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(10,47,112,0.3)]">
          <span className="absolute -right-10 -top-12 size-40 rounded-full bg-white/10" />
          <span className="relative size-14 rounded-full bg-white text-[#0b3d91] flex items-center justify-center shrink-0"><FileText size={28} /></span>
          <span className="relative flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">Service Details</span>
            <span className="text-[12.5px] font-semibold text-white/90">আপনার সার্ভিসের তথ্য ও বর্তমান অবস্থা দেখুন</span>
          </span>
          <ChevronRight size={22} className="relative shrink-0" />
        </section>

        {/* Service header */}
        <section className={clsx(card, "flex flex-col gap-2.5")}>
          <div className="flex items-start gap-2.5">
            <span className="relative size-14 rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
              <Image src={productImg} alt={service.productType} fill sizes="56px" className="object-contain p-0.5" />
            </span>
            <span className="flex flex-col gap-1.5 min-w-0 flex-1">
              <span className="text-[15px] font-extrabold break-all">Service ID # {service.serviceId}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                {latestStatus && (
                  <span className={clsx("inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-extrabold capitalize", statusCls)}><StatusIcon size={14} strokeWidth={2.6} />{latestStatus}</span>
                )}
                <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#e9f9ef] text-[#178a42] text-[12px] font-extrabold"><CreditCard size={14} />Paid</span>
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e3e8f1] rounded-md bg-[#f5f8fd] border border-[#eef1f6]">
            <span className="flex items-center gap-2 p-2">
              <span className="size-9 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><Calendar size={17} /></span>
              <span className="flex flex-col leading-tight"><span className="text-[11px] font-semibold text-[#5b6784]">সার্ভিসের তারিখ:</span><b className="text-[13px]">{formatDate(service.createdAt!)}</b></span>
            </span>
            <span className="flex items-center gap-2 p-2">
              <span className="size-9 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><CreditCard size={17} /></span>
              <span className="flex flex-col leading-tight gap-0.5"><span className="text-[11px] font-semibold text-[#5b6784]">পেমেন্ট:</span><span className="self-start px-2 h-6 rounded-md bg-[#e9f9ef] text-[#178a42] text-[12px] font-extrabold inline-flex items-center">Paid</span></span>
            </span>
          </div>
        </section>

        {/* Warranty */}
        <Link href="/check-warranty" className={clsx(card, "flex items-center gap-2.5 bg-[#f7faff]")}>
          <span className="size-11 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shrink-0"><ShieldCheck size={22} /></span>
          <span className="flex flex-col leading-tight flex-1 min-w-0">
            <span className="text-[15.5px] font-extrabold">Warranty</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">ওয়ারেন্টি তথ্য দেখুন</span>
          </span>
          <span className={clsx("inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12.5px] font-extrabold", isWarrantyExpired ? "bg-[#ffe9ec] text-[#c81f38]" : "bg-[#e9f9ef] text-[#178a42]")}>
            {isWarrantyExpired ? <XCircle size={15} /> : <CheckCircle2 size={15} />}{isWarrantyExpired ? "Expired" : "Valid"}
          </span>
          <ChevronRight size={18} className="text-[#0b3d91] shrink-0" />
        </Link>

        {/* Customer info */}
        <section className={clsx(card, "flex flex-col gap-2.5")}>
          <CardHead icon={User} title="Customer Information" subtitle="গ্রাহকের বিস্তারিত তথ্য" />
          <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
            <div className="flex flex-col gap-2 min-w-0">
              <InfoRow icon={User}>{service.customerName}</InfoRow>
              <InfoRow icon={CardSim}>Customer ID: {service.customerId}</InfoRow>
              <InfoRow icon={Phone}>{service.customerPhone}</InfoRow>
              <InfoRow icon={Settings}>{isInstall ? "Install : house wiring" : `Product : ${service.productModel}`}</InfoRow>
              <InfoRow icon={MapPin}>{service.customerAddress}</InfoRow>
              <InfoRow icon={Box}>Product Model {service.productModel}</InfoRow>
            </div>
            <div className={clsx("rounded-md border p-2 flex flex-col items-center text-center gap-1 w-[112px]", isWarrantyExpired ? "bg-[#fff1f3] border-[#f7c3ca]" : "bg-[#eef4fd] border-[#dfe8f7]")}>
              <Calendar size={20} className={isWarrantyExpired ? "text-[#c81f38]" : "text-[#0b3d91]"} />
              <span className="text-[11px] font-semibold text-[#5b6784] leading-tight">ওয়ারেন্টি শেষ হবে:</span>
              <b className={clsx("text-[14px]", isWarrantyExpired ? "text-[#c81f38]" : "text-[#0b3d91]")}>{expireDate.toLocaleDateString()}</b>
            </div>
          </div>
        </section>

        {/* Technician */}
        {service.appointedStaff && (
          <section className={clsx(card, "flex flex-col gap-2.5")}>
            <CardHead icon={Wrench} title={isInstall ? "Electrician Information" : "Technician Information"} subtitle={isInstall ? "সার্ভিস ইলেকট্রিশিয়ানের তথ্য" : "সার্ভিস টেকনিশিয়ানের তথ্য"} />
            <div className="flex flex-col gap-2 pl-1">
              <InfoRow icon={User}>{service.appointedStaff.name}</InfoRow>
              <InfoRow icon={CardSim}>{isInstall ? `Electrician ID : ${service.staffId}` : `Technician ID : ${service.staffId}`}</InfoRow>
              <InfoRow icon={Phone}><a href={`tel:${service.appointedStaff.phone}`}>{service.appointedStaff.phone}</a></InfoRow>
              <InfoRow icon={MapPin}>Service Area: {service.customerAddress}</InfoRow>
            </div>
          </section>
        )}

        {/* Service center */}
        <section className={clsx(card, "flex flex-col gap-2.5")}>
          <CardHead icon={Store} title="Current Servicing Center" subtitle="আপনার নিকটস্থ সার্ভিস সেন্টার" />
          <div className="flex flex-col gap-2 pl-1">
            <InfoRow icon={MapPin}>{service.customerAddress}</InfoRow>
            <InfoRow icon={Phone}><a href={`tel:${service.customerPhone}`}>Call: {service.customerPhone}</a></InfoRow>
          </div>
        </section>

        {/* Complaint */}
        <section className="rounded-md bg-[#fff5f6] border border-[#f7c3ca] p-3 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <CardHead icon={AlertTriangle} title="অভিযোগ" subtitle={`Complaining ID# ${service.serviceId}`} tone="red" />
            <Link href="/customer/complain/new" className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold"><MessageSquare size={15} />New Complain<ChevronRight size={14} /></Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md bg-white border border-[#f7d9dd] px-2.5 py-2 text-[12px] font-semibold text-[#3d4a63]">
            <span className="inline-flex items-center gap-1.5"><Wrench size={14} className="text-[#0b3d91]" />Service: {service.productType.toUpperCase()}</span>
            {service.appointedStaff?.name && <span className="inline-flex items-center gap-1.5"><User size={14} className="text-[#0b3d91]" />{service.appointedStaff.name}</span>}
            <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-[#0b3d91]" />{formatDate(service.createdAt!)}</span>
          </div>
        </section>
      </main>

      <CustomerAppNav active="/customer/services" items={[
        { label: "হোম", icon: Home, href: "/customer/profile" },
        { label: "সার্ভিস রিকোয়েস্ট", icon: ClipboardList, href: "/get-service" },
        { label: "হিস্টোরি", icon: History, href: "/customer/services" },
        { label: "প্রোফাইল", icon: User, href: "/customer/profile" },
      ]} />
    </div>
  );
}
