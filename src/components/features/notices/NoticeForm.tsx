"use client";

import { createNotice, searchCustomersForNotice, updateNotice } from "@/actions";
import { Modal, InputField, Spinner } from "@/components/ui";
import { NoticePriority, NoticeTarget, StaffsType } from "@/types";
import { NoticeSchema } from "@/validationSchemas";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  Search,
  User,
  Users,
  Bell,
  AlertTriangle,
  Clock,
  Save,
  Send,
  Wrench,
  X,
} from "lucide-react";
import clsx from "clsx";

type NoticeFormProps = {
  staffs: StaffsType[];
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NoticeForm({
  staffs,
  initialData,
  onClose,
  onSuccess,
}: NoticeFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    priority: (initialData?.priority as NoticePriority) || "normal",
    targetType: (initialData?.targetType as NoticeTarget) || "all",
    isDraft: initialData?.isDraft || false,
    scheduledAt: initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : "",
    expiresAt: initialData?.expiresAt
      ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
      : "",
    recipientIds: initialData?.recipients?.map((r: any) => r.staffId) || [],
  });

  // "Who gets it": staff side (all / only technicians / only electricians / picked) or customers (all / picked)
  type Who = "staff" | "customer";
  type Group = "all" | "technician" | "electrician" | "pick";
  const initAudience = (initialData?.audience as string) || "staff";
  const [who, setWho] = useState<Who>(initAudience === "customer" ? "customer" : "staff");
  const [group, setGroup] = useState<Group>(
    initialData && initialData.targetType !== "all"
      ? "pick"
      : initAudience === "technician" || initAudience === "electrician"
        ? (initAudience as Group)
        : "all",
  );
  const [pickedCustomers, setPickedCustomers] = useState<Record<string, string>>(
    Object.fromEntries(
      (initialData?.recipients || [])
        .filter((r: any) => r.customerId)
        .map((r: any) => [r.customerId, r.customer?.name || r.customerId]),
    ),
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<{ customerId: string; name: string; phone: string }[]>([]);

  useEffect(() => {
    if (who !== "customer" || group !== "pick" || customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await searchCustomersForNotice(customerQuery);
      setCustomerResults(res.data);
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery, who, group]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, setIsPending] = useState(false);

  const activeStaff = staffs.filter((s: any) => s.isActiveStaff !== false);
  const technicianCount = activeStaff.filter((s: any) => s.role === "technician").length;
  const electricianCount = activeStaff.filter((s: any) => s.role === "electrician").length;
  const pickedCount = who === "customer" ? Object.keys(pickedCustomers).length : formData.recipientIds.length;
  const summary =
    who === "customer"
      ? group === "pick"
        ? `বাছাই করা ${pickedCount} জন কাস্টমার`
        : "সব কাস্টমার (কাস্টমার অ্যাপ ও ড্যাশবোর্ডে দেখাবে)"
      : group === "pick"
        ? `বাছাই করা ${pickedCount} জন স্টাফ`
        : group === "technician"
          ? `শুধু টেকনিশিয়ান (${technicianCount} জন)`
          : group === "electrician"
            ? `শুধু ইলেকট্রিশিয়ান (${electricianCount} জন)`
            : `সব স্টাফ: টেকনিশিয়ান ও ইলেকট্রিশিয়ান (${activeStaff.length} জন)`;

  const filteredStaffs = staffs.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRecipient = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(staffId)
        ? prev.recipientIds.filter((id: string) => id !== staffId)
        : [...prev.recipientIds, staffId],
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    isDraftSubmit: boolean = false,
  ) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const audience = who === "customer" ? "customer" : group === "technician" || group === "electrician" ? group : "staff";
      const recipientIds = group === "pick" ? (who === "customer" ? Object.keys(pickedCustomers) : formData.recipientIds) : [];
      if (group === "pick" && recipientIds.length === 0) {
        toast.error(who === "customer" ? "কমপক্ষে একজন কাস্টমার বাছাই করুন" : "কমপক্ষে একজন স্টাফ বাছাই করুন");
        setIsPending(false);
        return;
      }
      const dataToValidate = {
        ...formData,
        audience: audience as "staff" | "technician" | "electrician" | "customer",
        targetType: (group === "pick" ? "multiple" : "all") as NoticeTarget,
        recipientIds,
        isDraft: isDraftSubmit,
        scheduledAt: formData.scheduledAt
          ? new Date(formData.scheduledAt)
          : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      };

      NoticeSchema.parse(dataToValidate);

      let res;
      if (initialData?.id) {
        res = await updateNotice(initialData.id, dataToValidate);
      } else {
        res = await createNotice(dataToValidate);
      }

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        console.error(error);
        toast.error("Something went wrong");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isVisible
      onClose={onClose}
      title={initialData ? "Edit Notice" : "Compose New Notice"}
      width="800"
    >
      <form className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            Notice Title
          </label>
          <input
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="e.g., Policy Update, Emergency Meeting"
            className="w-full px-4 py-3 rounded-md border-2 border-gray-100 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none font-bold"
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Priority Level</label>
          <div className="flex gap-2">
            {(["low", "normal", "high", "urgent"] as NoticePriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                className={clsx(
                  "flex-1 min-w-0 py-2 px-1 rounded-md text-xs font-black uppercase tracking-tight transition-all border-2",
                  formData.priority === p
                    ? {
                        "bg-blue-50 border-blue-200 text-blue-700": p === "low",
                        "bg-emerald-50 border-emerald-200 text-emerald-700": p === "normal",
                        "bg-orange-50 border-orange-200 text-orange-700": p === "high",
                        "bg-rose-50 border-rose-200 text-rose-700": p === "urgent",
                      }
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Who receives it */}
        <div className="space-y-3 rounded-md border-2 border-brand/15 bg-brand/[0.03] p-4">
          <label className="text-sm font-black text-gray-800">কাকে পাঠাবেন? <span className="font-bold text-gray-400">(Send to)</span></label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "staff" as Who, Icon: Wrench, title: "Staff", sub: "টেকনিশিয়ান/ইলেকট্রিশিয়ান" },
              { v: "customer" as Who, Icon: Users, title: "Customers", sub: "কাস্টমার অ্যাপে" },
            ]).map(({ v, Icon, title, sub }) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setWho(v);
                  setGroup("all");
                }}
                className={clsx(
                  "flex items-center gap-2 rounded-md border-2 p-2.5 text-left transition-all min-w-0",
                  who === v ? "border-brand bg-white shadow-sm" : "border-gray-100 bg-white/60 text-gray-400 hover:border-gray-200",
                )}
              >
                <span className={clsx("size-8 rounded-md flex items-center justify-center shrink-0", who === v ? "bg-brand text-white" : "bg-gray-100 text-gray-400")}><Icon size={18} /></span>
                <span className="flex flex-col leading-tight min-w-0">
                  <span className={clsx("text-xs font-black uppercase tracking-tight", who === v ? "text-brand" : "")}>{title}</span>
                  <span className="text-[10px] font-semibold text-gray-500">{sub}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(who === "staff"
              ? ([["all", "সব স্টাফ"], ["technician", "শুধু টেকনিশিয়ান"], ["electrician", "শুধু ইলেকট্রিশিয়ান"], ["pick", "বেছে নিন"]] as [Group, string][])
              : ([["all", "সব কাস্টমার"], ["pick", "বেছে নিন"]] as [Group, string][])
            ).map(([g, label]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-bold border-2 transition-all",
                  group === g ? "bg-brand/10 border-brand/40 text-brand" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="rounded-md bg-white border border-gray-100 px-3 py-2 text-[13px] font-bold text-gray-700 leading-snug">
            <Bell size={13} className="text-brand inline -mt-0.5 mr-1.5" />
            এই নোটিশ যাবে: <span className="text-brand">{summary}</span>
          </p>
        </div>

        {/* Pick staff */}
        {who === "staff" && group === "pick" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-700">
                Select Staff ({formData.recipientIds.length})
              </label>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-brand"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
              {filteredStaffs.map((staff) => (
                <button
                  key={staff.staffId}
                  type="button"
                  onClick={() => toggleRecipient(staff.staffId)}
                  className={clsx(
                    "flex items-center gap-2 p-2 rounded-md border transition-all text-left",
                    formData.recipientIds.includes(staff.staffId) ? "bg-brand/10 border-brand/30" : "bg-white border-gray-100 hover:border-brand/20",
                  )}
                >
                  <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {staff.photoUrl ? <img src={staff.photoUrl} alt="" className="size-full object-cover" /> : <User size={12} className="text-gray-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{staff.name}</p>
                    <p className="text-[10px] text-gray-500">{staff.staffId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pick customers */}
        {who === "customer" && group === "pick" && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-100">
            <label className="text-sm font-bold text-gray-700">Select Customers ({Object.keys(pickedCustomers).length})</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="নাম / মোবাইল / আইডি লিখুন..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-brand"
              />
            </div>
            {Object.keys(pickedCustomers).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(pickedCustomers).map(([id, name]) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand text-xs font-bold pl-2.5 pr-1 py-1">
                    {name}
                    <button type="button" aria-label="Remove" onClick={() => setPickedCustomers((prev) => { const n = { ...prev }; delete n[id]; return n; })} className="size-4 rounded-full hover:bg-brand/20 flex items-center justify-center"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            {customerResults.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {customerResults.map((c) => (
                  <button
                    key={c.customerId}
                    type="button"
                    onClick={() => setPickedCustomers((prev) => ({ ...prev, [c.customerId]: c.name }))}
                    className={clsx("flex items-center justify-between gap-2 p-2 rounded-md border text-left text-sm", pickedCustomers[c.customerId] ? "bg-brand/10 border-brand/30" : "bg-white border-gray-100 hover:border-brand/20")}
                  >
                    <span className="min-w-0"><b className="block truncate text-gray-900">{c.name}</b><span className="text-[11px] text-gray-500">{c.customerId} · {c.phone}</span></span>
                    <span className="text-xs font-bold text-brand shrink-0">{pickedCustomers[c.customerId] ? "✓ বাছাই" : "+ যোগ"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scheduling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              Schedule Release (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduledAt: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-md border-2 border-gray-100 focus:border-brand transition-all outline-none text-sm font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Bell size={16} className="text-gray-400" />
              Expiry Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-md border-2 border-gray-100 focus:border-brand transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Content (Rich Text Sim) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            Notice Content
          </label>
          <div className="border-2 border-gray-100 rounded-md overflow-hidden focus-within:border-brand transition-all">
            <div className="bg-gray-50 border-b border-gray-100 p-2 flex gap-1">
              {/* Basic rich text toolbar simulation */}
              {["B", "I", "U", "•"].map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className="size-8 rounded-md hover:bg-white hover:shadow-sm text-sm font-bold text-gray-600 transition-all"
                >
                  {tool}
                </button>
              ))}
            </div>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Write your notice here..."
              rows={8}
              className="w-full px-4 py-4 outline-none text-sm font-medium resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => handleSubmit(e, true)}
            className="flex-1 py-4 px-6 rounded-md bg-gray-100 text-gray-600 font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            {isPending ? <Spinner message="" /> : <Save size={18} />}
            Save Draft
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => handleSubmit(e, false)}
            className="flex-[2] py-4 px-6 rounded-md bg-brand text-white font-black uppercase tracking-widest text-sm hover:bg-brand-800 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
          >
            {isPending ? <Spinner message="" /> : <Send size={18} />}
            {initialData ? "Update & Dispatch" : "Send Notice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
