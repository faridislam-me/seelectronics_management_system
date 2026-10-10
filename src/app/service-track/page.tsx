import { getServiceById } from "@/actions";
import {
  ImageWithLightbox,
  ServiceTrackingPageThemeColor,
  Timestamp,
} from "@/components";
import { contactDetails } from "@/constants";
import { verifySession } from "@/lib";
import { AppError, formatDate, renderText } from "@/utils";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, ChevronRight, Clock, History, IdCard, MapPin, Package, Phone, ShieldCheck, Truck, User, Wrench, XCircle } from "lucide-react";
import LiveTrackingMap from "@/components/features/tracking/LiveTrackingMap";
import LocationAccessCard from "@/components/features/tracking/LocationAccessCard";
import Link from "next/link";
import { notFound } from "next/navigation";

const technicianStatuses = {
  pending: {
    title: "আপনার সার্ভিস অনুরোধটি গ্রহন করা হয়েছে।",
    description: `প্রিয় গ্রাহক {customer_name}, আপনার পন্যটির সার্ভিস অনুরোধটি গ্রহন করা হয়েছে।
সার্ভিস আই ডি: {serviceId} সার্ভিসিং এর জন্য অতি শ্রীগ্রই সার্ভিস টিমকে নিযুক্ত করা হবে। সময় দিয়ে আমাদের সহযোগিতা করবেন ধন্যাবাদ।`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    color: "blue",
  },
  in_progress: {
    title: "সার্ভিস টিমকে নিযুক্ত করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আপনার আবেদনের প্রেক্ষিতে আপনার পন্যটি সার্ভিস করা জন্য আমাদের অফিসিয়াল সার্ভিস টিমকে নিয়োগ দেওয়া হয়েছে। অতি শ্রীগ্রই তারা আপনার সাথে যোগাযোগ করবে।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      </svg>
    ),
    color: "yellow",
  },
  appointment_retry: {
    title: "নিযুক্ত সার্ভিস টিম অনুরোধটি কেন্সেল করেছে।",
    description:
      "দুঃখীত। আপনার পন্যটি সার্ভিস করার জন্য যে সার্ভিস টিম নিয়োগ করা হয়েছিল, অনাকাঙ্ক্ষিত সমস্যার কারনে সার্ভিস টিমটি অনুরোধটি কেন্সেল করেছে। আমরা পুনরায় আপনার জন্য নতুন সার্ভিস টিম নিয়োগ দিচ্ছি আশা করি অতি দ্রুত সার্ভিস টিম নিযুক্ত করা হবে।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
    ),
    color: "yellow",
  },
  service_center: {
    title: "পন্যটি অফিসিয়াল সার্ভিসিং সেন্টারে পাঠানো হয়েছে।",
    description:
      "প্রিয় গ্রাহক {customer_name}, আপনার পন্যটি ({serviceId}) সার্ভিসিং করার জন্য আমাদের অফিসিয়াল সার্ভিস টিম আপনার ঠিকানায় গিয়ে ছিল। পন্যটির বড় ধরনের ত্রুটির কারনে হোম সার্ভিসিং করা সম্ভব না, তাই আমাদের অফিসিয়াল সার্ভিসিং সেন্টারে পাঠানো হয়েছে। আশা করি ১/২ দিনের মধ্যেই আপনার পন্যটির সমস্যা সমাধান করা হবে।সময় দিয়ে আমাদের সহযোগিতা করবেন ধন্যাবাদ।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
        />
      </svg>
    ),
    color: "blue",
  },
  service_center_received: {
    title: "পন্যটি সার্ভিসিং সেন্টারে রিসিভ করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আপনার পন্যটি ({serviceId}) সার্ভিসিং করার জন্য আমাদের অফিসিয়াল সার্ভিসিং সেন্টারে সিলেট এসেছে। পন্যটির বড় ধরনের ত্রুটির কারনে, আমাদের দক্ষ ইঞ্জিনিয়ার পর্যবেক্ষণ করে আপনার পন্যটির ত্রুটির সমাধান করবে। সময় দিয়ে আমাদের সহযোগিতা করবেন ধন্যাবাদ।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
        />
      </svg>
    ),
    color: "blue",
  },
  staff_departed: {
    title: "সার্ভিস টিম লোকেশনের উদ্দেশ্যে রওনা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আমাদের অফিসিয়াল সার্ভিস টিম আপনার দেওয়া ঠিকানার উদ্দেশ্যে রওনা হয়েছে। অতি শ্রীগ্রই আমাদের সার্ভিস টিম আপনার গন্তব্যে যথা সময়ে পৌঁছাবে আশা করছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
        />
      </svg>
    ),
    color: "yellow",
  },
  staff_arrived: {
    title: "সার্ভিস টিম লোকেশনের ঠিকানায় পৌঁছেছে।",
    description:
      "আমাদের অফিসিয়াল সার্ভিস টিম আপনার দেওয়া ঠিকানারয় পৌঁছেছে অতি শ্রীগ্রই সার্ভিস টিম আপনার পন্যটির সমস্যা সমাধানের জন্য পরিক্ষা নীরিক্ষার কাজ শুরু করবে আশা করছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
    color: "blue",
  },
  completed: {
    title: "আপনার পন্যটি সমস্যার সমাধান করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক আপনার পন্যটি আমাদের সার্ভিস টিম দক্ষতার সাথে পন্যটির সকল সমস্যার সমাধান করা হয়েছে এখন সম্পূর্ন ঠিক আছে। আশা করি এস ই ইলেকট্রনিক্স পরিবার আপনাকে সন্তষ্ট করতে পেরেছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
    color: "green",
  },
  canceled: {
    title: "সার্ভিসিং বাতিল করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আপনার আবেদন কৃত পন্যটির আমাদের সার্ভিস টিম কোন সমস্যা না পাওয়ার কারণে আপনার সার্ভিসিংটি বাতিল করা হলো।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    ),
    color: "yellow",
  },
};

