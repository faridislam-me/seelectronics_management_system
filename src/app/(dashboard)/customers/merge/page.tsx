import { getDuplicateCustomerGroups } from "@/actions/customerMergeActions";
import { CustomerMergeClient } from "@/components";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomerMergePage() {
  const res = await getDuplicateCustomerGroups();
  const groups = res.success ? res.data : [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="__page-header">ডুপ্লিকেট কাস্টমার মার্জ</h1>
          <p className="text-sm text-gray-500">একই মানুষের একাধিক অ্যাকাউন্ট এক অ্যাকাউন্টে আনুন</p>
        </div>
        <Link
          href="/customers"
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          ← কাস্টমার তালিকা
        </Link>
      </div>

      {!res.success ? (
        <div className="__card p-10 text-center text-rose-500">{res.message}</div>
      ) : (
        <CustomerMergeClient groups={groups} />
      )}
    </div>
  );
}
