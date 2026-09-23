import "server-only";
import { contactDetails } from ".";

export const ApplicationMessages = {
  staff: {
    REG_INVITE: `এস ই ইলেকট্রনিকস এর সার্ভিস পয়েন্ট ও হাউস ওয়ারিং, অনলাইন ফর্ম আবেদন করতে লিংকটি ওপেন করে আবেদন করুন, এই ফর্মটির লিংক {registration_link_expiry} ঘন্টা পর অকার্যকর হয়ে যাবে {registration_link}`,
    ADMIN_NOTIF: ``,
    SUBMISSION: `প্রিয় {applicant_name},\nআপনার আবেদনটি সফলভাবে টেকনিশিয়ান সার্ভিস পয়েন্ট-এ জমা দেওয়া হয়েছে। আমরা আপনার তথ্য যাচাই করছি। যাচাই প্রক্রিয়া সম্পন্ন না হওয়া পর্যন্ত আমাদের সঙ্গে থাকার জন্য ধন্যবাদ।\nআবেদনটির স্ট্যাটাস ট্র্যাক করতে ভিজিট করুন\n{tracking_link}`,
    APPROVAL: `প্রিয় {applicant_name},\nঅভিনন্দন! আপনার আবেদনটি সফলভাবে যাচাই করা হয়েছে এবং টেকনিশিয়ান সার্ভিস পয়েন্ট-এ অনুমোদিত হয়েছে।\nযেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
    REJECTION: `প্রিয় {applicant_name},\nদুঃখিত,এনআইডি যাচাই সংক্রান্ত তথ্য ভুল থাকার কারণে আপনার আবেদনটি বাতিল করা হয়েছে।\nঅনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন।`,
    CREDENTIALS: `প্রিয় {staff_name},\nআপনার লগইন ক্রেডেনশিয়াল সেট করা হয়েছে।\nইউজারনেম: {username}\nপাসওয়ার্ড: {password}\nলগইন করতে ভিজিট করুন: ${contactDetails.baseUrl + "/staff/login"}`,
  },
  service: {
    ADMIN_NOTIF: `অনলাই সার্ভিসিং এর জন্য অনুরোধ করেছে তথ্য যাচাই করুন`,
    SUBMISSION: `প্রিয় {applicant_name},\nঅনলাইন সার্ভিসিং আইডি {service_id}, আপনার অনুরোধটি প্রাথমিক পর্যালোচনার পর্যায়ে রয়েছে। আপনার তথ্য ও সমস্যার যাচাই করে দেখছে, ধন্যবাদ।\nসকল তথ্য আপডেট পেতে ট্রেকিং লিংকটি ওপেন করুন। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}\n{tracking_link}`,
    APPROVAL: `প্রিয় গ্রাহক {applicant_name},\nSE ELECTRONICS আপনার সার্ভিসিং এর অনুরোধটি গ্রহণ করা হয়েছে সার্ভিস আই ডি নং {service_id}, যে কোন তথ্যের জন্য ${contactDetails.customerCare} সার্ভিস স্ট্যাটাস ট্র্যাক করতে লিঙ্কটিতে ক্লিক করুন\n{tracking_link}`,
    INSTALL_APPROVAL: `প্রিয় গ্রাহক {applicant_name},\nSE ELECTRONICS আপনার আই পি এস  হোম ইন্সটল এর অনুরোধটি গ্রহণ করা হয়েছে ইন্সটল আই ডি নং {service_id}, যে কোন তথ্যের জন্য ${contactDetails.customerCare} সার্ভিস স্ট্যাটাস ট্র্যাক করতে লিঙ্কটিতে ক্লিক করুন\n{tracking_link}`,
    REJECTION: `আমরা দুঃখিত যে আপনার সার্ভিসিং অনুরোধটি বাতিল করা হয়েছে। এই মুহূর্তে আমরা আপনার অনুরোধটি এগিয়ে নিতে পারছি না। বাতিলের কারণ বা অন্য কোনো সহায়তার জন্য অনুগ্রহ করে আমাদের কাস্টমার সাপোর্টের সাথেযোগাযোগ করুন। ${contactDetails.customerCare}, ${contactDetails.customerCare2}`,
  },
  subscription: {
    ADMIN_NOTIF: `আইপিএস, ব্যাটারি রক্ষণাবেক্ষণের সাবস্ক্রিপশন এর জন্য অনুরোধ করেছে তথ্য ও পেমেন্ট যাচাই করুন`,
    SUBMISSION: `প্রিয় {applicant_name},\nআপনার পছন্দের সাবস্ক্রিপশন প্যাকেজটির আবেদন সফলভাবে সাবমিট করেছেন, সাবস্ক্রিপশন আইডি {subscription_id} আপনার দেওয়া তথ্য ও পেমেন্ট সংক্রান্ত বিষয় যাচাই করে পরে ধাপে এগিয়ে যাব। সকল তথ্য আপডেট পেতে ট্রেকিং লিংকটি ওপেন করুন। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}\n{tracking_link}`,
    APPROVAL: `প্রিয় {applicant_name},\nঅভিনন্দন! আপনার পছন্দের সাবস্ক্রিপশন প্যাকেজটির আবেদন সফলভাবে যাচাই করা হয়েছে এবং সার্ভিস পয়েন্ট-এ অনুমোদিত হয়েছে৷ যেকোনো তথ্যের জন্য 0964935555`,
    REJECTION: `আমরা দুঃখিত যে আপনার সাবস্ক্রিপশন অনুরোধটি বাতিল করা হয়েছে। এই মুহূর্তে আমরা আপনার অনুরোধটি এগিয়ে নিতে পারছি না। বাতিলের কারণ বা অন্য কোনো সহায়তার জন্য অনুগ্রহ করে আমাদের কাস্টমার সাপোর্টের সাথে যোগাযোগ করুন। ${contactDetails.customerCare}, ${contactDetails.customerCare2}`,
    EXPIRY_NOTICE: `প্রিয় {applicant_name},\nআপনার সাবস্ক্রিপশন আইডি {subscription_id} এর মেয়াদ শেষ হয়েছে। পুনরায় রিনিউ করতে বা বিস্তারিত জানতে কাস্টমার কেয়ারে যোগাযোগ করুন। ${contactDetails.customerCare}`,
  },
  vip_card: {
    ADMIN_NOTIF: `নতুন ভিআইপি কার্ড এর জন্য আবেদন করেছে তথ্য যাচাই করুন`,
    SUBMISSION: `প্রিয় {applicant_name},\nআপনার ভিআইপি কার্ড পাওয়ার আবেদনটি সফলভাবে জমা দেওয়া হয়েছে। আপনার তথ্যগুলি আমাদের টিম যাচাই করছে। যাচাই শেষ হলে আপনাকে জানিয়ে দেওয়া হবে।\nধন্যবাদ।`,
    APPROVAL: `প্রিয় {applicant_name},\nঅভিনন্দন! আপনার ভিআইপি কার্ড আবেদনটি অনুমোদিত হয়েছে। আপনার কার্ড নম্বর: {card_number}। আপনার ড্যাশবোর্ডে এখন থেকে ভিআইপি কার্ডটি দেখতে পারবেন।`,
    REJECTION: `প্রিয় {applicant_name},\nদুঃখিত, আপনার ভিআইপি কার্ড আবেদনটি গ্রহণ করা সম্ভব হয়নি। বিস্তারিত জানতে কাস্টমার কেয়ারে যোগাযোগ করুন। ${contactDetails.customerCare}`,
  },
};

export const SellerMessages = {
  REG_INVITE: `এস ই ইলেকট্রনিকস এর অথরাইজড সেলার/ডিলার হিসেবে যুক্ত হতে অনলাইন ফর্মটি পূরণ করুন। এই লিংকটি {registration_link_expiry} ঘন্টা পর অকার্যকর হয়ে যাবে {registration_link}`,
  SUBMISSION: `প্রিয় {applicant_name},\nআপনার সেলার আবেদনটি SE ELECTRONICS এ সফলভাবে জমা হয়েছে। আমরা আপনার তথ্য ও ডকুমেন্ট যাচাই করছি।\nআবেদনটির স্ট্যাটাস ট্র্যাক করতে ভিজিট করুন\n{tracking_link}`,
  APPROVAL: `প্রিয় {applicant_name},\nঅভিনন্দন! আপনার সেলার আবেদনটি যাচাই করা হয়েছে এবং SE ELECTRONICS অথরাইজড সেলার হিসেবে অনুমোদিত হয়েছে।\nসেলার আইডি: {seller_id}\nলগইন তথ্য শীঘ্রই পাঠানো হবে। যেকোনো তথ্যের জন্য ${contactDetails.customerCare}`,
  REJECTION: `প্রিয় {applicant_name},\nদুঃখিত, ডকুমেন্ট যাচাই সংক্রান্ত সমস্যার কারণে আপনার সেলার আবেদনটি বাতিল করা হয়েছে।\nঅনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন। ${contactDetails.customerCare}`,
  CREDENTIALS: `প্রিয় {seller_name},\nআপনার সেলার পোর্টালের লগইন তথ্য:\nসেলার আইডি: {seller_id}\nইউজারনেম: {username}\nপাসওয়ার্ড: {password}\nলগইন করতে ভিজিট করুন: {login_url}`,
  ACCOUNT_BLOCKED: `প্রিয় {seller_name},\nআপনার সেলার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ (Blocked) করা হয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন। ${contactDetails.customerCare}`,
  ACCOUNT_ACTIVATED: `প্রিয় {seller_name},\nআপনার সেলার অ্যাকাউন্টটি পুনরায় সক্রিয় (Activated) করা হয়েছে। ${contactDetails.customerCare}`,
};

export const MediaDownloadMessages = {
  CUSTOMER_INVOICE: `স্বাগতম প্রিয় গ্রাহক {name},
