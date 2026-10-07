'use client'

import { Check, TriangleAlert } from "lucide-react"
import { notFound, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import generatePDF from "./actions/generatePDF"
import { DocType } from "@/types"

export default function DocDownloadPage() {
    const searchParams = useSearchParams()
    const [finishedDownload, setFinishedDownload] = useState(false)
    const [error, setError] = useState<string>()
    const downloadStarted = useRef(false)

    const token = searchParams.get('token')
    const docType = searchParams.get('type') as DocType
    const id = searchParams.get('id')

    if (!((docType && id) || token)) {
        notFound()
    }

    async function download() {
        const response = await generatePDF({
            docType: docType ?? 'invoice',
            id: id ?? '',
            token: token ?? ''
        })

        if (!response.success) {
            setError(response.message)
            return
        }

        const blob = new Blob([response.pdfBuffer as any], { type: 'application/pdf' })

        const fileNames: Record<string, string> = {
            'id-card': 'ID_CARD.pdf',
            'payment': 'SE_ELECTRONICS_PAYMENT_RECEIPT.pdf',
            'invoice': 'SE_ELECTRONICS_INVOICE.pdf',
            'seller-invoice': 'SE_ELECTRONICS_SELLER_INVOICE.pdf',
            'certificate': 'SE_ELECTRONICS_CERTIFICATE.pdf',
            'complaint': 'SE_ELECTRONICS_COMPLAINT.pdf',
            'hearing-notice': 'SE_ELECTRONICS_HEARING_NOTICE.pdf',
            'completion-notice': 'SE_ELECTRONICS_RESOLUTION_LETTER.pdf',
            'complaint_customer': 'SE_ELECTRONICS_CUSTOMER_COMPLAINT_COPY.pdf',
            'staff-not-guilty': 'SE_ELECTRONICS_RESOLUTION_NOTICE.pdf',
        }
        const fileName = fileNames[response.docType as string] || 'SE_ELECTRONICS.pdf'

        // Inside the SE mobile apps (Android WebView) blob downloads are not supported,
        // so the app gets the file as base64 and opens its share / save sheet instead.
        const appChannel = (window as unknown as { SEFile?: { postMessage: (m: string) => void } }).SEFile
        if (appChannel) {
            const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result))
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(blob)
            })
            appChannel.postMessage(JSON.stringify({ name: fileName, mime: 'application/pdf', data: dataUrl.split(',')[1] }))
        } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            a.click()
            URL.revokeObjectURL(url)
        }
        setFinishedDownload(true)
    }

    useEffect(() => {
        if (downloadStarted.current) return
        downloadStarted.current = true
        download()
    }, [])
    return <div className="min-h-screen flex items-center justify-center p-4">
        {!error ?
            finishedDownload ?
                <div className="flex flex-col items-center gap-6">
                    <div className="size-36 text-green-500 bg-green-200 rounded-full flex items-center justify-center">
                        <Check size={50} />
                    </div>
                    <h1 className="text-2xl text-gray-800 mb-2">
                        Download Completed
                    </h1>
                </div>
                : <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        Downloading Your File
                    </h1>
                    <p className="text-gray-600">
                        Please wait...
                    </p>
                </div> :
            <div className="flex flex-col items-center">
                <div className="size-36 text-red-500 bg-red-200 rounded-full flex items-center justify-center mb-6">
                    <TriangleAlert size={50} />
                </div>
                <h1 className="text-2xl text-gray-800 mb-2">
                    {error}
                </h1>
            </div>
        }
    </div>
}