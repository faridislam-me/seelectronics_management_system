"use client";

import {
  sendBatteryReminderToSelected,
  sendUserManualSmsToSelected,
} from "@/actions";
import { sendBulkVoiceCallToSelected, sendCustomVoiceCallToSelected } from "@/actions/voiceReminderActions";
import Modal from "@/components/ui/Modal";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type CustomerRow = {
  customerId: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

export default function BatteryRemindersClient({
  customers,
  allCustomerIds,
}: {
  customers: CustomerRow[];
  allCustomerIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<"sms" | "voice" | "custom" | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [customVoiceId, setCustomVoiceId] = useState("");

  // Remember the last voice ID typed on this device.
  useEffect(() => {
    try {
      setCustomVoiceId(localStorage.getItem("se-custom-voice-id") || "");
    } catch {}
  }, []);

  const visibleIds = customers.map((customer) => customer.customerId);
  const allMatchingSelected =
    allCustomerIds.length > 0 && allCustomerIds.every((id) => selectedIds.includes(id));
  const visibleSelected = visibleIds.filter((id) => selectedIds.includes(id));

  const toggleCustomer = (customerId: string) => {
    setSelectedIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId],
    );
  };

  const toggleVisibleCustomers = () => {
    setSelectedIds((current) => {
      const allVisibleSelected = visibleIds.every((id) => current.includes(id));
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const toggleAllMatchingCustomers = () => {
    setSelectedIds((current) => (allMatchingSelected ? [] : allCustomerIds));
  };

  const openCampaignMenu = (menu: "sms" | "voice" | "custom") => {
    if (!selectedIds.length) {
      toast.error("Please select at least one customer first.");
      return;
    }
    setOpenMenu(menu);
  };

  const sendCampaign = async (
    action: string,
    campaign: () => Promise<{ success?: boolean; message?: string }>,
  ) => {
    if (!confirm(`এই বার্তাটি ${selectedIds.length} জন গ্রাহককে পাঠানো হবে। আপনি কি নিশ্চিত?`)) return;

    setLoadingAction(action);
    try {
      const res = await campaign();
      if (res?.success) toast.success(res.message);
      else toast.error(res?.message || "Something went wrong");
      setOpenMenu(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4 border-b gap-4">
        <h2 className="text-xl font-bold">
          Maintenance Reminders (Bulk SMS & Voice)
        </h2>
        <span className="text-sm font-medium text-gray-600">
          {selectedIds.length} selected
        </span>
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full lg:w-auto">
          <button
            onClick={() => openCampaignMenu("sms")}
            disabled={loadingAction !== null}
            className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-400 font-medium whitespace-nowrap text-sm sm:text-base"
          >
            Send SMS
          </button>
          <button
            onClick={() => openCampaignMenu("voice")}
            disabled={loadingAction !== null}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400 font-medium whitespace-nowrap text-sm sm:text-base"
          >
            Send Voice call
          </button>
          <button
            onClick={() => openCampaignMenu("custom")}
            disabled={loadingAction !== null}
            className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400 font-medium whitespace-nowrap text-sm sm:text-base"
          >
            Voice ID দিয়ে কল
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={toggleAllMatchingCustomers}
          className="px-3 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
        >
          {allMatchingSelected ? "Clear all matching" : "Select all matching customers"}
        </button>
        <span className="text-gray-500">
          {visibleSelected.length} of {visibleIds.length} visible selected
        </span>
      </div>

      <Modal
        title="Send SMS"
        isVisible={openMenu === "sms"}
        onClose={() => setOpenMenu(null)}
        width="500"
      >
        <div className="grid gap-3 py-3">
          <button
            disabled={loadingAction !== null}
            onClick={() =>
              sendCampaign("battery-sms", () => sendBatteryReminderToSelected(selectedIds))
            }
            className="w-full rounded-md bg-red-600 px-4 py-3 font-bold text-white disabled:bg-gray-400"
          >
            {loadingAction === "battery-sms" ? "Sending..." : "ব্যাটারির রক্ষণাবেক্ষণ এসএমএস"}
          </button>
          <button
            disabled={loadingAction !== null}
            onClick={() =>
              sendCampaign("manual-sms", () => sendUserManualSmsToSelected(selectedIds))
            }
            className="w-full rounded-md bg-green-600 px-4 py-3 font-bold text-white disabled:bg-gray-400"
          >
            {loadingAction === "manual-sms" ? "Sending..." : "ব্যবহারবিধি এসএমএস"}
          </button>
        </div>
      </Modal>

      <Modal
        title="Send Voice call"
        isVisible={openMenu === "voice"}
        onClose={() => setOpenMenu(null)}
        width="500"
      >
        <div className="grid gap-3 py-3">
          <button
            disabled={loadingAction !== null}
            onClick={() =>
              sendCampaign("battery-voice", () =>
                sendBulkVoiceCallToSelected(selectedIds, "battery_health_check"),
              )
            }
            className="w-full rounded-md bg-indigo-600 px-4 py-3 font-bold text-white disabled:bg-gray-400"
          >
            {loadingAction === "battery-voice" ? "Sending..." : "ব্যাটারির রক্ষণাবেক্ষণ ভয়েস কল"}
          </button>
          <button
            disabled={loadingAction !== null}
            onClick={() =>
              sendCampaign("maintenance-voice", () =>
                sendBulkVoiceCallToSelected(selectedIds, "overall_maintenance"),
              )
            }
            className="w-full rounded-md bg-orange-600 px-4 py-3 font-bold text-white disabled:bg-gray-400"
          >
            {loadingAction === "maintenance-voice"
              ? "Sending..."
              : "ব্যাটারির পানি চেকের ভয়েস কল"}
          </button>
        </div>
      </Modal>

      <Modal
        title="অন্য ভয়েস আইডি দিয়ে কল"
        isVisible={openMenu === "custom"}
        onClose={() => setOpenMenu(null)}
        width="500"
      >
        <div className="grid gap-3 py-3">
          <p className="text-sm text-gray-600">সিলেক্ট করা {selectedIds.length} জন গ্রাহকের কাছে এই আইডির ভয়েস কল যাবে।</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={customVoiceId}
            onChange={(e) => setCustomVoiceId(e.target.value)}
            placeholder="ভয়েস আইডি নম্বর লিখুন (যেমন 3316)"
            className="w-full h-12 rounded-md border border-purple-200 bg-white px-3 text-base outline-none focus:border-purple-500"
            autoFocus
          />
          <button
            disabled={loadingAction !== null || !customVoiceId.trim()}
            onClick={() => {
              try {
                localStorage.setItem("se-custom-voice-id", customVoiceId.trim());
              } catch {}
              sendCampaign("custom-voice", () => sendCustomVoiceCallToSelected(selectedIds, Number(customVoiceId)));
            }}
            className="w-full rounded-md bg-purple-600 px-4 py-3 font-bold text-white disabled:bg-gray-400"
          >
            {loadingAction === "custom-voice" ? "Sending..." : `${selectedIds.length} জনকে ভয়েস কল পাঠান`}
          </button>
        </div>
      </Modal>

      <div className="overflow-x-auto overflow-y-auto flex-1 bg-white rounded-md border border-gray-100 shadow-sm custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
            <tr>
              <th className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={visibleIds.length > 0 && visibleSelected.length === visibleIds.length}
                  onChange={toggleVisibleCustomers}
                  aria-label="Select visible customers"
                />
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Customer ID
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Name
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Phone
              </th>
              <th className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                Address
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.customerId}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(customer.customerId)}
                    onChange={() => toggleCustomer(customer.customerId)}
                    aria-label={`Select ${customer.name || customer.customerId}`}
                  />
                </td>
                <td className="py-3 px-4">{customer.customerId}</td>
                <td className="py-3 px-4">{customer.name}</td>
                <td className="py-3 px-4">{customer.phone}</td>
                <td className="py-3 px-4">{customer.address}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