এস ই ইলেকট্রনিকস থেকে পন্য ক্রয় করার জন্য আপনাকে ধন্যবাদ। আপনার একটি প্রোফাইল তৈরি হয়েছে।
কাস্টমার আইডি: {customer_id} দিয়ে লগইন করতে নিচের লিংকটি ক্লিক করুন। পণ্যের তথ্য, সার্ভিসসহ যাবতীয় সকল কিছু দেখতে লগইন করে হোম পেজে প্রবেশ করুন। লগইন লিংক: ${contactDetails?.baseUrl + "/customer/login"} , ইনভয়েস ডাউনলোড লিংক: {download_link}
কাস্টমার কেয়ার: ${contactDetails.customerCare}`,
  CUSTOMER_REGISTRATION: `স্বাগতম প্রিয় গ্রাহক {name}, \nএস ই ইলেকট্রনিকস থেকে পন্য ক্রয় করার জন্য আপনাকে ধন্যবাদ। আপনার একটি প্রোফাইল তৈরি হয়েছে। কাস্টমার আই ডি : {customer_id} এবং ইনভয়েস নম্বর: {invoice_number} দিয়ে লগিং করতে লিংকটি ক্লিক করুন। পন্যের তথ্য , সার্ভিস যাবতীয় সকল কিছু  দেখতে লগিং করে হোম পেইজে রাখুন।\n
