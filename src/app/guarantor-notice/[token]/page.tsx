import chairmanSeal from "@/assets/images/chairmanNameSeal.png";
import chairmanSign from "@/assets/images/chairmanSign.png";
import documentSeal from "@/assets/images/documentSeal.jpeg";
import logo from "@/assets/images/logoTransparent.png";
import GuarantorNoticeTemplate, {
  toGuarantorNoticeTemplateData,
} from "@/components/features/installments/GuarantorNoticeTemplate";
import { getGuarantorNoticeByToken } from "@/lib/guarantorNoticeData";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NoticeFrame from "./NoticeFrame";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "নোটিশ — SE Electronics",
  robots: { index: false, follow: false },
};

/**
 * Public notice document for an installment guarantor. There is no login: the
 * guarantor opens it from the SMS link, so the only key is the notice's random
 * token (24 hex chars) — never a sequential id or the plan code.
 */
export default async function GuarantorNoticePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await getGuarantorNoticeByToken(token);
  if (!found) notFound();

  const data = toGuarantorNoticeTemplateData(found.notice, found.plan, {
    logo: logo.src,
    seal: documentSeal.src,
    chairmanSign: chairmanSign.src,
    chairmanSeal: chairmanSeal.src,
  });

  return (
    <>
      {/* Same Bangla document font the PDF generator loads. */}
      <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css" precedence="default" />
      <NoticeFrame token={found.notice.token}>
        <GuarantorNoticeTemplate data={data} />
      </NoticeFrame>
    </>
  );
}
