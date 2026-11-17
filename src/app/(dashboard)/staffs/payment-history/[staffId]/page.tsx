import { getPaymentsMetadata, getStaffById } from "@/actions";
import { DelayedLoading, PaymentList, Toolbar } from "@/components";
import StaffRechargeHistorySection from "@/components/features/recharge/StaffRechargeHistorySection";
import { SearchParams } from "@/types";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export default async function StaffPaymentHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { staffId } = await params;
  const sp = await searchParams;

  const staffRes = await getStaffById(staffId);
  if (!staffRes.success || !staffRes.data) {
    notFound();
  }

  const staff = staffRes.data;
  const pagination = await getPaymentsMetadata({ ...sp, staffId });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
      <Toolbar
        title={`Payment History: ${staff.name}`}
        pagination={pagination}
      />
      <div className="overflow-auto max-h-[55vh] bg-white rounded-md border border-gray-100 shadow-sm custom-scrollbar">
        <table
          id="services"
          className="w-full text-sm text-left"
        >
          <thead>
            <tr className="sticky top-0 z-10 bg-gray-50">
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Payment ID
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Invoice
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Amount
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Status
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Method
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Date
              </th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <Suspense
              key={sp?.query}
              fallback={
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-400 font-medium"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <DelayedLoading />
                      <span>Loading payment history...</span>
                    </div>
                  </td>
                </tr>
              }
            >
              <PaymentList {...{ ...sp, staffId, hideStaff: true }} />
            </Suspense>
          </tbody>
        </table>
      </div>
      <Suspense
        fallback={
          <div className="bg-white rounded-md border border-gray-100 shadow-sm py-10 text-center text-gray-400">
            <DelayedLoading />
            <span className="block mt-2">রিচার্জ হিস্ট্রি লোড হচ্ছে...</span>
          </div>
        }
      >
        <StaffRechargeHistorySection staffId={staffId} />
      </Suspense>
    </div>
  );
}
