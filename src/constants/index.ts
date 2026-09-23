export const appVersion = '6.0.0'

export const contactDetails = {
    sms: '+8801310673600',
    phone: '+8801310673600',
    whatsApp: '+8801310673600',
    customerCare: '09649355555',
    customerCare2: '+8801322247774',
    email: 'seipsbd@gmail.com',
    website: 'www.seipsbd.com',
    headOffice: ' বাদাম বাগিচা ২ নং রোড সিলেট',
    baseUrl: 'https://seelectronicspro.vercel.app'
}

export const warrantyMonths = [0, 6, 12, 18, 24, 30, 36]

export const warrantyDurationByType = {
  ips: 24,
  battery: 12,
  stabilizer: 18,
  others: 6,
}
export const productTypes = ["ips", "battery", "stabilizer", "others"]
export const paymentTypes = ["Cash", "Bkash", "Nagad", "Rocket", "Bank"]
export const serviceStatuses = [
    "pending",
    "in_progress",
    "appointment_retry",
    "service_center",
    "service_center_received",
    "staff_departed",
    "staff_arrived",
    "completed",
    "canceled",
]

export const ApplicationTypes = {
    staff_application: 'Staff Application',
    service_application: 'Service Application',
    subscription_application: 'Subscription Application',
    vip_card_application: 'VIP Card Application',
    seller_application: 'Seller Application',
}

export const sellerBusinessTypes = [
    { value: 'retail', label: 'রিটেইল শপ' },
    { value: 'wholesale', label: 'হোলসেল' },
    { value: 'showroom', label: 'শোরুম' },
    { value: 'other', label: 'অন্যান্য' },
] as const

export const sellerRegistrationLinkMessagePreview = 'এস ই ইলেকট্রনিকস অথরাইজড সেলার/ডিলার আবেদন লিংক: {{registration_link}}\nলিংকটি {{registration_link_expiry}} ঘণ্টা পর অকার্যকর হয়ে যাবে।'

export const sellerAgreementText = `
আমি ঘোষণা করিতেছি যে, উপরোক্ত সকল তথ্য ও ডকুমেন্ট সঠিক। SE ELECTRONICS এর সেলার নীতিমালা, মূল্য তালিকা ও ওয়ারেন্টি শর্ত মানিয়া চলিব। ভুল তথ্য প্রদান করিলে সেলারশিপ বাতিল হইতে পারে।
`

