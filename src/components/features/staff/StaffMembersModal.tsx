"use client";

import { getStaffs, getStaffsMetadata } from "@/actions";
import { Modal, Spinner } from "@/components/ui";
import { StaffsType } from "@/types";
import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";

export default function StaffMembersModal({
  role,
  headerComponent,
  canceledStaffId,
  onSelect,
  onClose,
}: {
  role?: "technician" | "electrician";
  headerComponent?: React.ReactNode;
  canceledStaffId?: string | null;
  onSelect: (staffData: StaffsType) => void;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [staffs, setStaffs] = useState<StaffsType[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const pagination = await getStaffsMetadata({ role: role });
      setPagination(pagination);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await getStaffs({ role: role, page: String(pageNumber) });
      setStaffs(res.data || []);
      setIsLoading(false);
    })();
  }, [pageNumber]);
  return (
    <Modal isVisible title="Select Staff Member" onClose={onClose}>
      {isLoading ? (
        <div className="h-72 __center">
          <Spinner />
        </div>
      ) : staffs.length === 0 ? (
        <div className="h-72 __center">No technicians found</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="__center gap-2">
              <span className="font-medium">
                Page {pageNumber} of {pagination?.totalPages}{" "}
              </span>
              <div className="__center gap-2">
                <button
                  disabled={pageNumber === 1}
                  onClick={() =>
                    setPageNumber(pageNumber === 1 ? 1 : pageNumber - 1)
                  }
                  className="__btn bg-white border disabled:bg-gray-100 disabled:opacity-70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="black"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <button
                  disabled={pageNumber === pagination?.totalPages}
                  onClick={() =>
                    setPageNumber(
                      pageNumber === pagination?.totalPages
                        ? pagination.totalPages
                        : pageNumber + 1,
                    )
                  }
                  className="__btn bg-white border disabled:bg-gray-100 disabled:opacity-70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="black"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {headerComponent}
          </div>
          <div className="overflow-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 sm:max-h-96">
            {staffs.map((staff) => (
              <div
                key={staff.staffId}
                onClick={() => {
                  onSelect(staff);
                  // onSelect({
                  //     staffId: staff.staffId,
                  //     paymentPreference: staff.paymentPreference,
                  //     walletNumber: staff.walletNumber,
                  //     bankInfo: staff.bankInfo,
                  // })
                }}
                className="bg-white border p-6 rounded-md cursor-pointer text-center relative"
              >
                {canceledStaffId === staff.staffId && (
                  <div className="absolute top-2 right-2 text-red-500 bg-red-50 rounded-full flex flex-col items-center p-1 px-2 border border-red-200 shadow-sm" title="Canceled the service">
                    <XCircle size={14} className="mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Canceled</span>
                  </div>
                )}
                <div className="size-44 rounded-full overflow-hidden __center mx-auto">
                  <img src={staff.photoUrl || undefined} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex flex-col mt-5">
                  <span className="text-xl font-semibold">{staff.name}</span>
                  <span className="text-gray-600">{staff.phone}</span>
                  <span className="text-gray-600">{staff.currentDistrict}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
