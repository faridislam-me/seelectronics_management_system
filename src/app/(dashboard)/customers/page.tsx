import { getCustomers, getCustomersMetadata } from "@/actions";
import {
  AddCustomerButton,
  CustomerList,
  DelayedLoading,
  Toolbar,
} from "@/components";
import { SearchParams } from "@/types";
import Link from "next/link";
import { Suspense } from "react";

export default async function Customers({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const paginationPromise = getCustomersMetadata({ ...params });
  const customersPromise = getCustomers({ ...params });

  const pagination = await paginationPromise;

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <Toolbar
        title="Customers"
        actions={
          <>
            <Link
              href="/customers/merge"
              className="flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span className="hidden lg:block">ডুপ্লিকেট মার্জ</span>
            </Link>
            <AddCustomerButton />
          </>
        }
        pagination={pagination!}
      />
      <div className="overflow-x-auto overflow-y-auto flex-1 bg-white rounded-md border border-gray-100 shadow-sm custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-50">
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Customer ID
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Invoice Number
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Name
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Phone Number
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Address
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap text-right">
                Total Amount
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Date
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap md:sticky md:right-0 md:bg-gray-50 md:shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <Suspense
              key={params?.query}
              fallback={
                <tr className="border-b">
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-400 font-medium"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <DelayedLoading />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              }
            >
              <CustomerList {...params} customersPromise={customersPromise} />
            </Suspense>
          </tbody>
        </table>
      </div>
    </div>
  );
}