export const serviceCancelationReasons = [
    'সার্কিট পুরে গেছে হোম সার্ভিস সম্ভব না',
    'ট্রান্সফরমার জলে গেছে নতুন ইন্সটল করা লাগবে',
    'নানা দিক পাটস সমস্যা',
    'ট্রান্সফরমার ও সারকিট উভয় নষ্ট',
]
export const installCancelationReasons = [
    'কোম্পানি IPS প্যাকেজ টি ইন্সটল কেন্সেল করেছে',
    'কাস্টমার বাসায় নেই বাসা বন্ধ',
    'কাস্টমার পরে আসতে বলেছে এখন কাজ না করতে'
]
export const agreementText = `
আমি এই মর্মে ঘোষণা করিতেছি যে, আমি SE ELECTRONICS কোম্পানির সকল নির্দেশনা মানিয়া চলিব এবং  আমার উপরোক্ত তথ্যবলি নির্ভুল ও সত্য। আমি জ্ঞানতঃ কোনো তথ্য গোপন করি নাই ৷ যদি আমি ভবিষ্যতে আমার বিরুদ্ধে ভুল তথ্য দাখিল কিংবা প্রধান সম্পর্কিত কোনো ধরনের অভিযোগ পাওয়া যায়, তাহলে এস ই বিডি কতৃকপক্ষ আমার বিরুদ্ধে যথাযথ ব্যবস্হা গ্রহন করিতে পারিবে এবং এতে আমার কোনো অপত্তি থাকবেনা। আমি কোনো অপত্তি করিলে সর্বস্হর আদালতে তাহ্য অগ্যাহ্য বলিয়া গণ্য হইবে। আমার বর্তমান ঠিকানা পরিবর্তন হলে পরিবর্তীত নতুন ঠিকানা পরবর্তী ০৩ দিনের মধ্যে লিখিতভাবে এস ই বিডির প্রশাসনিক বিভাগে জানাতে বাধ্য থাকবো৷
`
export const oneTimeRegistrationMessagePreview = `প্রিয় গ্রাহক [Customer Name] SE ELECTRONICS আপনার সার্ভিসিং এর অনুরোধটি গ্রহণ করা হয়েছে সার্ভিস আই ডি নং [Service Id] ধন্যবাদ আমাদের সাথে থাকার জন্য যে কোন তথ্যের জন্য ${contactDetails.customerCare}`
export const registrationLinkMessagePreview = 'Your SE IPS BD registration link: {{registration_link}}\nThis link will expire within {{registration_link_expiry}} hours'
export const servicingConfirmationMessagePreview = `প্রিয় গ্রাহক {{customer_name}} SE ELECTRONICS আপনার সার্ভিসিং এর অনুরোধটি গ্রহণ করা হয়েছে সার্ভিস আই ডি নং {{service_id}} যে কোন তথ্যের জন্য ${contactDetails.customerCare} সার্ভিস স্ট্যাটাস ট্র্যাক করতে লিঙ্কটিতে ক্লিক করুন {{service_track_url}}`
export const repairCompleteMessagePreview = `প্রিয় গ্রাহক {customer_name},\nআপনার সার্ভিস {service_id} সার্ভিসটি সমাধান করা হয়েছে। অনুগ্রহ করে আপনার ফিডব্যাক এর জন্য ক্লিক করুন: {feedback_url}`
export const installCompleteMessagePreview = `প্রিয় গ্রাহক {customer_name},\nআপনার IPS প্যাকেজ ইন্সটল সার্ভিস {service_id} হাউস ওয়ারিং কাজ শেষ হয়েছে৷ অনুগ্রহ করে আপনার ফিডব্যাক এর জন্য ক্লিক করুন: {feedback_url}`
export const invoiceDownloadLinkMessagePreview = `প্রিয় {name},\nআপনার ইনভয়েস তৈরি করা হয়েছে। নিচে ইনভয়েস সম্পর্কিত কিছু তথ্য দেওয়া হলো:\nইনভয়েস নম্বর: {invoice_number}\nতারিখ: {date}\nমোট পরিমাণ: {total_price}\nইনভয়েসটি দেখতে বা ডাউনলোড করতে এই লিঙ্কটি ব্যবহার করুন: {download_link}\nআপনার মূল্যবান সময়ের জন্য ধন্যবাদ। যেকোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন ${contactDetails.customerCare}।`
export const paymentInvoiceDownloadLinkMessagePreview = `প্রিয় {name},\nSE ELECTRONICS আপনার IPS সার্ভিসিং এর পেমেন্ট করা হয়েছে। নিচে ইনভয়েস সম্পর্কিত তথ্য দেওয়া হলো:\nইনভয়েস নম্বর: {invoice_number}\nতারিখ: {date}\nমোট পরিমাণ: {total_price}\nইনভয়েসটি দেখতে বা ডাউনলোড করতে এই লিঙ্কটি ব্যবহার করুন: {download_link}\nকাস্টমার কেয়ার ${contactDetails.customerCare}।`
export const ipsBrands = [
    "এস ই পাওয়ার আই পি এস",
    "রহিম আফরোজ",
    "লুমিনিয়ার্স",
    "স্মাটেন",
    "সুকাম",
    "মাক্রোটেক",
    "এক্সিড",
    "সুভাস্তিকা",
    "হ্যামকো",
    "ভিশন",
    "সিঙ্গার",
    "ওয়ালটন",
    "জুই পাওয়া",
    "এনার্জি ওয়ার্ল্ড",
    "হনেস্ট পাওয়ার",
    "জেনারেল আইপিএস",
    "জেনেসিস আই পি এস",
    "লংরান আই পি এস",
    "অন্যান্য ব্রান্ডের আইপিএস",
]

export const stabilizerBrands = [
    "SE DIGITAL STABILIZER",
    "SE ANALOGUE STABILIZER",
    "WALTON STABILIZER",
    "VISION SATBILIZER",
    "LG STABILIZER",
    "CHAINA STABILIZER",
    "LOCAL  MADE STABILIZER",
]

export const stabilizerPowerRatings = [
    "1000 VA 220 V OUT",
    "10000 VA 220 V OUT",
    "1200 VA 220 V OUT",
    "1500 VA 220 V OUT",
    "2000 VA 220 V OUT",
    "3000 VA 220 V OUT",
    "4000 VA 220 V OUT",
    "5000 VA 220 V OUT",
    "600 VA 220 V OUT",
    "700 VA 220 V OUT",
    "OTH 10000 VA 110 V OUT",
    "OTH 12000 VA 110 V OUT",
    "OTH 4000 VA 110 V OUT",
    "OTH 5000 VA 110 V OUT",
    "SED 1000 VA 110 V OUT",
    "SED 1000 VA 220 V OUT",
    "SED 10000 VA 220 V OUT",
    "SED 1200 VA 110 V OUT",
    "SED 1200 VA 220 V OUT",
    "SED 1500 VA 110 V OUT",
    "SED 1500 VA 220 V OUT",
    "SED 2000 VA 110 V OUT",
    "SED 2000 VA 220 V OUT",
    "SED 3000 VA 110 V OUT",
    "SED 3000 VA 220 V OUT",
    "SED 4000 VA 220 V OUT",
    "SED 5000 VA 220 V OUT",
    "SED 700 VA 110 V OUT",
    "SED 700 VA 220 V OUT",
    "WL 1000 VA 220 V OUT",
    "WL 1200 VA 220 V OUT",
    "WL 1500 VA 220 V OUT",
    "WL 2000 VA 220 V OUT",
    "WL 3000 VA 220 V OUT",
    "WL 700 VA 220 V OUT"
]

