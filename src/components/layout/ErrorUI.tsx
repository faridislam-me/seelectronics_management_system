'use client'

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { useTransition } from 'react'
import OfflineScreen, { isNetworkError } from '../ui/OfflineScreen'

interface ErrorUIProps {
    reset: () => void
    error?: Error & { digest?: string }
}

export default function ErrorUI({
    reset,
    error,
}: ErrorUIProps) {

    const [isPending, startTransition] = useTransition()

    // A lost connection shows the app-style offline page instead of the raw error text.
    if (isNetworkError(error)) {
        return (
            <OfflineScreen
                reloadWhenOnline
                onRetry={() => {
                    if (navigator.onLine) window.location.reload()
                }}
            />
        )
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-screen animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-50 p-4">
                        <AlertCircle className="size-12 text-red-500 stroke-[1.5]" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {error?.digest || error?.message}
                    </h1>
                    <p className="text-gray-500 px-4">
                        দুঃখিত, আমাদের রিকোয়েস্টটি সম্পন্ন করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।
                    </p>
                </div>

                {/* Primary Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => startTransition(() => reset())}
                        className="w-full bg-[#E53E3E] hover:bg-red-600 text-white rounded-md py-4 font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-100"
                    >
                        <RefreshCw className={`size-5 ${isPending ? 'animate-spin' : ''}`} />
                        আবার চেষ্টা করুন
                    </button>
                </div>

                {/* Help Section */}
                <div className="bg-white border border-gray-100 rounded-md p-6 text-left shadow-sm mt-8">
                    <div className="text-center">
                        <div className="mb-4 text-gray-900 font-bold">
                            সাহায্য প্রয়োজন?
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            সমস্যাটি অব্যাহত থাকলে, অনুগ্রহ করে নিম্নলিখিত পদক্ষেপগুলি চেষ্টা করুন:
                        </p>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                            <span>পৃষ্ঠাটি রিফ্রেশ করুন (Ctrl+R বা Cmd+R)</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                            <span>আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                            <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                            <span>আপনার ব্রাউজার ক্যাশে পরিষ্কার করুন</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
