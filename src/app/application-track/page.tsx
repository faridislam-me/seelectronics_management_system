import { getApplicationById } from "@/actions"
import { ImageWithLightbox } from "@/components"
import StatusBadge from "@/components/ui/StatusBadge"
import { contactDetails } from "@/constants"
import { AppError, formatDate, renderText } from "@/utils"
import { notFound } from "next/navigation"

const applicationContents = {
    staff_application: {
        title: 'SE ELECTRONICS সার্ভিস পয়েন্ট',
        subtitle: '',
        statusMessages: {
            pending: '{name} টেকনিসিয়ান, সার্ভিস পয়েন্ট আপনি সফল ভাবে আবেদন টি সাবমিট করেছেন আমার যাচাই করে দেখব সেই পযন্ত আমাদের সাথে থাকুন।',
            processing: `{name} টেকনিসিয়ান, সার্ভিস পয়েন্ট আপনার আবেদনের NID যাচাই সঠিক হয়েছে বাকি যাচাই করে কনর্ফাম করা হবে সেই পযন্ত আমাদের সাথে থাকুন যেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
            approved: `অভিনন্দন! আপনার আবেদনটি সফলভাবে যাচাই করা হয়েছে এবং SE ELECTRONICS টেকনিশিয়ান সার্ভিস পয়েন্ট-এ অনুমোদিত হয়েছে। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
            rejected: 'দুঃখিত, NID যাচাই সংক্রান্ত তথ্য ভুল থাকার কারণে আপনার আবেদনটি বাতিল করা হয়েছে।\nঅনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন।',
            expired: 'দুঃখিত, আপনার আবেদনের মেয়াদ শেষ হয়ে গেছে। বিস্তারিত জানতে যোগাযোগ করুন।',
        },
    },
    service_application: {
        title: 'সার্ভিসিং স্ট্যাটাস ট্র্যাকিং এবং পণ্যের তথ্য যাচাই',
        subtitle: 'এস ই ইলেকট্রনিকসে (S E Electronics) আপনার আস্থা ও মূল্যবান সময় দেওয়ার জন্য আমরা কৃতজ্ঞ। এই ট্র্যাকিং পৃষ্ঠার মাধ্যমে আপনি আপনার  অনলাইন সার্ভিসিং সার্ভিস রিকোয়েস্টের প্রতিটি ধাপের সর্বশেষ ও বিস্তারিত তথ্য জানতে পারবেন',
        statusMessages: {
            pending: 'আপনার অনলাইন সার্ভিস অনুরোধটি গৃহীত হয়েছে। প্রিয় গ্রাহক {customer_name} আপনার অনলাইন সার্ভিসিং অনুরোধটি প্রাথমিক পর্যালোচনার পর্যায়ে রয়েছে। এই সময়ে আমাদের টিম আপনার দেওয়া তথ্য এবং সমস্যার বিবরণ যাচাই করে দেখছে এবং পরবর্তী পদক্ষেপের জন্য প্রস্তুত হচ্ছে। এই ধাপ সম্পূর্ণ হওয়ার পর আপনার রিকোয়েস্টটি এস ই ইলেকট্রনিকসের সার্ভিস সেন্টারে স্থানান্তরিত হবে। সময় দিয়ে সাথেই থাকুন, ধন্যবাদ।',
            processing: 'আপনার অনুরোধটি বর্তমানে যাচাই প্রক্রিয়া চলছে। প্রিয় গ্রাহক {customer_name} আমরা আপনার জমা দেওয়া তথ্য ও প্রডাক্ট এর ছবি আমাদের টিম যাচাই করে দেখছে আপনার পণ্যটি আমাদের বিশেষজ্ঞ টেকনিশিয়ানরা বর্তমানে আপনার পণ্যের ত্রুটি নির্ণয় এবং প্রয়োজনীয় কার্য পরিচালনা করছেন। এই ধাপে আপনার পন্যের ওয়ারেন্টি সময় কাল আছে কিনা ও এস ই ইলেকট্রনিকস এর প্রডাক্ট কি তা পরীক্ষা অন্তর্ভুক্ত সকল যাচাই করণ সঠিক হলে আপনার অনুরোধ টি আমাদের সার্ভিস সেন্টারে আপনার প্রডাক্ট এর তথ্য পেরণ করা হবে।',
            approved: 'অভিনন্দন! আপনার অনলাইন সার্ভিসিং অনুরোধটি  অনুমোদিত হয়েছে। প্রিয় গ্রাহক {customer_name} আপনার অনলাইন সার্ভিসিং অনুরোধটি এস ই ইলেকট্রনিকস এর প্রডাক্ট সার্ভিসিং সেন্টারে এখন অনুমোদন করা হয়েছে। আমাদের বিশেষজ্ঞ দল শীঘ্রই আপনার  পন্যটির সমস্যা সমাধানের ব্যবস্থা গ্রহণ ও সার্ভিসিং সেবার সময়সূচী নিয়ে আলোচনার জন্য যোগাযোগ করবে। সেই পর্যন্ত আমাদের সাথে থাকুন ধন্যবাদ।',
            rejected: `আপনার অনলাইন সার্ভিসিং অনুরোধটি বাতিল করা হয়েছে। আমরা দুঃখিত যে এই মুহূর্তে আমরা আপনার অনুরোধটি এগিয়ে নিতে পারছি না। বাতিলের কারণ বা অন্য কোনো সহায়তার জন্য অনুগ্রহ করে আমাদের এস ই ইলেকট্রনিকস এর কাস্টমার সাপোর্ট টিমের সাথে যোগাযোগ করুন। কাস্টমার কেয়ার ${contactDetails.customerCare} অথবা ${contactDetails.customerCare2} সকাল ১০ টা থেকে রাত ৯ টা পযন্ত।`,
            expired: 'দুঃখিত, আপনার আবেদনের মেয়াদ শেষ হয়ে গেছে। বিস্তারিত জানতে যোগাযোগ করুন।',
        },
    },
    subscription_application: {
        title: 'রক্ষণাবেক্ষণ সাবস্ক্রিপশন অনুরোধ স্ট্যাটাস ট্র্যাকিং পেইজ',
        subtitle: 'এস ই ইলেকট্রনিকসে (SE ELECTRONICS) আপনার আস্থা ও মূল্যবান সময় দেওয়ার জন্য আমরা কৃতজ্ঞ। এই ট্র্যাকিং পৃষ্ঠার মাধ্যমে আপনি আপনার সার্ভিস রিকোয়েস্টের প্রতিটি ধাপের সর্বশেষ ও বিস্তারিত তথ্য জানতে পারবেন',
        statusMessages: {
            pending: 'আপনার আবেদন সফলভাবে গৃহীত হয়েছে। এস ই ইলেকট্রনিকস-এ আইপিএস ও ব্যাটারি রক্ষণাবেক্ষণ প্যাকেজের জন্য আপনার অনুরোধটি আমরা পেয়েছি। আপনার মূল্যবান সময়ের জন্য ধন্যবাদ। আমরা দ্রুততম সময়ে আপনার আবেদনটি পর্যালোচনা শুরু করব। সময় দিয়ে আমাদের সাথে থাকুন ধন্যবাদ।',
            processing: 'আপনার অনুরোধটি বর্তমানে যাচাইকরণ প্রক্রিয়ায় আছে। আমরা আপনার জমা দেওয়া তথ্যগুলো পরীক্ষা করে দেখছি আপনি কি কি সেবা নিতে চান এবং প্যাকেজটি সক্রিয় করার জন্য প্রস্তুতি নিচ্ছি। অনুগ্রহ করে কিছুটা সময় অপেক্ষা করুন।',
            approved: 'অভিনন্দন! আপনার সাবস্ক্রিপশন অনুমোদিত হয়েছে। আপনার আইপিএস ও ব্যাটারির রক্ষণাবেক্ষণ মাসিক প্যাকেজটি এখন সক্রিয় করা হয়েছে। আমাদের বিশেষজ্ঞ দল শীঘ্রই আপনার সাথে রক্ষণাবেক্ষণ সেবার সময়সূচী নিয়ে আলোচনার জন্য যোগাযোগ করবে।',
            rejected: `আপনার সাবস্ক্রিপশন অনুরোধটি বাতিল করা হয়েছে। আমরা দুঃখিত যে এই মুহূর্তে আমরা আপনার অনুরোধটি এগিয়ে নিতে পারছি না। বাতিলের কারণ বা অন্য কোনো সহায়তার জন্য অনুগ্রহ করে আমাদের এস ই ইলেকট্রনিকস এর কাস্টমার সাপোর্ট টিমের সাথে যোগাযোগ করুন। কাস্টমার কেয়ার ${contactDetails.customerCare} অথবা ${contactDetails.customerCare2} সকাল ১০ টা থেকে রাত ৯ টা পযন্ত।`,
            expired: 'দুঃখিত, আপনার আবেদনের মেয়াদ শেষ হয়ে গেছে। বিস্তারিত জানতে যোগাযোগ করুন।',
        },
    },
    seller_application: {
        title: 'SE ELECTRONICS অথরাইজড সেলার আবেদন',
        subtitle: 'আপনার সেলার/ডিলার আবেদনের বর্তমান অবস্থা এখানে দেখুন।',
        statusMessages: {
            pending: '{name}, আপনার সেলার আবেদনটি সফলভাবে জমা হয়েছে। আমরা আপনার ট্রেড লাইসেন্স ও NID যাচাই করে জানাবো, সেই পর্যন্ত আমাদের সাথে থাকুন।',
            processing: `{name}, আপনার ট্রেড লাইসেন্স ও NID যাচাই সম্পন্ন হয়েছে। বাকি যাচাই শেষে কনফার্ম করা হবে। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
            approved: `অভিনন্দন! আপনার সেলার আবেদনটি যাচাই করা হয়েছে এবং SE ELECTRONICS অথরাইজড সেলার হিসেবে অনুমোদিত হয়েছে। সেলার আইডি ও লগইন তথ্য আপনার মোবাইলে SMS করা হয়েছে। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
            rejected: 'দুঃখিত, ডকুমেন্ট যাচাই সংক্রান্ত সমস্যার কারণে আপনার সেলার আবেদনটি বাতিল করা হয়েছে।\nঅনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন।',
            expired: 'দুঃখিত, আপনার আবেদনের মেয়াদ শেষ হয়ে গেছে। বিস্তারিত জানতে যোগাযোগ করুন।',
        },
    },
    vip_card_application: {
        title: 'ভিআইপি কার্ড আবেদন স্ট্যাটাস ট্র্যাকিং',
        subtitle: 'আপনার ভিআইপি কার্ড আবেদনের বর্তমান অবস্থা এখানে দেখুন।',
        statusMessages: {
            pending: 'আপনার ভিআইপি কার্ড আবেদনটি গ্রহণ করা হয়েছে। আমরা এটি যাচাই করছি।',
            processing: 'আপনার ভিআইপি কার্ড আবেদনটি বর্তমানে যাচাই প্রক্রিয়াধীন রয়েছে।',
            approved: 'অভিনন্দন! আপনার ভিআইপি কার্ড আবেদনটি অনুমোদিত হয়েছে।',
            rejected: 'দুঃখিত, আপনার ভিআইপি কার্ড আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে যোগাযোগ করুন।',
            expired: 'দুঃখিত, আপনার আবেদনের মেয়াদ শেষ হয়ে গেছে। বিস্তারিত জানতে যোগাযোগ করুন।',
        },
    }
}