const electricianStatuses = {
  pending: {
    title: "আপনার হোম ইনস্টল অনুরোধটি গ্রহন করা হয়েছে।",
    description: `প্রিয় গ্রাহক {customer_name}, আপনার IPS হোম ইনস্টল অনুরোধটি গ্রহন করা হয়েছে।
ইনস্টল আই ডি: {serviceId} হোম ইনস্টল এর জন্য অতি শ্রীগ্রই অফিসিয়াল ইলেকট্রিশিয়ান টিমকে নিযুক্ত করা হবে। সময় দিয়ে আমাদের সহযোগিতা করবেন ধন্যাবাদ।`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    color: "blue",
  },
  in_progress: {
    title: "হাউস ওয়ারিং ইন্সটল টিমকে নিযুক্ত করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আপনার আবেদনের প্রেক্ষিতে আপনার পন্যটি হোম ইনস্টল করা জন্য আমাদের অফিসিয়াল হাউস ওয়ারিং ইনস্টল টিমকে নিয়োগ দেওয়া হয়েছে। অতি শ্রীগ্রই তারা আপনার সাথে যোগাযোগ করবে।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      </svg>
    ),
    color: "blue",
  },
  appointment_retry: {
    title: "নিযুক্ত হোম ইনস্টল টিম অনুরোধটি  কেন্সেল করেছে।",
    description: `দুঃখীত। আপনার পন্যটি হাউস ওয়ারিং ইনস্টল করার জন্য যে ইনস্টল টিম নিয়োগ করা হয়েছিল,
অনাকাঙ্ক্ষিত সমস্যার কারনে হাউস ওয়ারিং ইনস্টল টিমটি অনুরোধটি কেন্সেল করেছে। আমরা পুনরায় আপনার জন্য নতুন সার্ভিস টিম নিয়োগ দিচ্ছি আশা করি অতি দ্রুত হাউস ওয়ারিং ইনস্টল টিম নিযুক্ত করা হবে।`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
    ),
    color: "red",
  },
  staff_departed: {
    title: "হাউস ওয়ারিং ইলেকট্রিশিয়ান টিম লোকেশনের উদ্দেশ্যে রওনা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আমাদের অফিসিয়াল হাউস ওয়ারিং ইনস্টল টিম আপনার দেওয়া ঠিকানার উদ্দেশ্যে রওনা হয়েছে। অতি শ্রীগ্রই আমাদের হোম ইনস্টল টিম আপনার গন্তব্যে যথা সময়ে পৌঁছাবে আশা করছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.11-.504 1.11-1.125v-3.75m-17.25 0h16.5m0 0V7.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v3.75m17.25 0v3.375c0 .621-.504 1.125-1.125 1.125h-16.5a1.125 1.125 0 0 1-1.125-1.125v-3.375"
        />
      </svg>
    ),
    color: "blue",
  },
  staff_arrived: {
    title: "হাউস ওয়ারিং ইলেকট্রিশিয়ান টিম লোকেশনের ঠিকানায় পৌঁছেছে।",
    description:
      "আমাদের অফিসিয়াল হাউস ওয়ারিং ইনস্টল টিম আপনার দেওয়া ঠিকানারয় পৌঁছেছে অতি শ্রীগ্রই IPS হোম ইনস্টল টিম আপনার হাউস ওয়ারিং ইনস্টলেশনের কাজ শুরু করবে আশা করছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
    color: "blue",
  },
  completed: {
    title: "আপনার IPS প্যাকেজ টি প্রদত্ত ঠিকানায় ইন্সটলের কাজ শেষ করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক আপনার IPS প্যাকেজ টি আমাদের অফিসিয়াল হাউস ওয়ারিং ইনস্টল টিম দক্ষতার সঙ্গে আপনার প্রদত্ত ঠিকানায় হাউস ওয়ারিং IPS ইন্সটল করেছেন। সম্পূর্ন ভাবে সব কিছু ঠিক আছে। আশা করি এস ই ইলেকট্রনিক্স পরিবার আপনাকে সন্তষ্ট করতে পেরেছি।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 12.75 6 6 9-13.5"
        />
      </svg>
    ),
    color: "green",
  },
  canceled: {
    title: "আপনার IPS প্যাকেজ ইন্সটলটি কেন্সেল করা হয়েছে।",
    description:
      "প্রিয় গ্রাহক, আপনার IPS প্যাকেজ হোম ইন্সটল কায্যক্রমটি কেন্সেল করা হয়েছে, কি কারনে ইন্সটল কেন্সেল করা হয়েছে আশা করি আপনি অবগত আছেন।",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    ),
    color: "red",
  },
};

