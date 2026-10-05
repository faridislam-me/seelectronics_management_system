import { verifyStaffSession } from "@/actions";
import { getStaffPaymentHistory } from "@/actions/paymentRequestActions";
import { getMyServices, getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Box, CheckCircle, ChevronRight, Clock, Hash, History, MapPin, Phone, Settings, TrendingUp, Truck, User, XCircle } from "lucide-react";

export default async function StaffTrackingPage() {
  const session = await verifyStaffSession();
  if (!session?.isAuth) return null;

  const userId = session.userId as string;

  const [statsRes, servicesRes, paymentsRes] = await Promise.all([
    getStaffProfileStats(userId),
    getMyServices(userId),
    getStaffPaymentHistory(userId),
  ]);

  const stats = statsRes.success ? statsRes.data : null;
  const services = servicesRes.success ? (servicesRes.data ?? []) : [];
  const paymentsList = paymentsRes.success ? (paymentsRes.data ?? []) : [];

  const totalEarnings = paymentsList
    .filter((p: any) => p.status === "completed")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const pendingEarnings = paymentsList
    .filter((p: any) => p.status === "pending" || p.status === "processing")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // One colour per status (same palette as the staff services list); "appointment_retry" means the staff cancelled.
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return { cls: "bg-[#1a9c4b] text-white", Icon: CheckCircle, label: "COMPLETED" };
      case "canceled":
      case "appointment_retry":
        return { cls: "bg-[#e0243f] text-white", Icon: XCircle, label: "CANCELED" };
      case "pending":
        return { cls: "bg-[#f08a1c] text-white", Icon: Clock, label: "PENDING" };
      case "processing":
      case "in_progress":
        return { cls: "bg-[#1f7cf0] text-white", Icon: Clock, label: "IN PROGRESS" };
      case "staff_departed":
        return { cls: "bg-[#7a3fd0] text-white", Icon: Clock, label: "ON THE WAY" };
      case "staff_arrived":
        return { cls: "bg-[#4b3fd0] text-white", Icon: Clock, label: "ARRIVED" };
      case "service_center":
      case "service_center_received":
        return { cls: "bg-[#0e7c8c] text-white", Icon: Clock, label: "SERVICE CENTER" };
      default:
        return { cls: "bg-[#8a94a8] text-white", Icon: Clock, label: status.replace(/_/g, " ").toUpperCase() };
    }
  };

  const tiles = [
    { label: "TOTAL EARNED", value: `৳${totalEarnings.toLocaleString()}`, Icon: TrendingUp, href: "/staff/payment/payment-history", box: "bg-[#effaf3] border-[#c9ecd6]", icon: "bg-[#d7f3e2] text-[#1a9c4b]", chev: "text-[#1a9c4b]" },
    { label: "PENDING", value: `৳${pendingEarnings.toLocaleString()}`, Icon: Clock, href: "/staff/payment/payment-history", box: "bg-[#fff8ee] border-[#f7dfbd]", icon: "bg-[#ffe9cc] text-[#f08a1c]", chev: "text-[#f08a1c]" },
    { label: "COMPLETED", value: String(stats?.completedServices || 0), Icon: CheckCircle, href: "#service-history", box: "bg-[#f1f6ff] border-[#cfe0fb]", icon: "bg-[#dbe8ff] text-[#1f7cf0]", chev: "text-[#1f7cf0]" },
    { label: "CANCELLED", value: String(stats?.canceledServices || 0), Icon: XCircle, href: "#service-history", box: "bg-[#fff2f4] border-[#f7cdd4]", icon: "bg-[#ffdde2] text-[#e0243f]", chev: "text-[#e0243f]" },
  ];

  const rows = (service: any) => [
    { Icon: Hash, label: "Service ID:", value: service.serviceId, tint: "bg-[#e8f1ff] text-[#1f7cf0]" },
    { Icon: User, label: "Customer:", value: service.customerName, tint: "bg-[#efeaff] text-[#6b4de6]" },
    { Icon: Phone, label: "Phone:", value: service.customerPhone, tint: "bg-[#e6f8ee] text-[#1a9c4b]", phone: true },
    { Icon: Box, label: "Product:", value: service.productModel || service.productType, tint: "bg-[#e8f1ff] text-[#1f7cf0]" },
  ];

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="w-full max-w-7xl mx-auto px-2 pt-2 pb-2 flex flex-col gap-2.5 text-[#16213a]">
        {/* Title */}
        <div className="relative flex items-center gap-2.5 min-h-[72px] pr-[34%]">
          <Link href="/staff/profile" aria-label="Back" className="size-10 rounded-md bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">Tracking &amp; History</span>
            <span className="text-[11.5px] font-medium text-[#5b6784]">Your service request and tracking history</span>
          </span>
          {/* van illustration */}
          <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 w-[32%] h-[68px] rounded-md bg-[radial-gradient(90%_90%_at_60%_40%,#dbe8ff_0%,#eef4ff_70%,transparent_100%)] flex items-end justify-center pb-1.5">
            <MapPin size={20} className="absolute right-3 top-0.5 text-[#1f7cf0] fill-[#cfe0fb]" />
            <span className="relative flex items-center justify-center size-14 rounded-md bg-[#1f7cf0] text-white shadow-[0_6px_14px_rgba(31,124,240,0.35)]"><Truck size={32} strokeWidth={1.8} /></span>
          </span>
        </div>

        {/* Stats: icon, value and label centered */}
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className={clsx("relative rounded-md border p-2.5 flex flex-col items-center justify-center text-center gap-1", t.box)}>
              <span className={clsx("size-10 rounded-full flex items-center justify-center", t.icon)}><t.Icon size={20} /></span>
              <span className="text-[clamp(20px,6vw,24px)] font-extrabold leading-none mt-0.5">{t.value}</span>
              <span className="text-[11.5px] font-semibold tracking-wide text-[#5b6784]">{t.label}</span>
              <ChevronRight size={18} className={clsx("absolute right-1.5 top-1/2 -translate-y-1/2", t.chev)} />
            </Link>
          ))}
        </div>

        {/* Service History */}
        <div id="service-history" className="scroll-mt-4 flex items-center gap-2.5 mt-1">
          <span className="size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><History size={20} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-[16px] font-extrabold">Service History</span>
            <span className="text-[11.5px] font-medium text-[#5b6784]">Your recent service requests</span>
          </span>
        </div>

        <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
          {services.map((service: any) => {
            const status = service.statusHistory?.[0]?.status || "processing";
            const st = getStatusStyle(status);
            return (
              <article key={service.id} className="relative rounded-md bg-white border border-[#dfe6f2] p-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-2">
                <span className={clsx("absolute top-2.5 right-2.5 inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10.5px] font-extrabold", st.cls)}><st.Icon size={13} />{st.label}</span>
                {rows(service).map((r) => (
                  <div key={r.label} className="flex items-center gap-2.5 min-w-0">
                    <span className={clsx("size-9 rounded-md flex items-center justify-center shrink-0", r.tint)}><r.Icon size={17} /></span>
                    <span className="flex flex-col leading-tight min-w-0">
                      <span className="text-[11px] font-medium text-[#5b6784]">{r.label}</span>
                      <span className="text-[13.5px] font-bold truncate">{r.value}</span>
                    </span>
                    {r.phone && (
                      <a href={`tel:+88${service.customerPhone}`} className="ml-1 shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#e8f1ff] text-[#1f7cf0] text-[11.5px] font-bold"><Phone size={13} />Call Now</a>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-[#eef1f6] pt-2">
                  <Link href={`/service-track?trackingId=${service.serviceId}`} className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-[#1f7cf0]">
                    <MapPin size={16} />TRACKING<ArrowUpRight size={15} />
                  </Link>
                  <span className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-[#9ab4df]" />
                    <span className="size-8 rounded-md bg-[#f1f5fb] text-[#5b6784] flex items-center justify-center"><Settings size={16} /></span>
                  </span>
                </div>
              </article>
            );
          })}

          {services.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">No service history found</p>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