লগইন করে ইনভয়েস ডাউনলোড করতে ভিজিট করুন: ${contactDetails?.baseUrl + "/customer/login"}। কাস্টমার কেয়ার ${contactDetails.customerCare}
  `,
  INSTALL_PAYMENT_INVOICE: `প্রিয় {name},\nSEELECTRONICS আপনার IPS ইনস্টল এর পেমেন্ট করা হয়েছে। নিচে ইনভয়েস সম্পর্কিত তথ্য দেওয়া হলো:\nইনভয়েস নম্বর: {invoice_number}\nতারিখ: {date}\nমোট পরিমাণ: {total_price}\nইনভয়েসটি দেখতে বা ডাউনলোড করতে এই লিঙ্কটি ব্যবহার করুন: {download_link}\nকাস্টমার কেয়ার ${contactDetails.customerCare}।`,
  REPAIR_PAYMENT_INVOICE: `প্রিয় {name},\nSEELECTRONICS আপনার IPS সার্ভিসিং এর পেমেন্ট করা হয়েছে। নিচে ইনভয়েস সম্পর্কিত তথ্য দেওয়া হলো:\nইনভয়েস নম্বর: {invoice_number}\nতারিখ: {date}\nমোট পরিমাণ: {total_price}\nইনভয়েসটি দেখতে বা ডাউনলোড করতে এই লিঙ্কটি ব্যবহার করুন: {download_link}\nকাস্টমার কেয়ার ${contactDetails.customerCare}।`,
  TECHNICIAN_ID_CARD: `প্রিয় {staff_name},\nএস ই ইলেকট্রনিকস সার্ভিস পয়েন্ট আপনাকে স্বাগতম আপনার টেকনিশিয়ান আই ডি কার্ড টি ডাউনলোড করতে লিংকটি ক্লিক করুন।\n{download_link}\nকাস্টমার কেয়ার 0964935555`,
  ELECTRICIAN_ID_CARD: `প্রিয় {staff_name},\nএস ই ইলেকট্রনিকস সার্ভিস পয়েন্ট আপনাকে স্বাগতম আপনার ইলেকট্রিশিয়ান আই ডি কার্ড টি ডাউনলোড করতে লিংকটি ক্লিক করুন।\n{download_link}\nকাস্টমার কেয়ার 0964935555`,
  CERTIFICATE_DOWNLOAD: `প্রিয় {shop_owner_name} সার্ভিস পয়েন্ট SEELECTRONICS আপনাকে সার্টিফিকেট প্রধান করেছে ডাউনলোড করে সংরক্ষণ করুন ভবিষ্যতে সকল সুযোগ সুবিধার পাওয়ার জন্য\n{download_link}`,
};

export const ServiceMessages = {
  CUSTOMER_REPAIR: `প্রিয় গ্রাহক {customer_name}, 
