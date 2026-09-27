"use client";

import geoData from "@/assets/data/geo-data.json";
import blacklistImg from "@/assets/images/suspend.png";
import { ImageWithLightbox, Modal } from "@/components/ui";
import { contactDetails } from "@/constants";
import { renderText } from "@/utils";
import clsx from "clsx";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Search,
  Settings,
  User,
  Users,
  Zap,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  CircleCheck,
  Clock,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function TeamMembers({
  staffs,
  staffId,
}: {
  staffs: {
    isActiveStaff: boolean;
    photoUrl: string | null;
    currentDistrict: string;
    currentPoliceStation: string | null;
    id: string;
    role: "technician" | "electrician";
    name: string;
    phone: string;
    staffId: string;
    currentPostOffice: string | null;
    photoKey: string | null;
    repairExperienceYears: number | null;
    installationExperienceYears: number | null;
    rating: number;
    totalFeedbacks: number;
    fiveStarCount: number;
    completedServices: number;
    canceledServices: number;
    pendingServices: number;
    serviceCenterServices: number;
    complaintsCount: number;
  }[];
  staffId?: string;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<
    (typeof staffs)[number] | null
  >(
    staffId
      ? (staffs.find((staff) => staff.staffId === staffId) ?? null)
      : null,
  );
  const districts = Object.keys(geoData);
  const thanas = geoData[selectedDistrict as keyof typeof geoData] || [];
  const aboutUs = `
        এস ই ইলেকট্রনিকস একটি বিশ্বস্ত ইলেক্ট্রনিক্স সার্ভিসিং এবং রক্ষণাবেক্ষণে প্রতিশ্রুতিবদ্ধ প্রতিষ্ঠান। আমাদের {staff_role} {staff_name}, {experience_years} বছরের অভিজ্ঞতার সাথে আই পি এস {job_title} এর অন্যতম দক্ষ কর্মী। তার ৯৪% সাফল্যের হার এবং ৫ স্টার রেটিং গ্রাহকদের আস্থা অর্জন করেছে। {about_staff} কাস্টমার সন্তুষ্টিই আমাদের পরধান লক্ষ্য।
    `;
  const filteredStaffs = selectedDistrict
    ? staffs.filter((staff) => {
        if (selectedThana)
          return (
            staff.currentDistrict === selectedDistrict &&
            staff.currentPoliceStation === selectedThana
          );
        return staff.currentDistrict === selectedDistrict;
      })
    : staffs;

  const q = query.trim().toLowerCase();
  const visibleStaffs = filteredStaffs.filter(
    (staff) =>
      (!role || staff.role === role) &&
      (!q || staff.name.toLowerCase().includes(q) || staff.phone.includes(q) || staff.staffId.toLowerCase().includes(q)),
  );

  const handleProfileSelect = (staff: (typeof staffs)[number]) => {
    const url = new URL(window.location.href);
    url.searchParams.set("staffId", staff.staffId);
    window.history.pushState({}, "", url);
    setSelectedProfile(staff);
  };

  return (
    <div className="my-2">
      {selectedProfile && (
        <Modal
          width="500"
          title="Team Member Profile"
          isVisible
          onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("staffId");
            window.history.pushState({}, "", url);
            setSelectedProfile(null);
          }}
        >
          <div className="bg-white overflow-hidden w-full">
            <div className="bg-blue-50/60 border border-blue-200 rounded-md text-primary text-center">
              {/* <div className="bg-primary/15 border border-primary p-6  rounded-md"> */}
              {/* <!-- Profile Image Placeholder --> */}
              <div className="size-48 rounded-full overflow-hidden __center mx-auto my-5 relative">
                <ImageWithLightbox src={selectedProfile?.photoUrl || ""} />
                {selectedProfile?.isActiveStaff === false && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
                    <Image
                      src={blacklistImg}
                      alt="Blacklisted"
                      className="w-full  object-contain"
                    />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-1">
                {selectedProfile?.name}
              </h1>
              <p className="text-lg font-medium">
                {selectedProfile.role === "technician"
                  ? "টেকনিশিয়ান"
                  : "ইলেকট্রিশিয়ান"}
              </p>
            </div>

            <div className="py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2 border rounded-md px-2 py-0.5">
                  <span className="text-accent-yellow text-xl">⭐</span>
                  <span className="text-xl font-bold text-gray-800">
                    {Number(selectedProfile.rating).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({selectedProfile.totalFeedbacks} রেটিং)
                  </span>
                </div>
                {selectedProfile.fiveStarCount > 0 && (
                  <span className="text-[11px] text-gray-500 font-bold ml-1">
                    ({selectedProfile.fiveStarCount} টি ৫ স্টার রেটিং)
                  </span>
                )}
              </div>
              <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-md border border-green-500 text-sm font-semibold h-fit">
                <span className="mr-1">✅</span>
                ভেরিফাইড সদস্য
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-4">
              <div className="flex flex-col items-center p-2 rounded-md bg-green-50 border border-green-200 text-center">
                <div className="bg-green-100 rounded-md p-1 mb-2">
                  <CheckSquare className="size-5 text-green-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.completedServices ?? 0}
                </span>
                <span className="text-xs font-semibold text-green-700">
                  সফল সার্ভিস
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-blue-50 border border-blue-200 text-center">
                <div className="bg-blue-100 rounded-md p-1 mb-2">
                  <Clock className="size-5 text-blue-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.pendingServices ?? 0}
                </span>
                <span className="text-xs font-semibold text-blue-700">
                  পেন্ডিং সার্ভিস
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-purple-50 border border-purple-200 text-center">
                <div className="bg-purple-100 rounded-md p-1 mb-2">
                  <BriefcaseBusiness className="size-5 text-purple-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.repairExperienceYears ||
                    selectedProfile.installationExperienceYears}
                </span>
                <span className="text-xs font-semibold text-purple-700">
                  বছরের দক্ষতা
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-amber-50 border border-amber-200 text-center">
                <div className="bg-amber-100 rounded-md p-1 mb-2">
                  <XCircle className="size-5 text-amber-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.canceledServices ?? 0}
                </span>
                <span className="text-xs font-semibold text-amber-700">
                  বাতিল সার্ভিস
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-rose-50 border border-rose-200 text-center">
                <div className="bg-rose-100 rounded-md p-1 mb-2">
                  <Building2 className="size-5 text-rose-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.serviceCenterServices ?? 0}
                </span>
                <span className="text-xs font-semibold text-rose-700">
                  সার্ভিস সেন্টার
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-md bg-red-50 border border-red-200 text-center">
                <div className="bg-red-100 rounded-md p-1 mb-2">
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedProfile.complaintsCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-red-700">
                  অভিযোগ
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-blue-50/60 border border-blue-200 rounded-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-blue-100 pb-2 mb-3">
                সাধারণ তথ্য
              </h2>

              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">🏢</span>
                <span className="font-medium">প্রতিষ্ঠান:</span>
                <span className="ml-auto">এস ই ইলেকট্রনিকস</span>
              </div>

              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">🛠️</span>
                <span className="font-medium">ক্যাটাগরি:</span>
                <span className="ml-auto text-primary-blue font-semibold">
                  {selectedProfile.role === "technician"
                    ? "টেকনিশিয়ান"
                    : "ইলেকট্রিশিয়ান"}
                </span>
              </div>

              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">🆔</span>
                <span className="font-medium">ইউসার আইডি:</span>
                <span className="ml-auto text-sm font-semibold">
                  {selectedProfile.staffId}
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">🛡️</span>
                <span className="font-medium">থানা:</span>
                <span className="ml-auto text-sm font-semibold">
                  {selectedProfile.currentPoliceStation}
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">📮</span>
                <span className="font-medium">পোস্ট:</span>
                <span className="ml-auto text-sm font-semibold">
                  {selectedProfile.currentPostOffice}
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="text-primary-blue w-6 mr-3">📍</span>
                <span className="font-medium">জেলা:</span>
                <span className="ml-auto text-sm font-semibold">
                  {selectedProfile.currentDistrict}
                </span>
              </div>
            </div>

            {/* About Us Section */}
            <div className="my-4 space-y-3 bg-blue-50/60 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  আমাদের সম্পর্কে (SE ELECTRONICS)
                </h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {renderText(aboutUs, {
                  staff_role:
                    selectedProfile.role === "technician"
                      ? "টেকনিশিয়ান"
                      : "ইলেকট্রিশিয়ান",
                  staff_name: selectedProfile.name,
                  experience_years:
                    selectedProfile.repairExperienceYears ||
                    selectedProfile.installationExperienceYears,
                  job_title:
                    selectedProfile.role === "technician"
                      ? "সার্ভিসিং"
                      : "ইন্সটল হাউজ ওরারিং",
                  about_staff:
                    selectedProfile.role === "technician"
                      ? "তিনি আধুনিক প্রযুক্তি এবং পেশাদারিত্বের সাথে দ্রুত ও নির্ভরযোগ্য সমাধান প্রদান করেন।"
                      : "তিনি সকল প্রকার কাজ পেশাদারিত্ব সাথে দ্রুত নির্ভরযোগ্য আইপিএস ইনস্টলেশনের কাজ সম্পূর্ণ করেন।",
                })}
              </p>
            </div>

            {/* Contact Section */}
            <div className="space-y-3 bg-blue-50/60 border border-blue-200 rounded-md p-4 text-primary text-center">
              {/* <div className="mt-4 bg-primary/15 p-6 text-center text-primary rounded-md border border-primary"> */}
              <p className=" mb-3 font-medium">
                জরুরী প্রয়োজনে কাস্টমার কেয়ারে কল করুন:
              </p>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-4">
                <Phone size={24} />
                {contactDetails.customerCare}
              </div>
              <button
                onClick={() =>
                  (window.location.href = `tel:${contactDetails.customerCare}`)
                }
                className="text-white w-full bg-primary font-semibold py-3 px-6 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Phone size={20} />
                সাহায্যের জন্য কল করুন
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Search + filters */}
      <div className="flex gap-2">
        <label className="relative flex-1 min-w-0">
          <Search size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5b6784] pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="টিম মেম্বার খুঁজুন..." className="w-full h-10 rounded-md border border-[#dfe6f2] bg-white pl-9 pr-2.5 text-[13.5px] outline-none placeholder:text-[#9aa4b8] focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]" />
        </label>
        <label className="relative shrink-0">
          <ListFilter size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0b3d91] pointer-events-none" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="appearance-none h-10 rounded-md border border-[#dfe6f2] bg-white pl-8 pr-7 text-[13px] font-bold text-[#0b3d91] outline-none focus:border-[#1f7cf0]">
            <option value="">সব বিভাগ</option>
            <option value="technician">টেকনিশিয়ান</option>
            <option value="electrician">ইলেকট্রিশিয়ান</option>
          </select>
          <ChevronDown size={15} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0b3d91] pointer-events-none" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <label className="flex flex-col gap-1 text-left">
          <span className="text-[11.5px] font-bold text-[#5b6784]">জেলাঃ</span>
          <select onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedThana(""); }} className="h-9 rounded-md border border-[#dfe6f2] bg-white px-2 text-[13px] outline-none focus:border-[#1f7cf0]">
            <option value="">সকল</option>
            {districts.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-left">
          <span className="text-[11.5px] font-bold text-[#5b6784]">থানাঃ</span>
          <select value={selectedThana} onChange={(e) => setSelectedThana(e.target.value)} className="h-9 rounded-md border border-[#dfe6f2] bg-white px-2 text-[13px] outline-none focus:border-[#1f7cf0]">
            <option value="">সকল</option>
            {thanas.map((thana) => <option key={thana} value={thana}>{thana}</option>)}
          </select>
        </label>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between gap-2 mt-3 mb-2">
        <span className="flex items-center gap-2 text-[18px] font-extrabold text-[#0b2a66]"><Users size={22} className="text-[#0b3d91]" />আমাদের টিম</span>
        <span className="h-7 px-3 rounded-md bg-[#e3edff] text-[#1f5fc9] text-[12px] font-bold inline-flex items-center">মোট সদস্য {visibleStaffs.length}</span>
      </div>

      {visibleStaffs.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {visibleStaffs.map((staff) => {
            const tone = staff.role === "technician"
              ? { panel: "bg-[#fff1e6]", badge: "bg-[#f57c1f]", btn: "bg-[#fff1e6] text-[#e8710a]", label: "Technical", Icon: Settings }
              : { panel: "bg-[#e6f7ee]", badge: "bg-[#1a9c4b]", btn: "bg-[#e6f7ee] text-[#178a42]", label: "Electrical", Icon: Zap };
            return (
              <button type="button" key={staff.id} onClick={() => handleProfileSelect(staff)} className="relative text-left rounded-md bg-white border border-[#dfe6f2] p-2 flex flex-col gap-1.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-transform">
                <div className={clsx("relative w-full aspect-[5/4] rounded-md overflow-hidden flex items-end justify-center", tone.panel)}>
                  {staff.photoUrl ? (
                    <Image src={staff.photoUrl} alt={staff.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover object-top" />
                  ) : (
                    <span className="mb-3 size-16 rounded-full bg-white/80 text-[#0b3d91] text-[22px] font-extrabold flex items-center justify-center">{staff.name?.charAt(0) || <User size={28} />}</span>
                  )}
                  {staff.isActiveStaff === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
                      <Image src={blacklistImg} alt="Blacklisted" className="w-full object-contain" />
                    </div>
                  )}
                  <span className={clsx("absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 h-6 px-2 rounded-md text-white text-[10.5px] font-bold", tone.badge)}><tone.Icon size={12} />{tone.label}</span>
                </div>
                <span className="flex items-center gap-1 min-w-0"><span className="text-[14px] font-extrabold text-[#16213a] truncate">{staff.name}</span><BadgeCheck size={16} className="shrink-0 text-white fill-[#1f7cf0]" /></span>
                <span className="text-[12px] font-semibold text-[#3d4a63] -mt-1">{staff.role === "technician" ? "টেকনিশিয়ান" : "ইলেকট্রিশিয়ান"}</span>
                <span className="flex items-center gap-1.5 text-[12px] text-[#3d4a63]"><Phone size={13} className="text-[#0b3d91] shrink-0" /><span className="truncate">{staff.phone}</span></span>
                <span className="flex items-center gap-1.5 text-[12px] text-[#3d4a63] pr-8"><MapPin size={13} className="text-[#0b3d91] shrink-0" /><span className="truncate">{staff.currentDistrict}</span></span>
                <span className={clsx("absolute right-2 bottom-2 size-7 rounded-md flex items-center justify-center", tone.btn)}><ChevronRight size={16} /></span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] h-48 flex flex-col items-center justify-center gap-2 text-[#5b6784]"><Users size={32} className="text-[#c9d3e6]" /><span className="font-bold">No Results</span></div>
      )}
    </div>
  );
}
