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
    'complaint_customer': 'SE_ELECTRONICS_COMPLAINT_LETTER.pdf',
    'complaint_admin_file': 'SE_ELECTRONICS_ADMIN_COMPLAINT_FILE.pdf',
    'staff-not-guilty': 'SE_ELECTRONICS_RESOLUTION_NOTICE.pdf',
    'installment-invoice': 'SE_ELECTRONICS_INSTALLMENT_INVOICE.pdf',
    'installment-sticker': 'SE_ELECTRONICS_INSTALLMENT_STICKER.pdf',
    'installment-documents': 'SE_ELECTRONICS_INSTALLMENT_FILE.pdf',
    'installment-receipt': 'SE_ELECTRONICS_INSTALLMENT_RECEIPT.pdf',
    'installment-noc': 'SE_ELECTRONICS_NOC.pdf',
    'guarantor-notice': 'SE_ELECTRONICS_GUARANTOR_NOTICE.pdf',
}

export default function DocDownloadPage() {
    const searchParams = useSearchParams()
    const [fileName, setFileName] = useState('SE_ELECTRONICS.pdf')
    const [blob, setBlob] = useState<Blob | null>(null)
    const [error, setError] = useState<string>()
    const [done, setDone] = useState(false)
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

    // Hand the generated PDF to the app channel (mobile) or trigger a browser
    // download (web). Used both for the automatic save and the manual button.
    async function save(theBlob: Blob, name: string) {
        const appChannel = (window as unknown as { SEFile?: { postMessage: (m: string) => void } }).SEFile
        if (appChannel) {
            const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result))
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(theBlob)
            })
            appChannel.postMessage(JSON.stringify({ name, mime: 'application/pdf', data: dataUrl.split(',')[1] }))
        } else {
            const url = URL.createObjectURL(theBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    // Generate the PDF and immediately download it (no preview page).
    async function generateAndDownload() {
        const response = await generatePDF({
            docType: docType ?? 'invoice',
            id: id ?? '',
            token: token ?? '',
        })
        if (!response.success) {
            setError(response.message)
            return
        }
        const name = FILE_NAMES[response.docType as string] || 'SE_ELECTRONICS.pdf'
        const pdfBlob = new Blob([response.pdfBuffer as any], { type: 'application/pdf' })
        setFileName(name)
        setBlob(pdfBlob)
        await save(pdfBlob, name)
        setDone(true)
    }

    useEffect(() => {
        if (started.current) return
        started.current = true
        generateAndDownload()
    }, [])

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
    if (!done) {
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

    // Downloaded — confirm and offer a re-download.
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="flex flex-col items-center text-center">
                <div className="size-36 text-green-600 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Check size={56} />
                </div>
                <h1 className="text-2xl font-semibold text-gray-800 mb-1">ডাউনলোড সম্পন্ন</h1>
                <p className="text-gray-600 mb-6 break-all">{fileName}</p>
                <button
                    onClick={() => blob && save(blob, fileName)}
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#0b3d91] text-white text-[15px] font-extrabold shadow-[0_4px_12px_rgba(11,61,145,0.2)] active:scale-[0.98]"
                >
                    <Download size={18} />
                    {hasAppChannel ? 'আবার ডাউনলোড / খুলুন' : 'আবার ডাউনলোড করুন'}
                </button>
            </div>
        </div>
    )
}
