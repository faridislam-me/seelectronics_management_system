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
    <StaffLayout balance={stats?.availableBalance || 0} seamlessHeader>
      {/* <MobilePageHeader
        title="Staff Profile"
        backHref="/staff/profile"
        Icon={User}
      /> */}

      <div className="min-h-screen bg-[#eef3fb] text-[#16213a]">
        <BlueHero
          avatar={staffData.photoUrl}
          verified={!!staffData.isVerified}
          name={staffData.name}
          idLabel="Staff ID"
          id={staffData.staffId}
          variant="profile"
          chips={[
            { label: staffData.role === "electrician" ? "ELECTRICIAN" : "TECHNICIAN", color: "glass", icon: User },
            { label: staffData.isVerified ? "VERIFIED" : "PENDING", color: staffData.isVerified ? "green" : "amber", icon: ShieldCheck },
            { label: staffData.isActiveStaff ? "ACTIVE" : "BLOCKED", color: staffData.isActiveStaff ? "blue" : "red", dot: true },
          ]}
        />

        <div className="max-w-6xl mx-auto px-2 pt-2.5 relative pb-4 flex flex-col gap-2.5">
          <BlueBalanceCard
            label="AVAILABLE BALANCE"
            value={`৳ ${Number(stats?.availableBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Wallet}
            button="Download ID"
            buttonIcon={FileDown}
            buttonHref={`/pdf/download?type=id-card&id=${staffData.staffId}`}
            chevronHref="/staff/payment"
            layout="row"
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

          <div id="experience" />
          <BlueContactCard title="Experience" icon={Briefcase} editHref="/staff/profile/edit" rows={[
            { label: "Repair", value: staffData.hasRepairExperience ? `${staffData.repairExperienceYears} Years` : "No", icon: Wrench },
            { label: "Installation", value: staffData.hasInstallationExperience ? `${staffData.installationExperienceYears} Years` : "No", icon: Hammer },
          ]} />

          <BlueContactCard title="Address" icon={MapPin} editHref="/staff/profile/edit" rows={[
            { label: "Current Address", value: `${staffData.currentStreetAddress}, ${staffData.currentDistrict}`, icon: MapPin },
            { label: "Permanent Address", value: `${staffData.permanentStreetAddress}, ${staffData.permanentDistrict}`, icon: Home },
          ]} />

          <BlueContactCard title="Payment Method" icon={CreditCard} editHref="/staff/payment/settings" rows={[
            { label: "Payment Method Preference", value: staffData.paymentPreference === "bank" && staffData.bankInfo
                  ? `${staffData.bankInfo.bankName} · ${staffData.bankInfo.accountNumber}`
                  : ["bkash", "nagad", "rocket"].includes(staffData.paymentPreference) && staffData.walletNumber
                    ? `${String(staffData.paymentPreference).toUpperCase()} · ${staffData.walletNumber}`
                    : String(staffData.paymentPreference || "N/A").toUpperCase(), icon: CreditCard, href: "/staff/payment/settings" },
          ]} />

          {/* NID DOCUMENTS */}
          <div className="bg-white p-3.5 rounded-md shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex flex-col gap-3">
            <span className="flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><ShieldCheck size={18} /></span>
              <span className="font-extrabold text-[#16213a] text-[clamp(16px,4.6vw,20px)]">NID Documents</span>
              <span className="text-[12px] font-semibold text-[#6b7690]">front &amp; back</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                <Image
                  src={nidFrontUrl || "/placeholder.jpg"}
                  alt="NID Front"
                  width={300}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="rounded-md overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
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
                className="flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white text-sm font-bold shadow-sm"
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
