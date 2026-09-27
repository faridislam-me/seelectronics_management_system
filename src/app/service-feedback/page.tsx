import { getServiceById } from "@/actions"
import FeedbackForm from "@/components/features/services/FeedbackForm"
import { AppError } from "@/utils"
import { notFound } from "next/navigation"

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ serviceId: string }> }) {
    const params = await searchParams
    if (!params.serviceId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900">Send Feedback</h1>
                    <p className="text-gray-500 mb-6 text-sm">Enter the Service ID provided through SMS to give feedback on your completed service.</p>
                    <form action="/service-feedback" method="get" className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Service ID</label>
                            <input 
                                type="text" 
                                name="serviceId" 
                                placeholder="e.g. SRV-2026-XXXX" 
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                            />
                        </div>
                        <button type="submit" className="w-full bg-brand text-white font-bold py-3 rounded-md hover:bg-brand-800 transition-all active:scale-95 shadow-lg shadow-brand-100">
                            Give Feedback
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <a href="/customer/profile" className="text-sm font-semibold text-gray-500 hover:text-brand transition-colors">
                            Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        )
    }
    const service = await getServiceById(params.serviceId)

    if (!service.success) {
        throw new AppError("সার্ভিস আইডিটি সঠিক নয়।")
    }
    return <FeedbackForm serviceId={service.data?.serviceId ?? ''} customerId={service.data?.customerId ?? ''} service={service.data as any} />
}