export default async function ApplicationTrack({ searchParams }: { searchParams: Promise<{ trackingId: string }> }) {
    const { trackingId } = await searchParams
    if (!trackingId) {
        notFound()
    }
    const res = await getApplicationById(trackingId)

    if (!res.success) {
        throw new AppError("অ্যাপ্লিকেশন আইডিটি সঠিক নয়।")
    }
    const application = res.data!

    return (
        <div className="mx-auto max-w-[1000px] text-center p-3">
            <div className="h-full font-bold mb-3 flex flex-col gap-0.5 p-6 rounded-md border-[2px]">
                <div className="text-xl">
                    {applicationContents[application.type].title}
                </div>
                <div className="text-md">হেল্পলাইন : {contactDetails.customerCare}</div>
                <div className="text-md">Email : {contactDetails.email}</div>
                <div className="text-sm">হেড অফিস : {contactDetails.headOffice}</div>
                <p className="text-sm font-normal mt-2 text-gray-500">{applicationContents[application.type].subtitle}</p>
            </div>
            <div className="bg-white shadow-sm rounded-md border-2 border-gray-200">
                {(application.staff || application.seller) &&
                    <div className="bg-gradient-to-b from-gray-50 to-white py-6 px-4">
                        <div className="size-36 lg:size-44 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto">
                            <ImageWithLightbox src={(application?.staff as { photoUrl?: string })?.photoUrl ?? (application?.seller as { photoUrl?: string })?.photoUrl ?? ''} alt="" className="w-full h-full object-cover" />
                        </div>
                        {application.seller && <p className="mt-3 font-black text-lg">{application.seller.shopName}</p>}
                    </div>
                }

                <div className="px-4 py-6 pt-0 space-y-4">
                    <div className="bg-gray-50 rounded-md p-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-primary md:text-base">Applicant Name</span>
                            <span className="font-medium md:text-base">
                                {application.staff?.name || application.subscriber?.name || application.service?.customerName || application.seller?.ownerName}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-primary md:text-base">Phone Number</span>
                            <span className="font-medium md:text-base">
                                {application.staff?.phone || application.subscriber?.phone || application.service?.customerPhone || application.seller?.phone}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-primary md:text-base">Status</span>
                            <StatusBadge status={application.status} />
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-primary md:text-base">Applied Date</span>
                            <span className="font-medium md:text-base">{formatDate(application.createdAt!)}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
                        <p className="text-gray-700 md:text-base leading-relaxed">
                            {renderText(applicationContents[application.type].statusMessages[application.status], {
                                name: application.staff?.name || application.seller?.ownerName,
                                customer_name: application.service?.customerName
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}