আপনার {service_id} সার্ভিসটি সমাধানের জন্য সার্ভিস টিম নিয়োগ করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে আপনার ড্যাশবোর্ড চেক করুন।`,
  CUSTOMER_INSTALL: `প্রিয় গ্রাহক {customer_name},\nআপনার {service_id} প্যাকেজ টি হোম ইন্সটলেশন করার জন্য অফিসিয়াল ইন্সটল টিমকে নিযুক্ত করা হয়েছে। দ্রুত সময়ের মধ্যে ইন্সটল টিম আপনার সাথে যোগাযোগ করে সমাধান করবে। যে কোন তথ্যের জন্য ${contactDetails.customerCare}`,
  TECHNICIAN_APPOINT:
    "জনাব {staff_name},\nআপনাকে এস ই ইলেকট্রনিক্স কোম্পানির পন্য সার্ভিস করার জন্য নিয়োগ করা হয়েছে আপনি সম্মানিত কাস্টমার এর সাথে যোগাযোগ করে পন্যটির সমাধান দিন ধন্যবাদ।\nকাস্টমার নাম : {customer_name}\nকাস্টমার ফোন : {customer_phone}\nকাস্টমার সার্ভিস আই ডি নং : {service_id}\nপ্রোডাক্ট মডেল : {product_model}\nকাস্টমার লোকেশন : {customer_address}\nসার্ভিসিং সম্পর্কে তথ্য প্রদান করতে লিঙ্কটিতে ক্লিক করুন {service_report_url}",
  ELECTRICIAN_APPOINT:
    "জনাব {staff_name},\nআপনাকে এস ই ইলেকট্রনিক্স কোম্পানির পন্য IPS ইন্সটল করার জন্য নিয়োগ করা হয়েছে আপনি সম্মানিত কাস্টমার এর সাথে যোগাযোগ করে পন্যটির সমাধান দিন ধন্যবাদ।\nকাস্টমার নাম : {customer_name}\nকাস্টমার ফোন : {customer_phone}\nকাস্টমার সার্ভিস আই ডি নং : {service_id}\nপ্রোডাক্ট মডেল : {product_model}\nকাস্টমার লোকেশন : {customer_address}\nসার্ভিসিং সম্পর্কে তথ্য প্রদান করতে লিঙ্কটিতে ক্লিক করুন {service_report_url}",
  CONFIRMATION: `প্রিয় গ্রাহক {customer_name},\nSE ELECTRONICS আপনার সার্ভিসিং এর অনুরোধটি গ্রহণ করা হয়েছে সার্ভিস আই ডি নং {service_id}, যে কোন তথ্যের জন্য ${contactDetails.customerCare} সার্ভিস স্ট্যাটাস ট্র্যাক করতে লিঙ্কটিতে ক্লিক করুন\n{tracking_link}`,
  INSTALL_CONFIRMATION: `প্রিয় গ্রাহক {customer_name},\nSE ELECTRONICS আপনার আই পি এস  হোম ইন্সটল এর অনুরোধটি গ্রহণ করা হয়েছে ইন্সটল আই ডি নং {service_id}, যে কোন তথ্যের জন্য ${contactDetails.customerCare} সার্ভিস স্ট্যাটাস ট্র্যাক করতে লিঙ্কটিতে ক্লিক করুন\n{tracking_link}`,
  COMPLETION_INSTALL: `প্রিয় গ্রাহক {customer_name},\nআপনার IPS প্যাকেজ ইন্সটল সার্ভিস {service_id}, হাউস ওয়ারিং কাজ শেষ হয়েছে৷ অনুগ্রহ করে আপনার ফিডব্যাক এর জন্য ক্লিক করুন:\n{feedback_url}`,
  COMPLETION_REPAIR: `প্রিয় গ্রাহক {customer_name},\nআপনার সার্ভিস {service_id} সার্ভিসটি সমাধান করা হয়েছে। অনুগ্রহ করে আপনার ফিডব্যাক এর জন্য ক্লিক করুন:\n{feedback_url}`,
};

export const SubscriptionServiceMessages: Record<string, string> = {
  battery_maintenance: `প্রিয় {name}, আপনার ব্যাটারি রক্ষণাবেক্ষণ সার্ভিসের {servicesCompleted} নম্বর সার্ভিসটি সম্পন্ন হয়েছে। সাথে থাকার জন্য ধন্যবাদ।`,
  ips_and_battery_maintenance: `প্রিয় {name}, আপনার আইপিএস ও ব্যাটারি রক্ষণাবেক্ষণ সার্ভিসের {servicesCompleted} নম্বর সার্ভিসটি সম্পন্ন হয়েছে। সাথে থাকার জন্য ধন্যবাদ।`,
  full_maintenance: `প্রিয় {name}, আপনার সম্পূর্ণ রক্ষণাবেক্ষণ সাবস্ক্রিপশনের {servicesCompleted} নম্বর সার্ভিসটি সম্পন্ন হয়েছে। সাথে থাকার জন্য ধন্যবাদ।`,
};
