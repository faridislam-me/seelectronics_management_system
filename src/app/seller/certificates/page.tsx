import { getMySellerCertificates } from "@/actions/sellerCertificateActions";
import CertificatePreview from "@/components/features/sellers/CertificatePreview";
import SellerCertificateTemplate from "@/components/features/sellers/SellerCertificateTemplate";
import { SellerLayout } from "@/components/layout";
import { BlueCard } from "@/components/ui";
import { SELLER_CERTIFICATE_TYPES } from "@/constants/sellerCertificates";
import { buildSellerCertificateData } from "@/lib/sellerCertificate";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Award, Download } from "lucide-react";

export default async function SellerCertificatesPage() {
  await loadSellerPortal();
  const certificates = await getMySellerCertificates();
  const withData = await Promise.all(certificates.map(async (c) => ({ ...c, data: await buildSellerCertificateData(c) })));

  return (
    <SellerLayout>
      <div className="flex flex-col gap-2.5 p-2">
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-[#16213a]">আমার সার্টিফিকেট</span>
          <span className="text-xs font-semibold text-[#6b7690]">এস ই ইলেকট্রনিকস থেকে পাওয়া সম্মাননা ও স্বীকৃতি</span>
        </div>

        {withData.length === 0 && (
          <BlueCard className="flex flex-col items-center gap-2 text-center !rounded-md !p-5">
            <span className="size-14 rounded-full bg-[#fff6e3] text-[#e0a11b] flex items-center justify-center"><Award size={28} /></span>
            <span className="text-[15px] font-extrabold text-[#0b2a66]">এখনো কোনো সার্টিফিকেট দেওয়া হয়নি</span>
            <span className="text-[12.5px] font-medium text-[#5b6784]">ভালো বিক্রি ও সেবার জন্য এস ই ইলেকট্রনিকস সার্টিফিকেট দিলে এখানে দেখা যাবে।</span>
          </BlueCard>
        )}

        {withData.map((c) => {
          const kind = SELLER_CERTIFICATE_TYPES[c.certType];
          return (
            <BlueCard key={c.token} className="flex flex-col gap-2 !rounded-md !p-2">
              <div className="flex items-center gap-2.5">
                <span className="size-10 rounded-md flex items-center justify-center shrink-0 text-white" style={{ background: kind.accent }}><Award size={22} /></span>
                <span className="flex flex-col flex-1 min-w-0 leading-tight">
                  <span className="text-[14.5px] font-extrabold text-[#16213a] truncate">{kind.title}{c.period ? ` · ${c.period}` : ""}</span>
                  <span className="text-xs font-semibold text-[#6b7690] truncate">{formatDate(c.issuedAt)} · {c.certNo}</span>
                </span>
              </div>
              <div className="rounded-sm border border-[#e3e9f3] overflow-hidden">
                <CertificatePreview><SellerCertificateTemplate data={c.data} /></CertificatePreview>
              </div>
              <a href={`/pdf/download?token=${c.token}`} target="_blank" className="h-10 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2"><Download size={17} />PDF ডাউনলোড</a>
            </BlueCard>
          );
        })}
      </div>
    </SellerLayout>
  );
}
