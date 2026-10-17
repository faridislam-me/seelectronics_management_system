"use client";

import {
  deleteComplaint,
  getAllComplaints,
  updateComplaintStatus,
} from "@/actions/complaintActions";
import {
  ExternalLink,
  Search,
  Shield,
  ArrowRight,
  CheckCircle2,
  FileText,
  Gavel,
  Download,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionType, setActionType] = useState<
    "processing" | "hearing" | "completed" | null
  >(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    setLoading(true);
    const res = await getAllComplaints();
    if (res.success) {
      setComplaints(res.data || []);
    }
    setLoading(false);
  }

  async function handleResolve() {
    if (!selectedComplaint || !actionType) return;

    // Require admin notes only if moving to hearing or completed
    if (
      (actionType === "hearing" || actionType === "completed") &&
      !adminNotes.trim()
    ) {
      toast.error("Please provide admin notes/resolution details");
      return;
    }

    setIsResolving(true);
    const res = await updateComplaintStatus(
      selectedComplaint.complaintId,
      actionType,
      adminNotes.trim() || undefined,
    );

    if (res.success) {
      toast.success(res.message);
      setSelectedComplaint(null);
      setAdminNotes("");
      setActionType(null);
      loadComplaints();
    } else {
      toast.error(res.message);
    }
    setIsResolving(false);
  }

  async function handleDelete() {
    if (!toDelete) return;
    setIsDeleting(true);
    const res = await deleteComplaint(toDelete.complaintId);
    if (res.success) {
      toast.success(res.message);
      setComplaints((list) => list.filter((c) => c.complaintId !== toDelete.complaintId));
      setToDelete(null);
    } else {
      toast.error(res.message);
    }
    setIsDeleting(false);
  }

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filter === "all" || c.status === filter;
    const matchesSearch =
      c.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_trial":
        return "bg-red-100 text-red-700 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "hearing":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Shield className="text-red-500" />
            Complaint Management
          </h1>
          <p className="text-gray-500">
            Review, process, and resolve customer complaints against staff
          </p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-md border border-gray-100 shadow-sm">
          {["all", "under_trial", "processing", "hearing", "completed"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm sm:text-sm font-bold transition-all capitalize ${filter === f
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {f.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </header>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by ID, Customer or Staff..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-md border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <Shield className="mx-auto text-gray-200 mb-4" size={64} />
          <p className="text-gray-500 font-bold">
            No reports found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint.complaintId}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group relative"
            >
              <Link href={`/complaints/${complaint.complaintId}`} className="p-6 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 flex items-center gap-1">
                    {[
                      { id: "under_trial", label: "UT" },
                      { id: "processing", label: "P" },
                      { id: "hearing", label: "H" },
                      { id: "completed", label: "C" },
                    ].map((step, index, array) => {
                      const statuses = [
                        "under_trial",
                        "processing",
                        "hearing",
                        "completed",
                      ];
                      const currentIdx = statuses.indexOf(complaint.status);
                      const stepIdx = statuses.indexOf(step.id);
                      const isCompleted = currentIdx >= stepIdx;
                      const isActive = complaint.status === step.id;

                      return (
                        <div
                          key={step.id}
                          className="flex flex-1 items-center last:flex-none"
                        >
                          <div
                            title={step.id.replace("_", " ")}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black transition-all ${isActive
                              ? "bg-black text-white scale-110 shadow-sm"
                              : isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 text-gray-400"
                              }`}
                          >
                            {step.label}
                          </div>
                          {index < array.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mx-1 rounded-full ${currentIdx > stepIdx ? "bg-emerald-500" : "bg-gray-200"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-md ml-4">
                    {complaint.complaintId}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">
                  {complaint.subject}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-5">
                  {complaint.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 uppercase font-bold tracking-tighter">
                      Customer
                    </span>
                    <span className="font-bold text-[13px] text-gray-900">
                      {complaint.customer.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 uppercase font-bold tracking-tighter">
                      Accused Staff
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-red-600">
                        @{complaint.staff.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                {/* Manage Button */}
                <Link
                  href={`/complaints/${complaint.complaintId}`}
                  className="w-full py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md group"
                >
                  <Shield size={14} className="group-hover:rotate-12 transition-transform" />
                  Manage Complaint
                </Link>
                <button
                  type="button"
                  onClick={() => setToDelete(complaint)}
                  className="w-full py-2.5 border border-red-200 bg-white text-red-600 rounded-md text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={14} />
                  Delete
                </button>


              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setToDelete(null)}>
          <div className="bg-white rounded-md w-full max-w-sm shadow-2xl p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="size-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Trash2 size={20} /></span>
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-extrabold text-gray-900">অভিযোগ ডিলেট</span>
                <span className="text-[12px] font-mono text-gray-500 truncate">{toDelete.complaintId}</span>
              </div>
            </div>
            <p className="text-[14px] text-gray-700 leading-relaxed">
              আপনি কি শিউর এই অভিযোগের তথ্যগুলো ডিলেট করতে চান? ডিলেট করলে আর ফেরত আনা যাবে না।
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={isDeleting} onClick={() => setToDelete(null)} className="h-11 rounded-md border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">
                না
              </button>
              <button type="button" disabled={isDeleting} onClick={handleDelete} className="h-11 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? "ডিলেট হচ্ছে..." : "হ্যাঁ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution/Action Modal */}
      {selectedComplaint && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div
              className={`p-8 border-b ${actionType === "processing"
                ? "bg-blue-50 border-blue-100"
                : actionType === "hearing"
                  ? "bg-amber-50 border-amber-100"
                  : "bg-emerald-50 border-emerald-100"
                }`}
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2 capitalize">
                {actionType === "processing"
                  ? "Review & Process Complaint"
                  : actionType === "hearing"
                    ? "Issue Hearing Notice"
                    : "Finalize & Complete Complaint"}
              </h2>
              <p className="text-gray-600 text-sm font-mono tracking-tight">
                ID: {selectedComplaint.complaintId}
              </p>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-100">
                <p className="text-sm font-black text-red-600 uppercase mb-2 tracking-widest">
                  Customer Issue Details
                </p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {(actionType === "hearing" || actionType === "completed") && (
                <>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {actionType === "hearing"
                      ? "Hearing Details / Summons Note"
                      : "Final Resolution Details"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-black transition-all text-sm mb-2 resize-y text-gray-800"
                    placeholder={
                      actionType === "hearing"
                        ? "Enter hearing date, time, venue or online link..."
                        : "Explain the final decision, actions taken (e.g., staff warned/fined), and why it's completed..."
                    }
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                  <p className="text-sm text-gray-400 italic mb-6">
                    These notes will be visible to the customer on their
                    official complaint document.
                  </p>
                </>
              )}

              {actionType === "processing" && (
                <p className="text-sm font-medium text-blue-800 bg-blue-50 p-4 rounded-md border border-blue-100">
                  Moving this complaint to <strong>Processing</strong> indicates
                  that you (the admin) have viewed the complaint and are
                  actively investigating it. The customer's dashboard will
                  reflect this status.
                </p>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex gap-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setActionType(null);
                }}
                className="flex-1 py-4 text-sm font-bold text-gray-600 hover:text-black hover:bg-gray-200 rounded-md transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={
                  isResolving ||
                  ((actionType === "hearing" || actionType === "completed") &&
                    !adminNotes.trim())
                }
                className={`flex-1 py-4 text-white rounded-md text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${actionType === "processing"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : actionType === "hearing"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {isResolving
                  ? "Processing..."
                  : `Confirm ${actionType.replace("_", " ")}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