export const batteryTypes = [
    "রহিম আফরোজ ১০০ এম্পিয়ার",
    "রহিম আফরোজ ১২০ এম্পিয়ার",
    "রহিম আফরোজ ১৫০ এম্পিয়ার",
    "রহিম আফরোজ ২০০ এম্পিয়ার",
    "রহিম আফরোজ টিউবলার ব্যাটারি",

    "হ্যামকো PCV 17 পেলেট",
    "হ্যামকো PCV 21 পেলেট",
    "হ্যামকো PCV 27 পেলেট",
    "হ্যামকো PCV 29 পেলেট",
    "হ্যামকো ১০০ এম্পিয়ার",
    "হ্যামকো ১৩০ এম্পিয়ার",
    "হ্যামকো ১৬৫ এম্পিয়ার",
    "হ্যামকো ২০০ এম্পিয়ার",

    "অ্যাপোলো AB 17 পেলেট",
    "অ্যাপোলো AB 21 পেলেট",
    "অ্যাপোলো AB 27 পেলেট",
    "অ্যাপোলো AB 29 পেলেট",
    "অ্যাপোলো ১০০ এম্পিয়ার",
    "অ্যাপোলো ১৩০ এম্পিয়ার",
    "অ্যাপোলো ১৬৫ এম্পিয়ার",
    "অ্যাপোলো ২০০ এম্পিয়ার",
    "অ্যাপোলো টিউবলার ২২০ এম্পিয়ার",

    "ইভন ECV 17 পেলেট",
    "ইভন ECV 21 পেলেট",
    "ইভন ECV 27 পেলেট",
    "ইভন ECV 29 পেলেট",
    "ইভন ১০০ এম্পিয়ার",
    "ইভন ১৩০ এম্পিয়ার",
    "ইভন ১৬৫ এম্পিয়ার",
    "ইভন ২০০ এম্পিয়ার",
    "ইভন ২২০ এম্পিয়ার",

    "সাইফ পাওয়ার SEV 17 পেলেট",
    "সাইফ পাওয়ার SEV 21 পেলেট",
    "সাইফ পাওয়ার SEV 27 পেলেট",
    "সাইফ পাওয়ার SEV 29 পেলেট",
    "সাইফ পাওয়ার ১০০ এম্পিয়ার",
    "সাইফ পাওয়ার ১৩০ এম্পিয়ার",
    "সাইফ পাওয়ার ১৬৫ এম্পিয়ার",
    "সাইফ পাওয়ার ২০০ এম্পিয়ার",
    "সাইফ পাওয়ার ২০০ এম্পিয়ার টিউবলার ব্যাটারি",

    "লিড পাওয়ার AB 17 পেলেট",
    "লিড পাওয়ার AB 21 পেলেট",
    "লিড পাওয়ার AB 27 পেলেট",
    "লিড পাওয়ার AB 29 পেলেট",
    "লিড পাওয়ার ১০০ এম্পিয়ার",
    "লিড পাওয়ার ১৩০ এম্পিয়ার",
    "লিড পাওয়ার ১৬৫ এম্পিয়ার",
    "লিড পাওয়ার ২০০ এম্পিয়ার",
    "লিড পাওয়ার ২০০ এম্পিয়ার টিউবলার ব্যাটারি",

    "অন্যান্য ব্রান্ড 17 পেলেট",
    "অন্যান্য ব্রান্ড 21 পেলেট",
    "অন্যান্য ব্রান্ড 27 পেলেট",
    "অন্যান্য ব্রান্ড 29 পেলেট",
    "অন্যান্য ব্রান্ড ১০০ এম্পিয়ার",
    "অন্যান্য ব্রান্ড ১৩০ এম্পিয়ার",
    "অন্যান্য ব্রান্ড ১৬৫ এম্পিয়ার",
    "অন্যান্য ব্রান্ড ২০০ এম্পিয়ার",
    "অন্যান্য ব্রান্ড ২০০ এম্পিয়ার টিউবলার ব্যাটারি",
    "অন্যান্য ব্রান্ড ২২০ এম্পিয়ার টিউবলার ব্যাটারি"
]

