'use client'

import { useEffect, useState } from 'react'
import { Clock, CloudOff, Headset, Plane, RefreshCw, Signal, Wifi, WifiOff } from 'lucide-react'

type Variant = 'offline' | 'slow' | 'error'

const COPY: Record<Variant, { title: string; subtitle: string; tips: { icon: typeof Wifi; text: string }[] }> = {
    offline: {
        title: 'ইন্টারনেট সংযোগ নেই',
        subtitle: 'আপনার ফোনে ইন্টারনেট বন্ধ আছে বা সিগন্যাল দুর্বল। সংযোগ ঠিক করে আবার চেষ্টা করুন।',
        tips: [
            { icon: Wifi, text: 'Wi-Fi অথবা মোবাইল ডাটা চালু করুন' },
            { icon: Plane, text: 'এয়ারপ্লেন মোড বন্ধ আছে কিনা দেখুন' },
            { icon: Signal, text: 'ভালো সিগন্যালের জায়গায় যান' },
        ],
    },
    slow: {
        title: 'ইন্টারনেট ধীর গতির',
        subtitle: 'পেজটি লোড হতে অনেক সময় লাগছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
        tips: [
            { icon: Signal, text: 'ভালো সিগন্যালের জায়গায় যান' },
            { icon: Wifi, text: 'Wi-Fi অথবা মোবাইল ডাটা বন্ধ করে আবার চালু করুন' },
            { icon: Clock, text: 'কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন' },
        ],
    },
    error: {
        title: 'পেজটি লোড করা যায়নি',
        subtitle: 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।',
        tips: [
            { icon: RefreshCw, text: 'নিচের বাটনে চেপে আবার চেষ্টা করুন' },
            { icon: Clock, text: 'কিছুক্ষণ অপেক্ষা করে আবার খুলুন' },
            { icon: Headset, text: 'সমস্যা থাকলে হেল্পলাইনে কল করুন: 09649355555' },
        ],
    },
}

/** Messages of fetch / chunk failures caused by a lost connection. */
export function isNetworkError(error?: { message?: string; name?: string } | null) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true
    const text = `${error?.name || ''} ${error?.message || ''}`
    return /failed to fetch|fetch failed|network|load failed|connection closed|chunkloaderror|loading chunk/i.test(text)
}

/** Full-screen "no internet" page, same design as the SE apps' native offline screen. */
export default function OfflineScreen({
    variant = 'offline',
    onRetry,
    fixed = false,
    reloadWhenOnline = false,
}: {
    variant?: Variant
    onRetry?: () => void | Promise<void>
    /** cover the whole viewport above everything (used by the global connectivity watcher) */
    fixed?: boolean
    /** reload the page by itself once the connection is back (for pages that failed to load) */
    reloadWhenOnline?: boolean
}) {
    const [retrying, setRetrying] = useState(false)
    const copy = COPY[variant]
    const Icon = variant === 'error' ? CloudOff : WifiOff

    useEffect(() => {
        if (!reloadWhenOnline) return
        const onOnline = () => window.location.reload()
        window.addEventListener('online', onOnline)
        return () => window.removeEventListener('online', onOnline)
    }, [reloadWhenOnline])

    const retry = async () => {
        setRetrying(true)
        try {
            if (onRetry) await onRetry()
            else window.location.reload()
        } finally {
            setTimeout(() => setRetrying(false), 1400)
        }
    }

    return (
        <div
            className={`${fixed ? 'fixed inset-0 z-[9999] overflow-y-auto' : 'min-h-screen w-full'} flex items-center justify-center bg-gradient-to-b from-[#E3EEFF] via-[#F7FAFF] to-white px-[22px] py-6`}
        >
            <style>{`@keyframes se-offline-ripple{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.1);opacity:0}}`}</style>
            <div className="w-full max-w-md flex flex-col items-center text-center">
                <div className="relative size-[220px] flex items-center justify-center">
                    <span className="absolute size-[152px] rounded-full bg-[#1F7CF0]/[0.07]" />
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="absolute size-[104px] rounded-full border-[2.5px] border-[#1F7CF0]"
                            style={{ animation: 'se-offline-ripple 2.4s linear infinite', animationDelay: `${-i * 0.8}s` }}
                        />
                    ))}
                    <div className="relative size-[104px] rounded-full border-4 border-white bg-gradient-to-br from-[#1F7CF0] to-[#0B3D91] shadow-[0_10px_24px_rgba(31,124,240,0.35)] flex items-center justify-center">
                        <Icon className="size-[50px] text-white" strokeWidth={2.4} />
                    </div>
                </div>

                <h1 className="mt-2 text-[24px] font-extrabold text-[#0A2F70]">{copy.title}</h1>
                <p className="mt-2.5 text-[14.5px] leading-normal font-medium text-[#5B6784]">{copy.subtitle}</p>

                <div className="mt-[22px] w-full rounded-2xl border border-[#DFE8F7] bg-white p-3.5 text-left shadow-[0_6px_16px_rgba(11,61,145,0.06)]">
                    {copy.tips.map(({ icon: TipIcon, text }, i) => (
                        <div key={text} className={`flex items-center gap-3 ${i > 0 ? 'mt-2 border-t border-[#EEF1F6] pt-2' : ''}`}>
                            <span className="size-9 shrink-0 rounded-[10px] bg-[#E8F1FF] flex items-center justify-center">
                                <TipIcon className="size-5 text-[#1F7CF0]" />
                            </span>
                            <span className="text-[13.5px] font-semibold leading-snug text-[#16213A]">{text}</span>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={retry}
                    disabled={retrying}
                    className="mt-[22px] h-[54px] w-full rounded-2xl bg-gradient-to-r from-[#1F7CF0] to-[#0B3D91] text-white text-[16.5px] font-extrabold flex items-center justify-center gap-2.5 shadow-[0_8px_18px_rgba(31,124,240,0.35)] disabled:text-white/70"
                >
                    <RefreshCw className={`size-[22px] ${retrying ? 'animate-spin' : ''}`} />
                    {retrying ? 'চেষ্টা চলছে...' : 'আবার চেষ্টা করুন'}
                </button>

                {variant === 'offline' && (
                    <p className="mt-3.5 text-[12px] font-semibold text-[#5B6784]">সংযোগ ফিরলে পেজ নিজে থেকেই লোড হবে</p>
                )}
                <p className="mt-[18px] text-[12px] font-extrabold tracking-[3px] text-[#0B3D91]">SE ELECTRONICS</p>
            </div>
        </div>
    )
}
