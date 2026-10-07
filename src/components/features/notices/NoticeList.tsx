"use client";

import { deleteNotice, getNotices, getAllTeamMembers } from "@/actions";
import { Spinner, Timestamp } from "@/components/ui";
import { NoticeType, StaffsType } from "@/types";
import { formatDate } from "@/utils";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  MoreVertical,
  Bell,
  Info,
  AlertTriangle,
  Zap,
  CheckCircle2,
  UserCheck,
  Calendar,
} from "lucide-react";
import NoticeForm from "./NoticeForm";
import { toast } from "react-toastify";
import clsx from "clsx";

export default function NoticeList() {
  const [notices, setNotices] = useState<NoticeType[]>([]);
  const [staffs, setStaffs] = useState<StaffsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeType | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [noticesRes, staffsRes] = await Promise.all([
      getNotices(),
      getAllTeamMembers(),
    ]);
    if (noticesRes.success) setNotices(noticesRes.data as any);
    if (staffsRes.success) setStaffs(staffsRes.data as any);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    const res = await deleteNotice(id);
    if (res.success) {
      toast.success(res.message);
      fetchData();
    } else {
      toast.error(res.message);
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="h-64 __center">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by title or content..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-brand focus:bg-white rounded-md transition-all outline-none text-sm font-bold"
          />
        </div>
        <button
          onClick={() => {
            setEditingNotice(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-brand text-white rounded-md font-black uppercase tracking-widest text-sm hover:bg-brand-800 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Notice
        </button>
      </div>

      {/* Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div
                className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  {
                    "bg-blue-50 text-blue-600": notice.priority === "low",
                    "bg-emerald-50 text-emerald-600":
                      notice.priority === "normal",
                    "bg-orange-50 text-orange-600": notice.priority === "high",
                    "bg-rose-50 text-rose-600": notice.priority === "urgent",
                  },
                )}
              >
                {notice.priority}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingNotice(notice);
                    setShowForm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-md transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(notice.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4 flex-1">
              <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight line-clamp-2">
                {notice.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                {notice.content}
              </p>
            </div>

            {/* Stats / Status */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {notice.recipients?.slice(0, 3).map((r, i) => (
                    <div
                      key={i}
                      className="size-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden"
                    >
                      <UserCheck size={12} className="text-gray-400" />
                    </div>
                  ))}
                  {(notice.recipients?.length || 0) > 3 && (
                    <div className="size-7 rounded-full bg-brand/10 border-2 border-white flex items-center justify-center text-[10px] font-black text-brand">
                      +{(notice.recipients?.length || 0) - 3}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {(() => {
                    const n = notice.recipients?.length || 0;
                    switch (notice.audience) {
                      case "customer":
                        return notice.targetType === "all" ? "Customers · সবাই" : `Customers · ${n} জন`;
                      case "technician":
                        return "Technicians · সবাই";
                      case "electrician":
                        return "Electricians · সবাই";
                      default:
                        return notice.targetType === "all" ? "Staff · সবাই" : `Staff · ${n} জন`;
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Eye size={12} />
                <span className="text-[10px] font-black">
                  {notice.recipients?.filter((r) => r.isRead).length || 0}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between text-[10px] font-bold text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                {notice.scheduledAt ? (
                  <span className="text-brand">
                    Scheduled: {formatDate(notice.scheduledAt)}
                  </span>
                ) : (
                  <span>Created: {formatDate(notice.createdAt)}</span>
                )}
              </div>
              {notice.isDraft && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase">
                  Draft
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredNotices.length === 0 && (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 p-12 text-center">
          <div className="size-24 rounded-[2rem] bg-brand/5 flex items-center justify-center mb-6">
            <Bell size={40} className="text-brand/30" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No Notices Yet
          </h3>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed font-medium">
            Keep your team informed by sending updates, policy changes, and
            important announcements.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-brand text-white rounded-md font-black uppercase tracking-widest text-sm hover:bg-brand-800 transition-all shadow-lg shadow-brand/20"
          >
            Send First Notice
          </button>
        </div>
      )}

      {showForm && (
        <NoticeForm
          staffs={staffs}
          initialData={editingNotice}
          onClose={() => setShowForm(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
