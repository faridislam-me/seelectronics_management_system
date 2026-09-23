'use client'

import { usePathname, useSearchParams, useRouter } from "next/navigation"

export default function ApplicationFilter() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const currentType = searchParams.get('type') || 'all'

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams)
        const value = e.target.value
        if (value === 'all') {
            params.delete('type')
        } else {
            params.set('type', e.target.value)
        }
        replace(`${pathname}?${params.toString()}`)
    }
    return <div className="__center gap-2">
        <span className="font-medium">Filter:</span>
        <select defaultValue={currentType} onChange={handleTypeChange} className="w-34 border rounded-md outline-none h-8 px-2">
            <option value="all">All</option>
            <option value="staff">Staff</option>
            <option value="service">Service</option>
            <option value="subscription">Subscription</option>
            <option value="vip_card">VIP Card</option>
            <option value="seller">Seller</option>
        </select>
    </div>
}