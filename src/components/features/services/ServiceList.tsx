import { getServices } from "@/actions";
import SellerTag from "@/components/ui/SellerTag";
import { ProfileLinkButton } from "@/components/features/staff";
import { CopyButton } from "@/components/ui";
import { SearchParams } from "@/types";
import { formatDate } from "@/utils";
import ServiceActionButtons from "./ServiceActionButtons";

const STATUS_CONFIG: Record<string, { name: string; styles: string }> = {
  requested: {
    name: "Requested",
    styles:
      "text-orange-500 bg-orange-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-orange-500",
  },
  pending: {
    name: "Pending",
    styles:
      "text-yellow-500 bg-yellow-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-yellow-500",
  },
  staff_departed: {
    name: "Staff Departed",
    styles:
      "text-yellow-500 bg-yellow-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-yellow-500",
  },
  staff_arrived: {
    name: "Staff Arrived",
    styles:
      "text-yellow-500 bg-yellow-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-yellow-500",
  },
  processing: {
    name: "Processing",
    styles:
      "text-blue-500 bg-blue-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-blue-500",
  },
  in_progress: {
    name: "In Progress",
    styles:
      "text-blue-500 bg-blue-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-blue-500",
  },
  service_center: {
    name: "Service Center",
    styles:
      "text-blue-500 bg-blue-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-blue-500",
  },
  service_center_received: {
    name: "Service Center Received",
    styles:
      "text-blue-500 bg-blue-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-blue-500",
  },
  appointment_retry: {
    name: "Appoint Retry",
    styles:
      "text-yellow-500 bg-yellow-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-yellow-500",
  },
  approved: {
    name: "Approved",
    styles:
      "text-green-500 bg-green-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-green-500",
  },
  completed: {
    name: "Completed",
    styles:
      "text-green-500 bg-green-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-green-500",
  },
  on_going: {
    name: "On Going",
    styles:
      "text-blue-500 bg-blue-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-blue-500",
  },
  canceled: {
    name: "Canceled",
    styles:
      "text-red-500 bg-red-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-red-500",
  },
  rejected: {
    name: "Rejected",
    styles:
      "text-red-500 bg-red-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-red-500",
  },
  valid: {
    name: "Valid",
    styles:
      "text-green-500 bg-green-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-green-500",
  },
  expired: {
    name: "Expired",
    styles:
      "text-red-500 bg-red-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-red-500",
  },
  custom: {
    name: "Custom",
    styles:
      "text-gray-500 bg-gray-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-gray-500",
  },
};

function ServiceStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.custom;
  return (
    <span
      className={`text-sm sm:text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${config.styles}`}
    >
      {config.name}
    </span>
  );
}

export default async function ServiceList(
  params: SearchParams & {
    type?: "repair" | "install";
    staffId?: string;
    hideStaff?: boolean;
    servicesPromise?: Promise<{
      success: boolean;
      data?: any[];
      message?: string;
    }>;
  },
) {
  const { hideStaff = false, servicesPromise, ...p } = params;
  const response = servicesPromise
    ? await servicesPromise
    : await getServices(p);

  if (!response.success) {
    return (
      <tr>
        <td
          colSpan={hideStaff ? 8 : 10}
          className="text-center py-3 text-red-500"
        >
          <p>{response.message}</p>
        </td>
      </tr>
    );
  }

  if (response.data!.length === 0) {
    return (
      <tr className="border-b">
        <td
          colSpan={hideStaff ? 8 : 10}
          className="text-center py-3 text-gray-600"
        >
          <p>No data</p>
        </td>
      </tr>
    );
  }

  const services = response.data!;

  return services.map((service: any) => (
    <tr
      key={service.id}
      className="hover:bg-gray-50/50 transition-colors group"
    >
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            {service.serviceId}
          </span>
          <CopyButton content={service.serviceId} />
        </div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {service.customerId ? (
            <ProfileLinkButton
              text={service.customerName}
              customerId={service.customerId}
            />
          ) : (
            <span className="font-bold text-gray-800 text-sm sm:text-base">
              {service.customerName}
            </span>
          )}
        </div>
        <SellerTag seller={(service as any).customer?.seller} />
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-bold text-sm sm:text-base">
        {service.customerPhone}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <p
          title={service.customerAddress}
          className="truncate max-w-[200px] text-gray-600 text-sm sm:text-sm font-medium"
        >
          {service.customerAddress}
        </p>
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md  text-gray-800 text-sm sm:text-sm font-black uppercase tracking-wider">
          {service.productType}-{service.productModel}
        </span>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-sm sm:text-sm font-bold">
        {formatDate(service.createdAt!)}
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-center">
        <ServiceStatusBadge
          status={
            service.statusHistory?.[0]?.statusType === "custom"
              ? "custom"
              : (service.status ?? "pending")
          }
        />
      </td>
      {!hideStaff && (
        <>
          <td className="py-3 px-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {service.staffId ? (
                <ProfileLinkButton
                  text={service.staffName}
                  staffId={service.staffId}
                />
              ) : (
                <span className="text-gray-400 italic text-sm sm:text-sm font-medium">
                  {service.staffName || "Unassigned"}
                </span>
              )}
            </div>
          </td>
          <td className="py-3 px-4 whitespace-nowrap text-gray-600 text-sm sm:text-sm font-bold">
            {service.staffPhone || "--"}
          </td>
        </>
      )}
      <td className="py-3 px-4 whitespace-nowrap md:sticky md:right-0 bg-white group-hover:bg-gray-50 transition-colors md:shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
        <ServiceActionButtons serviceData={service} />
      </td>
    </tr>
  ));
}
