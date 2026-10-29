import { getSellerPaymentRequests, getSellersWithDues } from "@/actions";
import { Toolbar } from "@/components";
import SellerPaymentAdminList from "@/components/features/sellers/SellerPaymentAdminList";
import { Spinner } from "@/components/ui";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function SellerPaymentsPage() {
  const [requests, sellersWithDues] = await Promise.all([
    getSellerPaymentRequests(),
    getSellersWithDues(),
  ]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <Toolbar
        title="Seller Payments"
        actions={null}
        pagination={{
          currentPage: 1,
          totalRecords: requests.success ? requests.data.length : 0,
          totalPages: 1,
          currentLimit: 50,
        }}
      />
      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
          <SellerPaymentAdminList
            requests={requests.success ? requests.data : []}
            sellersWithDues={sellersWithDues.success ? sellersWithDues.data : []}
          />
        </Suspense>
      </div>
    </div>
  );
}
