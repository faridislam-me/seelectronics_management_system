import { GetServiceForm } from "@/components";
import { verifyCustomerSession } from "@/actions/customerActions";
import { SearchParams } from "@/types";
import { contactDetails } from "@/constants";
import { Ban, Phone } from "lucide-react";
import Link from "next/link";

export default async function GetServicePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params: any = await searchParams;
    const session = await verifyCustomerSession();
    const preferredStaffId = params.staffId as string || '';

    // Blocked customers (unpaid due / misuse) can't request a service online.
    if (session.isAuth && session.customer?.isWarrantyStopped) {
        const misuse = session.customer.warrantyStopReason === "misuse";
        return (
            <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-3">
                <div className="w-full max-w-sm bg-white rounded-md border border-[#f7c3ca] p-4 flex flex-col items-center text-center gap-3">
                    <span className="size-14 rounded-full bg-[#ffe9ec] text-[#c81f38] flex items-center justify-center"><Ban size={28} /></span>
                    <h1 className="text-[17px] font-extrabold text-[#16213a]">সার্ভিসের আবেদন বন্ধ আছে</h1>
                    <p className="text-[14px] font-semibold text-[#3d4a63] leading-relaxed">
                        {misuse
                            ? "পণ্যের অপব্যবহার/ক্ষতি প্রমাণিত হওয়ায় আপনার ওয়ারেন্টি বাতিল করা হয়েছে, তাই অনলাইনে সার্ভিসের আবেদন করা যাবে না।"
                            : "বকেয়া টাকা পরিশোধ না করায় আপনার ওয়ারেন্টি সাময়িকভাবে বন্ধ আছে। বকেয়া পরিশোধ করলে আবার সার্ভিসের আবেদন করতে পারবেন।"}
                    </p>
                    <a href={`tel:${contactDetails.customerCare}`} className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2"><Phone size={16} />কাস্টমার কেয়ার: {contactDetails.customerCare}</a>
                    <Link href="/customer/profile" className="text-[13px] font-bold text-[#1f7cf0]">হোমে ফিরে যান</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-1">
                <GetServiceForm
                    preferredStaffId={preferredStaffId}
                    customerId={session.isAuth ? session.customer?.customerId : undefined}
                    customerData={session.isAuth ? session.customer : undefined}
                />
            </div>
        </div>
    );
}