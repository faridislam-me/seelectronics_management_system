"use client";

import StaffProfileModal from "@/components/features/staff/StaffProfileModal";
import { StaffsType } from "@/types";
import { Eye, MapPin, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function StaffListClient({ staffs }: { staffs: StaffsType[] }) {
  const [selectedStaff, setSelectedStaff] = useState<StaffsType | null>(null);

  return (
    <div className="flex-1 overflow-auto p-2 sm:p-3">
      <div className="grid  grid-cols-2 sm:grid-cols-2 md:grid-cols-3  xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {staffs.map((staff) => (
          <div
            key={staff.id}
            onClick={() => setSelectedStaff(staff)}
            className="group bg-white border border-gray-100 rounded-md sm:rounded-[2rem] p-3 sm:p-4 md:p-5 text-center transition-all hover:shadow-xl hover:shadow-brand/5 hover:border-brand/20 cursor-pointer relative overflow-hidden active:scale-[0.98]"
          >
            {/* Status Indicator */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
              {staff.isActiveStaff ? (
                <div
                  className="bg-emerald-50 text-emerald-600 p-1 sm:p-1.5 rounded-full"
                  title="Active"
                >
                  <ShieldCheck size={12} className="sm:w-4 sm:h-4" />
                </div>
              ) : (
                <div
                  className="bg-rose-50 text-rose-600 p-1 sm:p-1.5 rounded-full"
                  title="Blocked"
                >
                  <ShieldAlert size={12} className="sm:w-4 sm:h-4" />
                </div>
              )}
            </div>

            {/* Profile Image */}
            <div className="relative mx-auto mb-3 sm:mb-4 md:mb-5">
              <div className="size-20 sm:size-28 md:size-32 lg:size-36 rounded-md sm:rounded-md md:rounded-[2rem] overflow-hidden __center mx-auto border-2 sm:border-4 border-gray-50 group-hover:border-brand/10 transition-colors bg-gray-50">
                <Image
                  src={staff.photoUrl || "/placeholder-avatar.png"}
                  alt={staff.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-1.5">
                <span className="text-[12px] sm:text-[12px] font-black text-brand uppercase tracking-widest">
                  {staff.staffId}
                </span>
              </div>
            </div>

            {/* Staff Info */}
            <div className="">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 group-hover:text-brand transition-colors line-clamp-1 px-1">
                  {staff.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] sm:mt-1">
                  {staff.role}
                </p>
              </div>

              <div className="flex flex-col sm:gap-1.5 md:gap-2  sm:pt-2 border-t border-gray-50">
                <a href={`tel:${staff.phone}`} className="flex items-center justify-center gap-1 sm:gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                  <Phone
                    size={10}
                    className="text-brand/40 sm:w-3.5 sm:h-3.5"
                  />
                  <span className="text-[10px] sm:text-sm md:text-sm font-bold">
                    {staff.phone}
                  </span>
                </a>
                <div className="flex items-center justify-center gap-1 sm:gap-2 text-gray-500">
                  <MapPin
                    size={10}
                    className="text-brand/40 sm:w-3.5 sm:h-3.5"
                  />
                  <span className="text-[10px] sm:text-sm md:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px]">
                    {staff.currentDistrict}
                  </span>
                </div>
              </div>

              {/* View Details Hint */}
              <div className="sm:pt-2">
                <div className="w-full py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-md md:rounded-md text-gray-900 bg-gray-50 group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-2">
                  <Eye size={12} className="sm:w-4 sm:h-4" />
                  <span className="text-[8px] sm:text-[10px] md:text-sm font-black uppercase tracking-wider sm:tracking-widest">
                    View Details
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedStaff && (
        <StaffProfileModal
          staffDataPayload={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
