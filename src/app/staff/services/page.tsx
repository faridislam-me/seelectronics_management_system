import { verifyStaffSession } from "@/actions";
import { getMyServices, getStaffProfileStats } from "@/actions/staffActions";
import StaffDashboardActions from "@/components/features/staff/StaffDashboardActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import clsx from "clsx";
import { Calendar, CheckCircle2, Clock, FileText, Hash, HandCoins, Navigation, User, Wrench, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PRODUCT_IMAGES: Record<string, string> = {
  ips: "/products/ips.jpg",
  battery: "/products/battery.jpg",
  stabilizer: "/products/stabilizer.jpg",
  others: "/products/others.jpg",
};

export default async function StaffServicesPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const [statsRes, servicesRes] = await Promise.all([
    getStaffProfileStats(userId),
    getMyServices(userId),
  ]);

  const stats = statsRes.success ? statsRes.data : null;
  const services = servicesRes.success ? (servicesRes.data ?? []) : [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]",
      in_progress: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]",
      completed: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]",
      canceled: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]",
      staff_departed: "bg-[#f3e9ff] text-[#7a3fd0] border-[#e2cffb]",
      staff_arrived: "bg-[#ecebff] text-[#4b3fd0] border-[#d6d3fb]",
      appointment_retry: "bg-[#fff0e6] text-[#d9480f] border-[#ffd9bf]",
      service_center: "bg-[#e3f8fb] text-[#0e7c8c] border-[#bdeaf1]",
    };
    return colors[status] || "bg-[#f1f3f7] text-[#5b6784] border-[#e3e8f1]";
  };

  const statusIcon = (status: string) =>
    status === "completed" ? CheckCircle2 : status === "canceled" ? XCircle : Clock;

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="px-2 pt-2 pb-2 flex flex-col gap-2.5 text-[#16213a]">
        {/* Title */}
        <section className="rounded-md bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(10,47,112,0.28)]">
          <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wrench size={24} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[clamp(17px,5vw,20px)] font-extrabold">My Assigned Services</span>
            <span className="text-[12px] font-semibold text-white/85">আপনার সকল সার্ভিসের তালিকা</span>
          </span>
          <span className="shrink-0 rounded-md bg-white/15 border border-white/25 px-2.5 py-1 text-center leading-tight">
            <span className="block text-[18px] font-extrabold">{services.length}</span>
            <span className="block text-[10px] font-bold text-white/85">Services</span>
          </span>
        </section>

        {services.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-1.5">
            <Wrench size={40} className="text-[#c9d3e6]" />
            <p className="text-[15px] font-extrabold text-[#3d4a63]">No services assigned yet.</p>
            <p className="text-[12px] font-medium text-[#9aa4b8]">When you get assigned a service, it will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((service: any) => {
              const currentStatus = service.statusHistory?.[0]?.status || "pending";

              // For staff view, show "canceled" when status is "appointment_retry"
              const displayStatus = currentStatus === "appointment_retry" ? "canceled" : currentStatus;
              const StatusIcon = statusIcon(displayStatus);
              const img = PRODUCT_IMAGES[service.productType as string] ?? PRODUCT_IMAGES.others;
              const canReport =
                currentStatus !== "completed" && currentStatus !== "canceled" && currentStatus !== "appointment_retry";

              return (
                <article key={service.serviceId} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 min-w-0 text-[11.5px] font-bold text-[#5b6784]">
                      <Hash size={13} className="text-[#1f7cf0] shrink-0" />
                      <span className="shrink-0">SERVICE ID:</span>
                      <span className="font-mono text-[#16213a] truncate">#{service.serviceId}</span>
                    </span>
                    <span className={clsx("shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[10.5px] font-extrabold uppercase tracking-wide whitespace-nowrap", getStatusColor(displayStatus))}>
                      <StatusIcon size={12} strokeWidth={2.6} />
                      {displayStatus.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="relative size-14 rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
                      <Image src={img} alt={service.productType} fill sizes="56px" className="object-contain p-1" />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5 min-w-0"><User size={14} className="text-[#1f5fc9] shrink-0" /><span className="text-[15px] font-extrabold truncate">{service.customerName}</span></span>
                      <span className="text-[12px] font-semibold text-[#5b6784] uppercase tracking-tight break-words">{service.productType} • {service.productModel}</span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5b6784]">
                        <Calendar size={12} className="text-[#1f7cf0]" />
                        <span className="uppercase text-[10px] font-bold text-[#9aa4b8]">Created On</span>
                        <b className="text-[#3d4a63]">{new Date(service.createdAt).toLocaleDateString()}</b>
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[#eef1f6] pt-2">
                    {canReport && (
                      <Link href={`/service-report?serviceId=${service.serviceId}`} className="h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform">
                        <FileText size={15} />Send Report
                      </Link>
                    )}
                    {currentStatus === "completed" && (
                      <StaffDashboardActions
                        staffId={userId}
                        serviceId={service.serviceId}
                        className="h-10 rounded-md bg-[#1a9c4b] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                      >
                        <HandCoins size={15} />Request Payment
                      </StaffDashboardActions>
                    )}
                    <Link
                      href={`/service-track?trackingId=${service.serviceId}`}
                      className={clsx(
                        "h-10 rounded-md bg-[#1f7cf0] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform",
                        !canReport && currentStatus !== "completed" && "col-span-2",
                      )}
                    >
                      <Navigation size={15} />Track Status
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
