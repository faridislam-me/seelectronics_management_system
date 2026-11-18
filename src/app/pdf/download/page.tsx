'use client'

import { Check, Download, TriangleAlert } from "lucide-react"
import { notFound, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import generatePDF from "./actions/generatePDF"
import { DocType } from "@/types"

const FILE_NAMES: Record<string, string> = {
    'id-card': 'ID_CARD.pdf',
    'payment': 'SE_ELECTRONICS_PAYMENT_RECEIPT.pdf',
    'invoice': 'SE_ELECTRONICS_INVOICE.pdf',
    'seller-invoice': 'SE_ELECTRONICS_SELLER_INVOICE.pdf',
    'seller-payment': 'SE_ELECTRONICS_SELLER_PAYMENT_RECEIPT.pdf',
    'certificate': 'SE_ELECTRONICS_CERTIFICATE.pdf',
    'seller-certificate': 'SE_ELECTRONICS_SELLER_CERTIFICATE.pdf',
    'complaint': 'SE_ELECTRONICS_COMPLAINT.pdf',
    'hearing-notice': 'SE_ELECTRONICS_HEARING_NOTICE.pdf',
    'completion-notice': 'SE_ELECTRONICS_RESOLUTION_LETTER.pdf',
    'ex-parte-notice': 'SE_ELECTRONICS_EX_PARTE_NOTICE.pdf',
    'complaint_customer': 'SE_ELECTRONICS_CUSTOMER_COMPLAINT_COPY.pdf',
    'staff-not-guilty': 'SE_ELECTRONICS_RESOLUTION_NOTICE.pdf',
    'installment-invoice': 'SE_ELECTRONICS_INSTALLMENT_INVOICE.pdf',
    'installment-sticker': 'SE_ELECTRONICS_INSTALLMENT_STICKER.pdf',
    'installment-documents': 'SE_ELECTRONICS_INSTALLMENT_FILE.pdf',
    'installment-receipt': 'SE_ELECTRONICS_INSTALLMENT_RECEIPT.pdf',
    'installment-noc': 'SE_ELECTRONICS_NOC.pdf',
}

export default function DocDownloadPage() {
    const searchParams = useSearchParams()
    const [blob, setBlob] = useState<Blob | null>(null)
    const [fileName, setFileName] = useState('SE_ELECTRONICS.pdf')
    const [previewUrl, setPreviewUrl] = useState<string>()
    const [error, setError] = useState<string>()
    const [saved, setSaved] = useState(false)
    const started = useRef(false)

    const token = searchParams.get('token')
    const docType = searchParams.get('type') as DocType
    const id = searchParams.get('id')

    if (!((docType && id) || token)) {
        notFound()
    }

    // The SE mobile apps expose a native file channel; when present the file is
    // handed to the app (which opens its own viewer / save sheet) instead of a
    // browser blob download.
    const hasAppChannel =
        typeof window !== 'undefined' &&
        Boolean((window as unknown as { SEFile?: unknown }).SEFile)

    // Generate the PDF once — but do NOT download it. We only render a preview;
    // the actual save happens when the user taps the Download button.
    async function generate() {
        const response = await generatePDF({
            docType: docType ?? 'invoice',
            id: id ?? '',
            token: token ?? '',
        })
        if (!response.success) {
            setError(response.message)
            return
        }
        setFileName(FILE_NAMES[response.docType as string] || 'SE_ELECTRONICS.pdf')
        setBlob(new Blob([response.pdfBuffer as any], { type: 'application/pdf' }))
    }

    useEffect(() => {
        if (started.current) return
        started.current = true
        generate()
    }, [])

    // Hold one object URL for the inline preview; revoke it on unmount.
    useEffect(() => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [blob])

    // Save only when the user asks for it.
    async function save() {
        if (!blob) return
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
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="flex flex-col items-center">
                    <div className="size-36 text-red-500 bg-red-200 rounded-full flex items-center justify-center mb-6">
                        <TriangleAlert size={50} />
                    </div>
                    <h1 className="text-2xl text-gray-800 mb-2">{error}</h1>
                </div>
            </div>
        )
    }

    // Still generating.
    if (!blob || !previewUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">পিডিএফ তৈরি হচ্ছে</h1>
                    <p className="text-gray-600">একটু অপেক্ষা করুন...</p>
                </div>
            </div>
        )
    }

    // Preview first, download on demand.
    return (
        <div className="fixed inset-0 flex flex-col bg-[#eef3fb]">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white border-b border-[#dfe6f2] shadow-sm">
                <span className="min-w-0 flex-1 text-[13px] font-bold text-[#16213a] truncate">{fileName}</span>
                <button
                    onClick={save}
                    className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#0b3d91] text-white text-[14px] font-extrabold shadow-[0_4px_12px_rgba(11,61,145,0.2)] active:scale-[0.98]"
                >
                    {saved ? <Check size={18} /> : <Download size={18} />}
                    {saved ? 'হয়েছে' : hasAppChannel ? 'ডাউনলোড / খুলুন' : 'ডাউনলোড'}
                </button>
            </div>
            <iframe
                src={previewUrl}
                title={fileName}
                className="flex-1 w-full border-0 bg-white"
            />
            {/* In-app WebViews often can't render a PDF inline; make the fallback
                explicit so the user knows to tap Download to open it. */}
            {hasAppChannel && (
                <div className="px-3 py-2 text-center text-[12px] text-[#5b6784] bg-white border-t border-[#dfe6f2]">
                    প্রিভিউ না দেখালে উপরের “ডাউনলোড / খুলুন” চাপুন।
                </div>
            )}
        </div>
    )
}
