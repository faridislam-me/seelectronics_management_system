import { verifyStaffSession } from "@/actions";
import { getStaffById, getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import IdCardTemplate from "@/components/features/staff/IdCardTemplate";
import { ArrowLeft, BadgeCheck, Download, IdCard, Phone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { qrcode, barcode } from "@/lib/id-gen";
import ZoomableView from "./ZoomableView";

export default async function IdCardPage() {
  const session = await verifyStaffSession();

  if (!session.isAuth || !session.userId) {
    notFound();
  }

  const userId = session.userId as string;
  const [response, statsRes] = await Promise.all([getStaffById(userId), getStaffProfileStats(userId)]);
  const balance = statsRes.success ? statsRes.data?.availableBalance || 0 : 0;

  if (!response.success || !response.data) {
    return (
      <StaffLayout balance={balance}>
        <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5">
          <section className="rounded-md bg-white border border-[#dfe6f2] p-5 flex flex-col items-center gap-3 text-center shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <span className="size-16 rounded-full bg-[#ffe9ec] text-[#e0243f] flex items-center justify-center"><TriangleAlert size={30} /></span>
            <h1 className="text-[17px] font-extrabold text-[#0b2a66]">{response.message || "Invalid Staff Data"}</h1>
            <p className="text-[12.5px] font-medium text-[#5b6784]">Could not load staff data. Please contact the administrator.</p>
            <Link href="/staff/profile" className="h-10 px-4 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center gap-1.5"><ArrowLeft size={16} />Return to Dashboard</Link>
          </section>
        </div>
      </StaffLayout>
    );
  }

  const staff = response.data;

  const convertToBase64 = async (filePath: string): Promise<string> => {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const extensionName = path.extname(filePath).toLowerCase();
      let mimeType = "image/jpeg";
      if (extensionName === ".png") mimeType = "image/png";
      else if (extensionName === ".svg") mimeType = "image/svg+xml";
      else if (extensionName === ".ttf") mimeType = "font/ttf";
      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    } catch (e) {
      console.error(e);
      return "";
    }
  };

  const frontTemplatePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    staff.role === "technician"
      ? "technician-card.jpg"
      : "electrician-card.jpg",
  );

  const backTemplatePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    "id-card-back.jpg",
  );

  const frontBase64 = await convertToBase64(frontTemplatePath);
  const backBase64 = await convertToBase64(backTemplatePath);

  const qrCodeData = await qrcode(staff.staffId);
  const barcodeData = await barcode(staff.staffId);

  const data = {
    ...staff,
    currentPoliceStation: staff.currentPoliceStation || "",
    currentPostOffice: staff.currentPostOffice || "",
    photoUrl: staff.photoUrl || "",
    frontBgImage: frontBase64,
    backBgImage: backBase64,
    issueDate: new Date(),
    qrcode: qrCodeData,
    barcode: barcodeData,
  };

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5">
        {/* Title */}
        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.30)]">
          <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <Link href="/staff/profile" aria-label="Back" className="size-9 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
            <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><IdCard size={24} /></span>
            <span className="flex flex-col leading-tight min-w-0 flex-1">
              <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">ID Card Preview</span>
              <span className="text-[12px] text-white/85 font-semibold truncate">{staff.name} ({staff.staffId})</span>
            </span>
          </div>
        </section>

        {/* Holder summary + download */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="flex flex-col gap-1 min-w-0 flex-1 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-extrabold capitalize"><BadgeCheck size={15} className="text-[#1a9c4b] shrink-0" /><span className="truncate">{staff.role}</span></span>
            {staff.phone && <span className="inline-flex items-center gap-1.5 font-semibold text-[#3d4a63]"><Phone size={14} className="text-[#1f7cf0] shrink-0" />{staff.phone}</span>}
          </span>
          <Link
            href={`/pdf/download?type=id-card&id=${staff.staffId}`}
            target="_blank"
            className="shrink-0 h-10 px-4 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[13.5px] font-extrabold inline-flex items-center gap-2 shadow-[0_6px_16px_rgba(31,124,240,0.3)]"
          >
            <Download size={16} /> Download
          </Link>
        </section>

        <div className="h-[calc(100dvh-270px)] min-h-[420px]">
          <ZoomableView>
            <IdCardTemplate data={data as any} />
          </ZoomableView>
        </div>
      </div>
    </StaffLayout>
  );
}
