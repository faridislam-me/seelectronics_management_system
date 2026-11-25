import { getComplaintById } from "@/actions/complaintActions";
import ComplaintDocViewer from "@/components/features/complaints/ComplaintDocViewer";
import ComplaintGdCopyTemplate from "@/components/features/complaints/ComplaintGdCopyTemplate";
import ExParteNoticeTemplate from "@/components/features/complaints/ExParteNoticeTemplate";
import { verifySession } from "@/lib";
import { buildComplaintGdCopyData, buildExParteNoticeData } from "@/lib/complaintDocs";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "অভিযোগ নথি | SE Electronics",
  robots: { index: false, follow: false },
};

/**
 * View / print / download page for a complaint's formal documents:
 *   ?doc=gd             complaint letter as a GD-style copy with QR (default)
 *   ?doc=absent-notice  customer-absent (ex-parte) notice
 * Open to the admin and to the customer who filed the complaint.
 */
export default async function ComplaintDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ complaintId: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { complaintId } = await params;
  const { doc } = await searchParams;

  const session = await verifySession(false);
  if (!session) redirect("/customer/login");
  if (session.role !== "admin" && session.role !== "customer") notFound();

  // getComplaintById enforces ownership (a customer only gets their own complaint).
  const res = await getComplaintById(complaintId);
  if (!res.success || !res.data) notFound();
  const complaint = res.data!;

  const isAdmin = session.role === "admin";
  const backHref = isAdmin ? `/complaints/${complaint.complaintId}` : `/customer/complain/doc/${complaint.complaintId}`;
  const fontCss = <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css" precedence="default" />;

  if (doc === "absent-notice") {
    // The notice only exists once the complaint was closed for customer absence.
    if (complaint.status !== "customer_absent") notFound();
    const data = await buildExParteNoticeData(complaint);
    return (
      <>
        {fontCss}
        <ComplaintDocViewer
          title="গ্রাহক অনুপস্থিতি নোটিশ"
          downloadHref={`/pdf/download?type=ex-parte-notice&id=${complaint.complaintId}`}
          backHref={backHref}
        >
          <ExParteNoticeTemplate data={data} />
        </ComplaintDocViewer>
      </>
    );
  }

  const data = await buildComplaintGdCopyData(complaint);
  return (
    <>
      {fontCss}
      <ComplaintDocViewer
        title="অভিযোগ পত্র (জিডি কপি)"
        downloadHref={`/pdf/download?type=complaint_customer&id=${complaint.complaintId}`}
        backHref={backHref}
      >
        <ComplaintGdCopyTemplate data={data} />
      </ComplaintDocViewer>
    </>
  );
}
