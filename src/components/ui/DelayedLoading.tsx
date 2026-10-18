'use client'

import { useEffect, useState } from 'react'
import Spinner from './Spinner'
import OfflineScreen from './OfflineScreen'

export default function DelayedLoading() {
    const [isSlow, setIsSlow] = useState(false)
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        // Check initial connectivity
        if (typeof window !== 'undefined' && !navigator.onLine) {
            setIsOffline(true)
        }

        const timer = setTimeout(() => {
            setIsSlow(true)
        }, 10000)

        const handleOffline = () => setIsOffline(true)
        const handleOnline = () => setIsOffline(false)

        window.addEventListener('offline', handleOffline)
        window.addEventListener('online', handleOnline)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('online', handleOnline)
        }
    }, [])

    const handleRetry = () => {
        window.location.reload()
    }

    if (!isSlow && !isOffline) {
        return (
            <div className="flex flex-col items-center justify-center p-10 min-h-[400px]">
                <Spinner message="লোড হচ্ছে..." />
            </div>
        )
    }

    return <OfflineScreen variant={isOffline ? 'offline' : 'slow'} onRetry={handleRetry} reloadWhenOnline />
}
