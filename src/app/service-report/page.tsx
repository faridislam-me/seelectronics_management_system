import { getServiceById, verifyStaffSession } from "@/actions"
import { getStaffProfileStats } from "@/actions/staffActions"
import ServiceReport from "@/components/features/services/ServiceReport"
import { StaffLayout } from "@/components/layout/StaffLayout"
import { AppError } from "@/utils"
import clsx from "clsx"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Wrench } from "lucide-react"
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
        const content = (
            <div className="flex flex-col items-center text-center px-4 py-16">
                <div className={clsx(
                    "p-4 rounded-full mb-6",
                    statusHistory.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                )}>
                    {statusHistory.status === 'completed' ? (
                        <CheckCircle2 size={80} strokeWidth={1.5} />
                    ) : (
                        <XCircle size={80} strokeWidth={1.5} />
                    )}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {statusHistory.status === 'completed' ? 'সার্ভিসিং তথ্য প্রেরণ করা হয়েছে' : 'সার্ভিসটি বাতিল করা হয়েছে'}
                </h2>
                <p className="text-gray-500 font-medium mb-8">
                    {statusHistory.status === 'completed' 
                        ? 'ধন্যবাদ! আপনার রিপোর্ট সফলভাবে গ্রহণ করা হয়েছে।' 
                        : 'এই সার্ভিসের রিপোর্ট আর প্রদান করা সম্ভব নয়।'}
                </p>
                {session.isAuth && (
                    <Link 
                        href="/staff/profile" 
                        className="bg-brand text-white px-8 py-3 rounded-md font-bold shadow-lg hover:bg-brand-800 transition-all active:scale-95"
                    >
                        Back to Dashboard
                    </Link>
                )}
            </div>
        );

        if (session.isAuth) {
            return (
                <StaffLayout balance={stats?.availableBalance || 0}>
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