export const productPowerRatings = [
    "300 VA 12 Volt",
    "400 VA 12 Volt",
    "500 VA 12 Volt",
    "650 VA 12 Volt",
    "850 VA 12 Volt",
    "600 VA 12 Volt",
    "800 VA 12 Volt",
    "1000 VA 12 Volt",
    "1050 VA 12 Volt",
    "1200 VA 12 Volt",
    "1250 VA 24 Volt",
    "1500 VA 24 Volt",
    "1800 VA 24 Volt",
    "2000 VA 24 Volt",
    "2500 VA 24 Volt",
    "3000 VA 24 Volt",
    "3000 VA 36 Volt",
    "3.5 kVA 36 Volt",
    "3.5 kVA 48 Volt",
    "4 kVA 48 Volt",
    "5 kVA 48 Volt",
]

export const discounts = {
    '1': 0,
    '3': 150,
    '6': 300,
    '12': 600,
    '18': 900,
    '24': 1200,
    '30': 1500,
    '36': 1800
}

export const feedbackQuestions = [
    {
        question: 'আপনার প্রডাক্ট এর সার্ভিসটি সঠিক ভাবে সমাধান করা হয়েছে কি না?',
        answer: '',
    },
    {
        question: 'প্রডাক্টটি ইনস্টলেশনটি নির্দিষ্ট সময়ের মধ্যে সম্পন্ন করা হয়েছে কি না?',
        answer: '',
    },
    {
        question: 'সার্ভিসের মান নিয়ে আপনি সন্তুষ্টি আছেন কি না?',
        answer: ''
    },
    {
        question: 'সার্ভিস এক্সপার্টের আচার আচরনে আপনি সন্তুষ্ট আছেন কি না?',
        answer: ''
    },
    {
        question: 'সার্ভিস এক্সপার্ট আপনার সার্ভিসটি যথা সময়ে গিয়েছিল কি ?',
        answer: ''
    }
]
export const customFeedbackQuestion = 'সার্ভিস এক্সপার্ট কি আপনার থেকে কোম্পানির সার্ভিসের সময়ে আপনার থেকে অতিরিক্ত কোন অর্থ চেয়েছে কি না?'

export const staffStats = {
    electrician: {
        "01312954819": {
            completedServices: 65,
            cancelledServices: 3
        },
        "01941952079": {
            completedServices: 2,
            cancelledServices: 0
        },
        "01822141812": {
            completedServices: 2,
            cancelledServices: 0
        },
        "01987361213": {
            completedServices: 1,
            cancelledServices: 0
        },
        "01703961705": {
            completedServices: 5,
            cancelledServices: 0
        },
        "01717111738": {
            completedServices: 13,
            cancelledServices: 1
        },
        "01845966186": {
            completedServices: 11,
            cancelledServices: 0
        },
        "01400831918": {
            completedServices: 12,
            cancelledServices: 0
        },
        "01310673600": {
            completedServices: 43,
            cancelledServices: 0
        }
    },
    technician: {
        "01310573600": {
            completedServices: 19,
            cancelledServices: 2
        },
        "01718400846": {
            completedServices: 5,
            cancelledServices: 0
        },
        "01932721383": {
            completedServices: 1,
            cancelledServices: 0
        },
        "01872502354": {
            completedServices: 18,
            cancelledServices: 1
        },
        "01726352478": {
            completedServices: 3,
            cancelledServices: 0
        },
        "01891899338": {
            completedServices: 4,
            cancelledServices: 0
        },
        "01705191005": {
            completedServices: 2,
            cancelledServices: 0
        },
        "01813947676": {
            completedServices: 4,
            cancelledServices: 0
        },
        "01309777917": {
            completedServices: 1,
            cancelledServices: 0
        },
        "01312954819": {
            completedServices: 16,
            cancelledServices: 2
        },
        "01310673600": {
            completedServices: 11,
            cancelledServices: 3
        }
    }
}

export const paymentDetails = {
    bkash: {
        number: "01322247774",
        name: "SE Electronics"
    },
    nagad: {
        number: "01310673600",
        name: "SE Electronics"
    },
    rocket: {
        number: "018199242847",
        name: "SE Electronics"
    },
    bank: {
        bankName: "Dutch-Bangla Bank Limited",
        accountNumber: "1211100053591",
        accountHolder: "SE Electronics",
        branch: "Sylhet Branch",
        routingNumber: "090913552",
        swiftCode: "DBBLBDDH"
    }
};