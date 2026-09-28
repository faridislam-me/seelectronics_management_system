import { getServiceById, verifyStaffSession } from "@/actions"
import { getStaffProfileStats } from "@/actions/staffActions"
import ServiceReport from "@/components/features/services/ServiceReport"
import { StaffLayout } from "@/components/layout/StaffLayout"
import { AppError } from "@/utils"
import clsx from "clsx"
import { notFound } from "next/navigation"
import { ArrowLeft, Check, CheckCircle2, Headset, Phone, Send, XCircle, Wrench } from "lucide-react"
import { contactDetails } from "@/constants"
import Link from "next/link"

export default async function ServiceReportPage({ searchParams }: { searchParams: Promise<{ serviceId: string }> }) {
    const params = await searchParams

    if (!params.serviceId) {
        notFound()
    }

    const session = await verifyStaffSession();
    const userId = session.isAuth ? (session.userId as string) : null;

    const [serviceRes, statsRes] = await Promise.all([
        getServiceById(params.serviceId),
        userId ? getStaffProfileStats(userId) : Promise.resolve({ success: false, data: null })
    ]);

    if (!serviceRes.success || !serviceRes.data) {
        throw new AppError("সার্ভিস আইডিটি সঠিক নয়।")
    }

    const serviceData = serviceRes.data
    const stats = statsRes.success ? statsRes.data : null
    const statusHistory = serviceData.statusHistory[serviceData.statusHistory.length - 1]!
    const statusArray = serviceData.statusHistory.map(status => status.status)

    if (statusHistory.status === 'completed' || statusHistory.status === 'canceled') {
        const isDone = statusHistory.status === 'completed';
        const tone = isDone
            ? { ring: "from-[#34d36b] to-[#16a34a]", ray: "bg-[#22c55e]", box: "bg-[#f0fbf4] border-[#bfe8cd]", dot: "bg-[#16a34a]" }
            : { ring: "from-[#f87171] to-[#dc2626]", ray: "bg-[#ef4444]", box: "bg-[#fff4f5] border-[#f7c3ca]", dot: "bg-[#dc2626]" };
        const content = (
            <div className="relative min-h-[calc(100vh-120px)] bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_55%,#eaf2ff_100%)] overflow-hidden">
                <svg aria-hidden className="absolute inset-x-0 bottom-0 w-full h-16" viewBox="0 0 400 64" preserveAspectRatio="none">
                    <path d="M0 30 C 80 6, 160 50, 250 30 C 320 14, 370 18, 400 8 V64 H0 Z" fill="#cfe0fb" />
                    <path d="M0 44 C 90 20, 170 64, 260 44 C 330 30, 372 36, 400 26 V64 H0 Z" fill="#1f7cf0" opacity=".85" />
                </svg>
                <div className="relative mx-auto max-w-[440px] px-3 pt-3 pb-20">
                    <div className="rounded-[18px] bg-white/95 border border-[#dfe8f7] shadow-[0_12px_32px_rgba(11,61,145,0.10)] overflow-hidden">
                        <div className="relative h-[168px] bg-[linear-gradient(180deg,#e3edff_0%,#f3f7ff_100%)] flex items-end justify-center overflow-hidden">
                            <span aria-hidden className="absolute -left-10 top-8 w-56 h-24 rounded-[50%] bg-white/60" />
                            <span aria-hidden className="absolute -right-12 top-2 w-48 h-28 rounded-[50%] bg-[#d6e5fd]/70" />
                            <div className="relative mb-3 flex flex-col items-center">
                                <div className="relative size-[104px] flex items-center justify-center">
                                    {["-left-7 top-6 rotate-[35deg]", "-left-9 top-[46px]", "-left-7 bottom-5 -rotate-[35deg]", "-right-7 top-6 -rotate-[35deg]", "-right-9 top-[46px]", "-right-7 bottom-5 rotate-[35deg]"].map((c) => (
                                        <span key={c} className={clsx("absolute h-1.5 w-5 rounded-full", tone.ray, c)} />
                                    ))}
                                    <span className={clsx("absolute inset-0 rounded-full bg-gradient-to-b shadow-[0_8px_20px_rgba(22,163,74,0.35)]", tone.ring)} />
                                    <span className="absolute inset-[12px] rounded-full bg-white" />
                                    <span className={clsx("relative", isDone ? "text-[#16a34a]" : "text-[#dc2626]")}>
                                        {isDone ? <CheckCircle2 size={48} strokeWidth={2.6} /> : <XCircle size={48} strokeWidth={2.6} />}
                                    </span>
                                </div>
                                <span className="-mt-1 h-4 w-40 rounded-[50%] bg-[linear-gradient(180deg,#e8f1ff,#a9c8f5)] shadow-[0_6px_14px_rgba(31,124,240,0.25)]" />
                            </div>
                        </div>

                        <div className="px-3 pt-3 pb-4 flex flex-col gap-3">
                            <div className={clsx("rounded-md border p-3 flex flex-col gap-1.5", tone.box)}>
                                <span className="flex items-center gap-2.5">
                                    <span className={clsx("size-10 rounded-full text-white flex items-center justify-center shrink-0", tone.dot)}>
                                        {isDone ? <Check size={22} strokeWidth={3.2} /> : <XCircle size={22} strokeWidth={2.6} />}
                                    </span>
                                    <span className="text-[clamp(17px,5vw,21px)] font-extrabold text-[#0b2a66] leading-snug text-left">
                                        {isDone ? 'সার্ভিসিং তথ্য প্রেরণ করা হয়েছে' : 'সার্ভিসটি বাতিল করা হয়েছে'}
                                    </span>
                                </span>
                                <p className="text-[13px] leading-relaxed text-[#3d4a63] text-center">
                                    {isDone ? 'ধন্যবাদ! আপনার রিপোর্ট সফলভাবে গ্রহণ করা হয়েছে।' : 'এই সার্ভিসের রিপোর্ট আর প্রদান করা সম্ভব নয়।'}
                                    <span className="block text-[11.5px] text-[#5b6784] mt-0.5">Service ID: <b className="text-[#16213a]">{serviceData.serviceId}</b></span>
                                </p>
                            </div>

                            {session.isAuth && (
                                <Link href="/staff/profile" className="mx-auto w-full max-w-[320px] h-12 rounded-full bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-3 shadow-[0_10px_24px_rgba(31,124,240,0.35)] active:scale-[0.98] transition-transform">
                                    <span className="size-8 rounded-full bg-white/20 flex items-center justify-center"><ArrowLeft size={18} /></span>
                                    ড্যাশবোর্ডে ফিরে যান
                                </Link>
                            )}

                            <a href={`tel:${contactDetails.customerCare}`} className="relative rounded-md bg-[#f3f8ff] border border-[#dbe7fb] p-3 flex items-center gap-3 overflow-hidden">
                                <span className="size-16 rounded-full bg-[linear-gradient(180deg,#dbeafe,#bfdbfe)] text-[#1f5fc9] flex items-center justify-center shrink-0"><Headset size={30} /></span>
                                <span className="w-px self-stretch bg-[#dbe7fb]" />
                                <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                                    <span className="text-[13px] font-bold text-[#0b2a66] leading-snug">কোনো সমস্যা হলে<br />আমাদের সাথে যোগাযোগ করুন</span>
                                    <span className="self-start inline-flex items-center gap-2 h-8 px-3 rounded-full bg-[#dbeafe] text-[#0b2a66] text-[14px] font-extrabold"><Phone size={15} />{contactDetails.customerCare}</span>
                                </span>
                                <Send size={20} className="absolute right-3 top-3 text-[#1f7cf0]" />
                            </a>

                            <div className="flex items-center justify-center gap-3 pt-1">
                                <span className="h-px w-10 bg-[#b9cdee]" />
                                <span className="flex flex-col items-center leading-tight"><span className="text-[13px] font-extrabold tracking-[0.18em] text-[#0b2a66]">SE ELECTRONICS</span><span className="text-[11px] text-[#1f5fc9]">Smart Solution &nbsp;Better Life</span></span>
                                <span className="h-px w-10 bg-[#b9cdee]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

        if (session.isAuth) {
            return (
                <StaffLayout balance={stats?.availableBalance || 0} roundedHeader>
                    {content}
                </StaffLayout>
            );
        } else {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col">
                    <header className="sticky top-0 z-50 bg-[#0A1A3A] text-white shadow-lg">
                        <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                            <h1 className="font-bold text-sm sm:text-base p-1">Service Report</h1>
                        </div>
                    </header>
                    <main className="flex-1 w-full max-w-4xl mx-auto p-4">
                        {content}
                    </main>
                </div>
            );
        }
    }

    if (session.isAuth) {
        return (
            <StaffLayout balance={stats?.availableBalance || 0}>
                <div className="p-4 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand/10 rounded-md text-brand">
                            <Wrench size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">Submit Service Report</h1>
                    </div>

                    <ServiceReport
                        isUnregistered={false}
                        serviceData={{
                            serviceId: serviceData.serviceId,
                            serviceType: serviceData.type ?? 'repair',
                            serviceStatus: statusHistory.status ?? 'pending',
                            statusArray: statusArray.map(s => s ?? '').filter(Boolean),
                            customerName: serviceData.customerName,
                            customerPhone: serviceData.customerPhone
                        }}
                    />
                </div>
            </StaffLayout>
        );
    } else {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="sticky top-0 z-50 bg-[#0A1A3A] text-white shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                        <h1 className="font-bold text-sm sm:text-base p-1">Submit Service Report</h1>
                    </div>
                </header>
                <main className="flex-1 w-full max-w-4xl mx-auto p-4 pb-20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-brand/10 rounded-md text-brand">
                            <Wrench size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">Submit Service Report</h1>
                    </div>
                    <ServiceReport
                        isUnregistered={true}
                        serviceData={{
                            serviceId: serviceData.serviceId,
                            serviceType: serviceData.type ?? 'repair',
                            serviceStatus: statusHistory.status ?? 'pending',
                            statusArray: statusArray.map(s => s ?? '').filter(Boolean),
                            customerName: serviceData.customerName,
                            customerPhone: serviceData.customerPhone
                        }}
                    />
                </main>
            </div>
        );
    }
}