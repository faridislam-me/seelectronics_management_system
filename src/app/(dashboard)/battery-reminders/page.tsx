import { getCustomerIds, getCustomers, getCustomersMetadata } from "@/actions";
import { Toolbar } from "@/components";
import { SearchParams } from "@/types";
import BatteryRemindersClient from "./BatteryRemindersClient";

export default async function BatteryRemindersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // We can fetch a larger limit for this page to make bulk selection easier
  const customParams = { ...params, limit: params?.limit || "50" };

  const paginationPromise = getCustomersMetadata(customParams);
  const customersPromise = getCustomers(customParams);
  const customerIdsPromise = getCustomerIds({
    query: params?.query,
    category: params?.category,
  });

  const [pagination, customersRes, customerIdsRes] = await Promise.all([
    paginationPromise,
    customersPromise,
    customerIdsPromise,
  ]);

  const activeCategory = ["ips", "battery", "stabilizer"].includes(
    params?.category || "",
  )
    ? params!.category!
    : "all";

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <Toolbar title="Maintenance Reminders" pagination={pagination!} />
      <BatteryRemindersClient
        customers={customersRes.data || []}
        allCustomerIds={customerIdsRes.data || []}
        activeCategory={activeCategory}
      />
    </div>
  );
}
