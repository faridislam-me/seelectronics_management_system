import { verifyCustomerSession } from "@/actions/customerActions";
import { getServiceHistoryById } from "@/actions/serviceActions";
import { CustomerAppHeader, CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import { AppError } from "@/utils";
import clsx from "clsx";
import {
  BatteryCharging, Calendar, CheckCircle2, ChevronRight, ClipboardList, Clock, FileText, Headset, History, Home, Info, ListChecks, Navigation, Plus, Settings, User, Wrench, XCircle, Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerServicesPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const { customer } = session;
  const servicesRes = await getServiceHistoryById(customer.customerId);
  if (!servicesRes.success) throw new AppError("Failed to load services");
  const services = servicesRes.data || [];

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-24">
      <CustomerAppHeader backHref="/customer/profile" title="My Services" subtitle="Service History & Status" />

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5">
        {/* Support banner */}
        <section className="rounded-md bg-[linear-gradient(100deg,#dbe7fb_0%,#e9f0fc_100%)] border border-[#c9d9f5] p-3 flex items-center gap-3 shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
          <span className="size-14 rounded-md bg-white/70 text-[#1f7cf0] flex items-center justify-center shrink-0"><Headset size={32} strokeWidth={2} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[clamp(15px,4.4vw,18px)] font-extrabold">কোনো সমস্যা?<br />সাপোর্ট প্রয়োজন?</span>
            <span className="text-[12px] font-semibold text-[#3d4a63] mt-0.5">আজই একটি নতুন রিকোয়েস্ট পাঠান</span>
          </span>
          <Link href="/get-service" className="shrink-0 inline-flex items-center gap-1 h-10 px-3 rounded-md bg-[#1f7cf0] text-white text-[12px] font-extrabold shadow-[0_6px_14px_rgba(31,124,240,0.35)]">
            <Plus size={15} strokeWidth={3} />নতুন রিকোয়েস্ট<ChevronRight size={14} />
          </Link>
        </section>

        {/* List header */}
        <div className="flex items-center justify-between px-0.5 mt-1">
          <span className="flex items-center gap-2">
            <span className="size-9 rounded-md bg-[#1f7cf0] text-white flex items-center justify-center"><ListChecks size={18} /></span>
            <span className="text-[17px] font-extrabold">Recent Requests</span>
          </span>
          <span className="px-2.5 h-8 rounded-md bg-white border border-[#dfe6f2] text-[12px] font-bold text-[#5b6784] inline-flex items-center">{services.length} Record(s)</span>
        </div>

        {services.length === 0 ? (
          <div className="rounded-md bg-white border border-[#dfe6f2] p-8 text-center flex flex-col items-center gap-3">
            <span className="size-16 rounded-full bg-[#eef3fb] text-[#9aa4b8] flex items-center justify-center"><Settings size={32} /></span>
            <span className="text-[16px] font-extrabold">No Records Found</span>
            <span className="text-[13px] text-[#5b6784] font-medium">আপনি এখনো কোনো সার্ভিস রিকোয়েস্ট করেননি।</span>
          </div>
        ) : (
          services.map((service) => {
            const status = service.statusHistory?.[0]?.status || "pending";
            const done = status === "completed";
            const canceled = status === "canceled";
            const StatusIcon = done ? CheckCircle2 : canceled ? XCircle : Clock;
            const statusCls = done ? "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" : canceled ? "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]" : "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]";
            const statusLabel = done ? "COMPLETED" : canceled ? "CANCELED" : "PROCESSING";
            const isInstall = service.type === "install";
            const ProductIcon = service.productType === "battery" ? BatteryCharging : Zap;
            const date = new Date(service.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }).toUpperCase();

            return (
              <article key={service.id} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-3 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
                <div className="flex items-start gap-3">
                  <span className="size-12 rounded-md bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0">{isInstall ? <Zap size={24} /> : <Wrench size={24} />}</span>
                  <span className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="self-start px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-extrabold tracking-wide inline-flex items-center">{isInstall ? "INSTALLATION" : "MAINTENANCE"}</span>
                    <span className="text-[16px] font-extrabold leading-none">{service.productType}</span>
                  </span>
                  <span className={clsx("shrink-0 inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border text-[11px] font-extrabold tracking-wide", statusCls)}><StatusIcon size={14} strokeWidth={2.6} />{statusLabel}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="size-[76px] rounded-md bg-[#f5f7fb] border border-[#e6ebf4] text-[#0b3d91] flex items-center justify-center shrink-0"><ProductIcon size={34} strokeWidth={1.8} /></span>
                  <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-[clamp(13px,3.8vw,15px)] font-extrabold leading-tight">{service.productModel}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#5b6784]">
                      <span className="inline-flex items-center gap-1"><Info size={13} className="text-[#1f7cf0]" />ID : {service.serviceId}</span>
                      <span className="inline-flex items-center gap-1"><Calendar size={13} className="text-[#1f7cf0]" />{date}</span>
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/customer/services/${service.serviceId}`} className="h-11 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3">
                    <span className="inline-flex items-center gap-2"><FileText size={17} />DETAILS</span><ChevronRight size={16} />
                  </Link>
                  <Link href={`/service-track?trackingId=${service.serviceId}`} className="h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3 shadow-[0_6px_14px_rgba(11,61,145,0.3)]">
                    <span className="inline-flex items-center gap-2"><Navigation size={17} />TRACK</span><ChevronRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })
        )}

        <div className="flex items-center justify-center gap-3 mt-3 text-[11px] font-bold tracking-[2px] text-[#5b6784]">
          <span className="h-px w-10 bg-[#c9d3e6]" />SE ELECTRONICS PORTAL V6.0<span className="h-px w-10 bg-[#c9d3e6]" />
        </div>
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
