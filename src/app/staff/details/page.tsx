import { verifyStaffSession } from "@/actions";
import {
  getStaffById,
  getStaffProfileStats,
  staffLogout,
} from "@/actions/staffActions";
import { MobilePageHeader, StaffLayout } from "@/components/layout";
import { getObjectUrl } from "@/lib/s3";
import {
  LogOut,
  User,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Users,
  Wrench,
  Hammer,
  Home,
  CheckSquare,
  Clock,
  BriefcaseBusiness,
  XCircle,
  Building2,
  AlertTriangle,
  Star,
  BadgeCheck,
  FileDown,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { BlueBalanceCard, BlueContactCard, BlueFooterBand, BlueHero, BlueStatGrid } from "@/components/ui/BlueDashboard";

export default async function StaffDetailsPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const [profileRes, statsRes] = await Promise.all([
    getStaffById(userId),
    getStaffProfileStats(userId),
  ]);

  const staffData = profileRes.success ? profileRes.data : null;
  const stats = statsRes.success ? statsRes.data : null;
  if (!staffData) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md font-bold">
          Staff profile not found. Contact administrator.
        </div>
      </div>
    );
  }

  // Pre-fetch S3 URLs if not available
  const nidFrontUrl = staffData.nidFrontPhotoKey
    ? staffData.nidFrontPhotoUrl ||
      (await getObjectUrl(staffData.nidFrontPhotoKey))
    : null;
  const nidBackUrl = staffData.nidBackPhotoKey
    ? staffData.nidBackPhotoUrl ||
      (await getObjectUrl(staffData.nidBackPhotoKey))
    : null;

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      {/* <MobilePageHeader
        title="Staff Profile"
        backHref="/staff/profile"
        Icon={User}
      /> */}

      <div className="min-h-screen bg-[#eef3fb] text-[#16213a]">
        <BlueHero
          avatar={staffData.photoUrl}
          name={staffData.name}
          idLabel="Staff ID"
          id={staffData.staffId}
          chips={[
            { label: staffData.role === "electrician" ? "ELECTRICIAN" : "TECHNICIAN", color: "navy", icon: User },
            { label: staffData.isVerified ? "VERIFIED" : "PENDING", color: staffData.isVerified ? "green" : "amber", icon: ShieldCheck },
            { label: staffData.isActiveStaff ? "ACTIVE" : "BLOCKED", color: staffData.isActiveStaff ? "blue" : "red", dot: true },
          ]}
        />

        <div className="max-w-6xl mx-auto px-3.5 -mt-4 relative pb-5 flex flex-col gap-3.5">
          <BlueBalanceCard
            label="AVAILABLE BALANCE"
            value={`৳ ${Number(stats?.availableBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Wallet}
            button="Download ID"
            buttonIcon={FileDown}
            buttonHref={`/pdf/download?type=id-card&id=${staffData.staffId}`}
            chevronHref="/staff/payment"
          />

          <BlueStatGrid cards={[
            { value: staffData.completedServices ?? 0, label: "সফল সার্ভিস", icon: CheckSquare, tone: "green", href: "/staff/services" },
            { value: staffData.pendingServices ?? 0, label: "পেন্ডিং সার্ভিস", icon: Clock, tone: "blue", href: "/staff/tasks" },
            { value: staffData.repairExperienceYears || staffData.installationExperienceYears || 0, label: "বছরের দক্ষতা", icon: BriefcaseBusiness, tone: "purple", href: "#experience" },
            { value: staffData.canceledServices ?? 0, label: "রিজেক্টেড সার্ভিস", icon: XCircle, tone: "amber", href: "/staff/tracking" },
            { value: staffData.serviceCenterServices ?? 0, label: "সার্ভিস সেন্টার", icon: Building2, tone: "red", href: "/staff/tracking" },
            { value: staffData.rating ?? 0, label: "রেটিং", icon: Star, tone: "teal", href: "/staff/feedbacks" },
          ]} />

          <BlueContactCard editHref="/staff/profile/edit" rows={[
            { label: "Name", value: staffData.name, icon: User, href: "/staff/profile/edit" },
            { label: "Father's Name", value: staffData.fatherName, icon: Users, href: "/staff/profile/edit" },
            { label: "Phone", value: staffData.phone, icon: Phone, href: `tel:${staffData.phone}` },
            { label: "Address", value: `${staffData.currentStreetAddress}, ${staffData.currentDistrict}`, icon: MapPin, href: "/staff/profile/edit" },
          ]} />

          {/* INFO GRID */}
          <div id="experience" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EXPERIENCE */}
            <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                Experience
              </h3>
              <div className="space-y-4">
                {/* Repair */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 shrink-0 shadow-sm border border-slate-200/50">
                    <Wrench size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500">
                      Repair:
                    </span>
                    <span className="text-sm font-extrabold text-[#0a192f] mt-0.5">
                      {staffData.hasRepairExperience
                        ? `${staffData.repairExperienceYears} Years`
                        : "No"}
                    </span>
                  </div>
                </div>

                {/* Installation */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 shrink-0 shadow-sm border border-slate-200/50">
                    <Hammer size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500">
                      Installation:
                    </span>
                    <span className="text-sm font-extrabold text-[#0a192f] mt-0.5">
                      {staffData.hasInstallationExperience
                        ? `${staffData.installationExperienceYears} Years`
                        : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ADDRESSES */}
            <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 shrink-0 shadow-sm border border-slate-200/50 mt-1">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col space-y-1.5 w-full">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                  Current Address
                </h3>
                <p className="text-xs text-[#0a192f] font-extrabold leading-relaxed">
                  {staffData.currentStreetAddress}, {staffData.currentDistrict}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 shrink-0 shadow-sm border border-slate-200/50 mt-1">
                <Home size={18} />
              </div>
              <div className="flex flex-col space-y-1.5 w-full">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                  Permanent Address
                </h3>
                <p className="text-xs text-[#0a192f] font-extrabold leading-relaxed">
                  {staffData.permanentStreetAddress},{" "}
                  {staffData.permanentDistrict}
                </p>
              </div>
            </div>
          </div>

          {/* PAYMENT */}
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                Payment Method Preference
              </h3>
              <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                {staffData.paymentPreference}
              </p>
              {["bkash", "nagad", "rocket"].includes(
                staffData.paymentPreference,
              ) &&
                staffData.walletNumber && (
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {staffData.walletNumber}
                  </p>
                )}
              {staffData.paymentPreference === "bank" && staffData.bankInfo && (
                <div className="text-xs font-semibold text-slate-500 mt-1 space-y-0.5">
                  <p className="font-bold">{staffData.bankInfo.bankName}</p>
                  <p className="font-mono">
                    {staffData.bankInfo.accountNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Icon */}
            <div className="shrink-0 ml-4">
              {staffData.paymentPreference === "bkash" && (
                <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                  <svg
                    className="w-8 h-8"
                    xmlns="http://www.w3.org/2000/svg"
                    height="800"
                    width="1200"
                    viewBox="-18.0015 -28.3525 156.013 170.115"
                  >
                    <g fill="none">
                      <path
                        fill="#D12053"
                        d="M96.58 62.45l-53.03-8.31 7.03 31.6z"
                      />
                      <path
                        fill="#E2136E"
                        d="M96.58 62.45L56.62 6.93 43.56 54.15z"
                      />
                      <path fill="#D12053" d="M42.32 53.51L.45 0l54.83 6.55z" />
                      <path fill="#9E1638" d="M23.25 31.15L0 9.24h6.12z" />
                      <path
                        fill="#D12053"
                        d="M107.89 35.46l-9.84 26.69L82.1 40.09z"
                      />
                      <path
                        fill="#E2136E"
                        d="M56.77 84.14l38.61-15.51L97 63.7z"
                      />
                      <path
                        fill="#9E1638"
                        d="M25.89 113.41l16.54-58.02 8.39 37.75z"
                      />
                      <path
                        fill="#E2136E"
                        d="M109.43 35.67l-4.06 11.02 14.64-.24z"
                      />
                    </g>
                  </svg>
                </div>
              )}
              {staffData.paymentPreference === "nagad" && (
                <div className="w-12 h-12 rounded-lg bg-[#F15A22] flex items-center justify-center shadow-sm text-white font-extrabold text-xl select-none">
                  ন
                </div>
              )}
              {staffData.paymentPreference === "rocket" && (
                <div className="w-12 h-12 rounded-lg bg-[#8C3494] flex items-center justify-center shadow-sm text-white font-extrabold text-lg select-none">
                  🚀
                </div>
              )}
              {staffData.paymentPreference === "bank" && (
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              )}
              {staffData.paymentPreference === "cash" && (
                <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm text-white">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12h.01M18 12h.01"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* NID DOCUMENTS */}
          <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              NID Documents front & back
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                <Image
                  src={nidFrontUrl || "/placeholder.jpg"}
                  alt="NID Front"
                  width={300}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                <Image
                  src={nidBackUrl || "/placeholder.jpg"}
                  alt="NID Back"
                  width={300}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-2">
            <form action={staffLogout}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white text-sm font-bold shadow-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </form>
          </div>
        </div>
        <BlueFooterBand />
      </div>
    </StaffLayout>
  );
}
