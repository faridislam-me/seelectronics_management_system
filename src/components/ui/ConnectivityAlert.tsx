'use client'

import { useEffect, useState } from 'react'
import { Wifi } from 'lucide-react'
import OfflineScreen from './OfflineScreen'

/** Watches the connection: full-screen offline page while offline, short green notice when it is back. */
export default function ConnectivityAlert() {
    const [status, setStatus] = useState<'online' | 'offline' | 'back-online'>('online')

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const handleOffline = () => {
            clearTimeout(timer)
            setStatus('offline')
        }
        const handleOnline = () => {
            setStatus('back-online')
            timer = setTimeout(() => setStatus('online'), 3000)
        }

        window.addEventListener('offline', handleOffline)
        window.addEventListener('online', handleOnline)
        if (!navigator.onLine) handleOffline()

        return () => {
            clearTimeout(timer)
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('online', handleOnline)
        }
    }, [])

    if (status === 'offline') {
        return (
            <OfflineScreen
                fixed
                onRetry={async () => {
                    if (navigator.onLine) window.location.reload()
                }}
            />
        )
    }

    if (status === 'back-online') {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9999] p-2 text-center text-sm font-bold bg-green-500 text-white">
                <div className="flex items-center justify-center gap-2">
                    <Wifi className="size-4" />
                    <span>ইন্টারনেট ফিরে এসেছে!</span>
                </div>
            </div>
        )
    }

    return null
}