const toneColors: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: "bg-[#1f7cf0]", text: "text-[#5aa2ff]", ring: "bg-[#1f7cf0]/40" },
  yellow: { bg: "bg-[#e9a800]", text: "text-[#ffc629]", ring: "bg-[#e9a800]/40" },
  green: { bg: "bg-[#16a34a]", text: "text-[#34d36b]", ring: "bg-[#16a34a]/40" },
  red: { bg: "bg-[#e0243f]", text: "text-[#ff5a6e]", ring: "bg-[#e0243f]/40" },
};

const cardCls = "rounded-md border border-[#1d3d7a] bg-[linear-gradient(135deg,#0c2254_0%,#0a1a40_100%)] shadow-[0_6px_18px_rgba(0,0,0,0.25)]";

export default async function ServiceTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ trackingId: string }>;
}) {
  const params = await searchParams;
  if (!params.trackingId) {
    notFound();
  }

  const response = await getServiceById(params.trackingId, { publicLink: true });

  if (!response.success || !response.data) {
    throw new AppError("ট্র্যাকিং আইডিটি সঠিক নয় অথবা খুঁজে পাওয়া যায়নি।");
  }
  const serviceData = response.data;
  // Older services can have no status history rows; fall back to a single step
  // built from the service itself instead of crashing.
  const statusHistory: typeof serviceData.statusHistory = serviceData.statusHistory?.length
    ? serviceData.statusHistory
    : ([
        {
          id: `initial-${serviceData.serviceId}`,
          serviceId: serviceData.serviceId,
          statusType: "system",
          status: serviceData.status ?? "pending",
          customLabel: null,
          customNote: null,
          cancelReason: null,
          createdAt: serviceData.createdAt,
        },
      ] as unknown as typeof serviceData.statusHistory);
  const currentStatus = statusHistory[statusHistory.length - 1].status;
  const appointedStaffPhotoUrl =
    serviceData.appointedStaff &&
    "photoUrl" in serviceData.appointedStaff &&
    serviceData.appointedStaff.photoUrl
      ? serviceData.appointedStaff.photoUrl
      : "";

  const session = await verifySession(false);
  const profileHref =
    session?.role === "customer"
      ? "/customer/profile"
      : session?.role === "staff"
        ? "/staff/profile"
        : null;

  const isWarrantyCancelled = Boolean(serviceData?.customer?.isWarrantyStopped);
  const isWarrantyValid = !isWarrantyCancelled && (serviceData?.warrantyExpiryDate
    ? new Date(serviceData.warrantyExpiryDate) >= new Date()
    : false);
  const isInstall = serviceData.type === "install";
  const staffPhone = serviceData.appointedStaff?.phone || serviceData.staffPhone;
  const chip =
    currentStatus === "completed"
      ? { label: "সম্পন্ন হয়েছে", cls: "bg-[#0f5a2c] border-[#22c55e] text-[#7df0a5]", Icon: CheckCircle2 }
      : currentStatus === "canceled"
        ? { label: "বাতিল করা হয়েছে", cls: "bg-[#5a0f1c] border-[#ef4444] text-[#ff9aa6]", Icon: XCircle }
        : { label: "চলমান", cls: "bg-[#0f2f6a] border-[#1f7cf0] text-[#8fc0ff]", Icon: Clock };

  return (
    <div className="bg-[#061433] bg-[radial-gradient(120%_60%_at_50%_0%,#0d2a66_0%,#061433_60%)] min-h-screen overflow-y-auto text-white">
      <ServiceTrackingPageThemeColor />
      <div className="mx-auto max-w-[600px] px-2 pt-2 pb-6 flex flex-col gap-2.5">
        {/* Page header */}
        <section className={clsx(cardCls, "relative overflow-hidden p-2.5 flex items-center gap-2.5")}>
          {profileHref ? (
            <Link href={profileHref} aria-label="Back" className="size-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
          ) : null}
          <span className="size-10 rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0 shadow-[0_0_0_3px_rgba(31,124,240,0.25)]"><MapPin size={20} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[19px] font-extrabold">ট্র্যাকিং পেইজ</span>
            <span className="text-[11.5px] text-white/80">আপনার অর্ডার/সার্ভিসের বর্তমান অবস্থা দেখুন</span>
            <span className={clsx("mt-0.5 text-[11px] font-bold", isInstall ? "text-[#ffc629]" : "text-[#8fc0ff]")}>এস ই ইলেকট্রনিকস গ্রাহক সেবা সার্ভিসিং তথ্য ট্রেকিং</span>
          </span>
          <span className="relative shrink-0 w-[64px] h-[48px] hidden min-[360px]:block" aria-hidden="true">
            <span className="absolute inset-x-0 bottom-1 border-t border-dashed border-[#5aa2ff]/60" />
            <MapPin size={18} className="absolute right-6 top-0 text-[#34d3c5]" />
            <Truck size={30} className="absolute right-0 bottom-0 text-[#5aa2ff]" />
          </span>
        </section>

        {/* Tracking ID card */}
        <section className={clsx(cardCls, "p-2.5 flex flex-col gap-2.5")}>
          <div className="flex items-center gap-2.5">
            <span className="size-11 rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0"><Package size={22} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-[12px] text-[#8fc0ff] font-semibold">ট্রেকিং নম্বর</span>
              <span className="text-[17px] font-extrabold tracking-wide truncate">{serviceData.serviceId}</span>
            </span>
            <span className={clsx("shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-[12px] font-extrabold", chip.cls)}><chip.Icon size={15} />{chip.label}</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-2.5 text-[11px]">
            <span className="flex items-center gap-1.5 pr-1.5 min-w-0"><span className="size-7 rounded-md bg-[#1f7cf0]/20 text-[#5aa2ff] flex items-center justify-center shrink-0"><Calendar size={15} /></span><span className="flex flex-col min-w-0"><span className="text-white/70">নিবন্ধন তারিখ</span><b className="text-[12px] truncate">{formatDate(serviceData.createdAt)}</b></span></span>
            <span className="flex items-center gap-1.5 px-1.5 min-w-0"><span className="size-7 rounded-md bg-[#1f7cf0]/20 text-[#5aa2ff] flex items-center justify-center shrink-0"><ShieldCheck size={15} /></span><span className="flex flex-col min-w-0"><span className="text-white/70">পণ্য ওয়ারেন্টি</span><b className={clsx("text-[11px] inline-flex items-center gap-0.5", isWarrantyValid ? "text-[#34d36b]" : "text-[#ff5a6e]")}>{!isWarrantyValid && <AlertTriangle className="size-3 shrink-0" />}{isWarrantyValid ? "ওয়ারেন্টি চালু আছে" : isWarrantyCancelled ? "ওয়ারেন্টি বাতিল" : "ওয়ারেন্টি শেষ"}</b></span></span>
            <span className="flex items-center gap-1.5 pl-1.5 min-w-0"><span className="size-7 rounded-md bg-[#1f7cf0]/20 text-[#5aa2ff] flex items-center justify-center shrink-0"><Wrench size={15} /></span><span className="flex flex-col min-w-0"><span className="text-white/70">সার্ভিস টাইপ</span><b className="text-[12px] uppercase truncate">{serviceData.productType}</b></span></span>
          </div>
          <div className="rounded-md bg-white/5 border border-white/10 px-2.5 py-2 flex flex-col gap-1 text-[12px]">
            <span className="flex gap-2"><span className="w-24 shrink-0 text-white/70">হেল্প নাম্বার</span><span className="text-white/50">:</span><a href={`tel:${contactDetails.customerCare}`} className="font-bold truncate">{contactDetails.customerCare}</a></span>
            <span className="flex gap-2"><span className="w-24 shrink-0 text-white/70">হেড অফিস</span><span className="text-white/50">:</span><span className="font-bold">{contactDetails.headOffice}</span></span>
            {serviceData?.warrantyExpiryDate && (
              <span className="flex gap-2"><span className="w-24 shrink-0 text-white/70">মেয়াদ উত্তীর্ণ</span><span className="text-white/50">:</span><span className="font-bold text-white/90">{formatDate(serviceData.warrantyExpiryDate)}</span></span>
            )}
          </div>
        </section>

        {/* History header */}
        <section className={clsx(cardCls, "p-2.5 flex items-center gap-2.5")}>
          <span className="size-10 rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0"><History size={20} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-extrabold">ট্র্যাকিং হিস্ট্রি</span>
            <span className="text-[11.5px] text-[#8fc0ff]">আপনার রিকুয়েস্টের প্রতিটি ধাপ এখানে দেখুন</span>
          </span>
        </section>

        {/* Event History */}
        <section className={clsx(cardCls, "p-2.5")}>
          <ul className="flex flex-col">
            {statusHistory.map(
              ({
                id,
                statusType,
                status,
                customLabel,
                customNote,
                cancelReason,
                createdAt,
              }) => {
                const statusData =
                  serviceData.type === "install"
                    ? electricianStatuses[
                        status as keyof typeof electricianStatuses
                      ]
                    : technicianStatuses[
                        status as keyof typeof technicianStatuses
                      ];

                const isLastOne =
                  id === statusHistory[statusHistory.length - 1].id;
                const isFirstOne = id === statusHistory[0].id;
                const isCompleted = status === "completed";
                const isCanceled = status === "canceled";
                const isCustomStatus = statusType === "custom";
                const tone = toneColors[isCustomStatus ? "blue" : statusData?.color || "blue"] || toneColors.blue;
                const titleCls =
                  status === "appointment_retry"
                    ? "text-[#ff5a6e]"
                    : status === "completed"
                      ? "text-[#34d36b]"
                      : serviceData?.type === "install"
                        ? "text-[#ffc629]"
                        : tone.text;

                return (
                  <li key={id} className="relative flex gap-2.5">
                    {(!isLastOne ||
                      isFirstOne ||
                      (!isCanceled && !isCompleted)) && (
                      <span className="absolute left-0 top-0 w-7 h-full flex justify-center"><span className="w-0.5 h-full bg-[linear-gradient(180deg,#1f7cf0,#1f7cf0aa)]" /></span>
                    )}
                    <span className="relative size-7 min-w-7 shrink-0">
                      {isLastOne && <span className={clsx("absolute inset-0 rounded-full animate-ping", tone.ring)} />}
                      <span className={clsx("relative size-7 rounded-full flex items-center justify-center text-white ring-2 ring-[#0a1a40]", tone.bg, isLastOne && "animate-pulse")}>
                        {isCustomStatus ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                            />
                          </svg>
                        ) : (
                          statusData?.icon
                        )}
                      </span>
                    </span>
                    <div className={clsx("flex-1 min-w-0 mb-2 rounded-md border px-2.5 py-2 flex flex-col gap-1", isLastOne ? "border-[#2a5bb5] bg-[#0f2a60]/70" : "border-white/10 bg-white/[0.03]")}>
                      <span className={clsx("text-[14px] font-extrabold leading-snug", titleCls)}>
                        {isCustomStatus ? customLabel : statusData?.title}
                      </span>
                      <p className="text-[12.5px] leading-relaxed text-white/85">
                        {isCustomStatus
                          ? customNote
                          : isCanceled && cancelReason
                            ? cancelReason
                            : renderText(statusData?.description, {
                                serviceId: serviceData?.serviceId,
                                customer_name: serviceData?.customerName,
                              })}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-[#8fc0ff]"><Calendar size={13} className="shrink-0" /><Timestamp timestamp={createdAt} /></span>
                    </div>
                  </li>
                );
              },
            )}

            {currentStatus !== "completed" && currentStatus !== "canceled" && (
              <li className="flex gap-2.5 opacity-60">
                <span className="size-7 min-w-7 rounded-full bg-gray-500 flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </span>

                {serviceData.type === "install" ? (
                  <div className="flex-1 rounded-md border border-dashed border-white/15 px-2.5 py-2 flex flex-col gap-1">
                    <span className="text-white font-bold text-[14px]">
                      আপনার IPS প্যাকেজ টি প্রদত্ত ঠিকানায় ইন্সটলের কাজ শেষ করা
                      হয়েছে।
                    </span>
                    <p className="text-[12.5px] text-gray-300">
                      প্রিয় গ্রাহক, আপনার IPS প্যাকেজ টি আমাদের ইন্সটল টিম
                      দক্ষতার সঙ্গে আপনার প্রদত্ত ঠিকানায় হাউস ওয়ারিং IPS
                      ইন্সটল করেছেন। আশা করি আমরা আপনাকে সন্তুষ্ট করতে পেরেছি।
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 rounded-md border border-dashed border-white/15 px-2.5 py-2 flex flex-col gap-1">
                    <span className="text-white font-bold text-[14px]">
                      আপনার পণ্যের সমস্যা সমাধান করা হয়েছে।
                    </span>
                    <p className="text-[12.5px] text-gray-300">
                      প্রিয় গ্রাহক, আপনার পন্যটি আমাদের সার্ভিস টিম দক্ষতার
                      সঙ্গে সমস্যাগুলা সমাধান করেছেন। আশা করি আমরা আপনাকে
                      সন্তুষ্ট করতে পেরেছি।
                    </p>
                  </div>
                )}
              </li>
            )}
          </ul>
        </section>

        {/* Staff Info Section */}
        {((serviceData?.staffName && serviceData?.staffPhone) ||
          serviceData?.appointedStaff) && (
          <section className={clsx(cardCls, "p-2.5 flex flex-col gap-2")}>
            <span className={clsx("self-start px-2 h-6 rounded-md text-[11.5px] font-bold inline-flex items-center", isInstall ? "bg-[#e9a800]/20 text-[#ffc629]" : "bg-[#1f7cf0]/25 text-[#8fc0ff]")}>
              এস ই ইলেকট্রনিকস নিযুক্ত{" "}
              {serviceData.type === "install" ? "ইলেকট্রিসিয়ান" : "টেকনিশিয়ান"}{" "}
              তথ্য
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="size-16 rounded-full overflow-hidden border-2 border-[#1f7cf0] bg-[#0f2a60] flex items-center justify-center">
                  {serviceData.appointedStaff && appointedStaffPhotoUrl ? (
                    <ImageWithLightbox
                      src={appointedStaffPhotoUrl}
                      alt="Staff Photo"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <User size={30} className="text-[#8fc0ff]" />
                  )}
                </div>
                {serviceData.appointedStaff && (
                  <Link
                    target="_blank"
                    href={`/team-members?staffId=${serviceData.appointedStaff.staffId}`}
                    className="text-[11px] font-bold text-[#5aa2ff] hover:underline"
                  >
                    View Profile
                  </Link>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1 text-[12.5px]">
                <span className="flex items-center gap-1.5 min-w-0"><IdCard size={14} className="text-[#5aa2ff] shrink-0" /><span className="text-white/70 shrink-0">নাম :</span><b className="uppercase truncate">{serviceData.appointedStaff?.name || serviceData.staffName}</b></span>
                <span className="flex items-center gap-1.5 min-w-0"><Phone size={14} className="text-[#5aa2ff] shrink-0" /><span className="text-white/70 shrink-0">ফোন :</span><b className="truncate">{staffPhone}</b></span>
                <span className="flex items-start gap-1.5 min-w-0"><MapPin size={14} className="text-[#5aa2ff] shrink-0 mt-0.5" /><span className="text-white/70 shrink-0">সার্ভিস এরিয়া :</span><b className="break-words">{serviceData.customerAddress}</b></span>
              </div>
            </div>
            {staffPhone && (
              <a href={`tel:${staffPhone}`} className="h-9 rounded-md border border-[#2a5bb5] bg-[#0f2a60] text-[#8fc0ff] text-[13px] font-extrabold inline-flex items-center justify-center gap-2"><Phone size={15} />যোগাযোগ করুন<ChevronRight size={15} /></a>
            )}
          </section>
        )}

        {/* Live technician position: the map while he is on the way, otherwise a hint that explains when it appears */}
        {currentStatus === "staff_departed" ? (
          <LiveTrackingMap serviceId={serviceData.serviceId} />
        ) : currentStatus !== "completed" && currentStatus !== "canceled" && currentStatus !== "staff_arrived" ? (
          (serviceData as { customerLat?: number | null }).customerLat == null ? (
            <LocationAccessCard role="customer" serviceId={serviceData.serviceId} dark />
          ) : (
            <section className={clsx(cardCls, "p-2.5 flex items-center gap-2.5")}>
              <span className="size-10 rounded-full bg-[#16a34a]/25 text-[#34d36b] flex items-center justify-center shrink-0"><MapPin size={20} /></span>
              <span className="flex flex-col leading-tight">
                <span className="text-[15px] font-extrabold">লাইভ ট্র্যাকিং</span>
                <span className="text-[12px] text-[#8fc0ff]">আপনার লোকেশন নেওয়া আছে। টেকনিশিয়ান রওনা দিলে এখানে ম্যাপে তাঁকে দেখতে পাবেন।</span>
              </span>
            </section>
          )
        ) : null}

        <p className="text-center text-[11px] font-semibold text-white/50 mt-1">SE Electronics · Sylhet, Bangladesh</p>
      </div>
    </div>
  );
}
