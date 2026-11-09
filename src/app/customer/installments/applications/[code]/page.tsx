import { getMyApplicationByCode } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { notFound, redirect } from "next/navigation";
import ApplicationTrackingClient from "./ApplicationTrackingClient";

export const dynamic = "force-dynamic";

export default async function ApplicationTrackingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyApplicationByCode(code);
  if (!res.success || !("data" in res) || !res.data) notFound();

  return (
    <CustomerLayout>
      <ApplicationTrackingClient app={res.data} />
    </CustomerLayout>
  );
}
