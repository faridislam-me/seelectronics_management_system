"use client";

import { getStaffTasks, updateTaskStatus } from "@/actions/taskActions";
import { Spinner, Modal } from "@/components/ui";
import { TaskType, TaskStatus } from "@/types";
import { formatDate } from "@/utils";
import { useState, useEffect } from "react";
import {
  ListTodo,
  ChevronRight,
  Info,
  AlertTriangle,
  Zap,
  Calendar,
  Clock,
  Inbox,
  PlayCircle,
  CheckCircle,
  XCircle,
  FileText,
  Bell,
  Wrench,
  ClipboardList,
  PlusCircle,
  Settings,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const getVisualStatus = (task: any): TaskStatus => {
  const tStatus = task.status as TaskStatus;
  if (!task.service) return tStatus;

  const sStatus = task.service.status;
  if (sStatus === "completed") return "completed";
  if (sStatus === "canceled" || sStatus === "appointment_retry")
    return "cancelled";

  // Respect the task's own status (pending/in_progress) while the service is active
  return tStatus;
};

export default function StaffTaskList() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [tab, setTab] = useState<"pending" | "new" | "completed" | null>(null);
  const router = useRouter();
  const [readTasks, setReadTasks] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("readTasks") || "[]");
    }
    return [];
  });
  const fetchData = async () => {
    setIsLoading(true);
    const res = await getStaffTasks();
    if (res.success) setTasks(res.data as any);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAsRead = (taskId: string) => {
    setReadTasks((prev) => {
      if (prev.includes(taskId)) return prev; // duplicate prevent
      const updated = [...prev, taskId];
      localStorage.setItem("readTasks", JSON.stringify(updated));
      return updated;
    });
  };
  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    setIsUpdatingStatus(true);
    const res = await updateTaskStatus(taskId, newStatus);
    if (res.success) {
      toast.success(res.message);
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: newStatus } : t,
        ),
      );

      // Redirect to report page if starting a service task
      if (newStatus === "in_progress" && (selectedTask?.serviceId || taskId)) {
        const targetTask =
          selectedTask?.taskId === taskId
            ? selectedTask
            : tasks.find((t) => t.taskId === taskId);
        if (targetTask?.serviceId) {
          router.push(`/service-report?serviceId=${targetTask.serviceId}`);
          return;
        }
      }

      if (selectedTask?.taskId === taskId) {
        setSelectedTask((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } else {
      toast.error(res.message);
    }
    setIsUpdatingStatus(false);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const isDone = (t: TaskType) => ["completed", "cancelled"].includes(getVisualStatus(t));
  const tabs = [
    { key: "pending" as const, label: "Pending", icon: Clock, count: pendingCount },
    { key: "new" as const, label: "New Service", icon: PlusCircle, count: tasks.filter((t) => !readTasks.includes(t.taskId)).length },
    { key: "completed" as const, label: "Completed", icon: CheckCircle, count: tasks.filter(isDone).length },
  ];
  // No tab selected = all tasks (same list as before); tapping a tab filters, tapping again clears.
  const visibleTasks = tasks.filter((t) =>
    tab === "pending" ? !isDone(t) : tab === "new" ? !readTasks.includes(t.taskId) : tab === "completed" ? isDone(t) : true,
  );

  const chip = (st: TaskStatus) =>
    st === "completed"
      ? { cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]", icon: CheckCircle }
      : st === "cancelled"
        ? { cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]", icon: XCircle }
        : st === "in_progress"
          ? { cls: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]", icon: PlayCircle }
          : { cls: "bg-[#fff4d6] text-[#9a5b00] border-[#f5dfa0]", icon: Clock };

  return (
    <div className="flex flex-col gap-2.5 text-[#16213a]">
      {/* Title */}
      <div className="relative flex items-center gap-3 rounded-md bg-white border border-[#dfe6f2] p-2.5 overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <span className="size-12 rounded-full bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center shrink-0"><ClipboardList size={24} /></span>
        <span className="flex flex-col leading-tight min-w-0 flex-1 relative z-10">
          <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">Service Tasks</span>
          <span className="text-[12px] font-semibold text-[#5b6784]">আপনার সকল সার্ভিস কাজের তালিকা</span>
        </span>
        <span aria-hidden className="relative shrink-0 w-[84px] h-12">
          <span className="absolute right-0 top-0 size-12 rounded-full bg-[#e8f1ff]" />
          <Settings size={22} className="absolute left-1 top-3 text-[#1f7cf0]/70" />
          <span className="absolute right-2 top-1.5 size-9 rounded-md bg-[linear-gradient(135deg,#1f7cf0,#0b3d91)] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(31,124,240,0.35)]"><Wrench size={18} /></span>
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-md bg-white border border-[#dfe6f2] p-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(active ? null : t.key)}
              className={clsx(
                "h-10 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-extrabold transition-colors min-w-0 px-1",
                active ? "bg-[#1f7cf0] text-white shadow-[0_4px_12px_rgba(31,124,240,0.3)]" : "text-[#16213a] hover:bg-[#f2f6fd]",
              )}
            >
              <t.icon size={16} className="shrink-0" />
              <span className="truncate">{t.label}</span>
              {t.key === "pending" && (
                <span className={clsx("min-w-5 h-5 px-1 rounded-md text-[11px] font-extrabold inline-flex items-center justify-center shrink-0", active ? "bg-white/25 text-white" : "bg-[#e8f1ff] text-[#1f5fc9]")}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="grid gap-2.5 w-full">
        {visibleTasks.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-gray-400 bg-white rounded-md border border-dashed p-4">
            <Inbox size={32} />
            <p className="text-xs font-bold uppercase mt-1">
              No tasks assigned
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const vs = getVisualStatus(task);
            const c = chip(vs);
            const isNew = !readTasks.includes(task.taskId);
            return (
              <button
                key={task.taskId}
                onClick={() => {
                  handleMarkAsRead(task.taskId);
                  setSelectedTask(task);
                }}
                className={clsx(
                  "w-full flex flex-col gap-2 p-2.5 rounded-md border text-left shadow-[0_4px_14px_rgba(11,61,145,0.06)] transition-all",
                  vs === "completed" ? "bg-[#fbfefc] border-[#cdeedb]" : "bg-white border-[#dfe6f2] hover:border-[#9cc2f7]",
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className={clsx("inline-flex items-center gap-1.5 h-7 px-2 rounded-md border text-[11px] font-extrabold uppercase tracking-wide", c.cls)}>
                    <c.icon size={14} strokeWidth={2.4} />
                    {vs.replace("_", " ")}
                  </span>
                  {isNew ? (
                    <span className="h-7 px-2 rounded-md bg-[#fff4d6] border border-[#f5dfa0] text-[#b8620b] text-[11px] font-extrabold uppercase inline-flex items-center animate-pulse">NEW SERVICE</span>
                  ) : vs === "completed" ? (
                    <span className="h-7 px-2 rounded-md bg-[#e9f9ef] border border-[#bfe8cd] text-[#178a42] text-[11px] font-extrabold inline-flex items-center">Completed</span>
                  ) : null}
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="size-12 rounded-md bg-[linear-gradient(135deg,#1f7cf0,#0b56c9)] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(31,124,240,0.3)]"><Wrench size={24} /></span>
                  <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[15px] font-extrabold text-[#0b2a66] break-words leading-snug">
                      {task.staff?.name ? `${task.staff.name} - ` : ""}
                      {task.title}
                    </span>
                    <span className="text-[13px] text-[#5b6784] line-clamp-3 break-words leading-snug">{task.description}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#e3e8f1] border-t border-[#eef1f6] pt-2 text-[12px] font-semibold text-[#3d4a63]">
                  <span className="flex items-center gap-1.5 min-w-0 pr-2">
                    <Calendar size={15} className="shrink-0 text-[#1f5fc9]" />
                    <span className="truncate">Due: {task.dueDate ? formatDate(task.dueDate) : "No Deadline"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0 pl-2">
                    <Clock size={15} className="shrink-0 text-[#1f5fc9]" />
                    <span className="truncate">Assigned: {formatDate(task.createdAt)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-md bg-[#f2f6fd] px-2 py-1.5">
                  <span className="flex items-center gap-2 min-w-0 text-[13px] font-bold">
                    <span className="size-7 rounded-md bg-white text-[#5b6784] flex items-center justify-center shrink-0"><User size={15} /></span>
                    <span className="truncate">SE Team</span>
                    <span className="size-2 rounded-full bg-[#1a9c4b] shrink-0" />
                  </span>
                  <span className="shrink-0 h-8 px-3 rounded-md bg-[#1f7cf0] text-white text-[12px] font-extrabold inline-flex items-center gap-1">Details<ChevronRight size={15} /></span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isVisible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
        width="700"
      >
        {selectedTask && (
          <div className="space-y-8 p-1">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-md text-xs font-black uppercase tracking-[0.2em] shadow-sm",
                      {
                        "bg-blue-500 text-white":
                          selectedTask.priority === "low",
                        "bg-emerald-500 text-white":
                          selectedTask.priority === "normal",
                        "bg-orange-500 text-white":
                          selectedTask.priority === "high",
                        "bg-rose-500 text-white":
                          selectedTask.priority === "urgent",
                      },
                    )}
                  >
                    {selectedTask.priority} Priority
                  </span>
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-md text-xs font-black uppercase tracking-[0.2em] bg-gray-100 text-gray-600",
                    )}
                  >
                    {getVisualStatus(selectedTask).replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                  {selectedTask.title}
                </h2>
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Assigned Date
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <Calendar size={14} className="text-brand shrink-0" />
                  <span className="truncate">
                    {formatDate(selectedTask.createdAt)}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Due Date
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <Clock size={14} className="text-brand shrink-0" />
                  <span className="truncate">
                    {selectedTask.dueDate
                      ? formatDate(selectedTask.dueDate)
                      : "No Deadline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} className="text-brand shrink-0" />
                Task Description
              </h4>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm min-h-24 text-gray-700 leading-relaxed text-base font-medium whitespace-pre-wrap break-words">
                {selectedTask.description}
              </div>
            </div>

            {/* Attachments (Placeholder for now) */}
            {selectedTask.files && selectedTask.files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} className="text-brand shrink-0" />
                  Associated Files
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTask.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-brand/20 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-7 rounded bg-brand/10 flex items-center justify-center text-brand shrink-0">
                          <FileText size={14} />
                        </div>
                        <span className="font-bold text-gray-600 truncate max-w-[120px]">
                          File_{idx + 1}
                        </span>
                      </div>
                      <button className="text-[10px] font-black uppercase text-brand tracking-widest opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              {(getVisualStatus(selectedTask) === "pending" ||
                getVisualStatus(selectedTask) === "in_progress") && (
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    if (getVisualStatus(selectedTask) === "pending") {
                      handleStatusUpdate(selectedTask.taskId, "in_progress");
                    } else if (selectedTask.serviceId) {
                      router.push(
                        `/service-report?serviceId=${selectedTask.serviceId}`,
                      );
                    }
                  }}
                  className="flex-1 min-w-[120px] py-3 rounded-md bg-blue-600 text-white font-black uppercase tracking-wider text-[10px] sm:text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                >
                  {isUpdatingStatus ? (
                    <Spinner />
                  ) : getVisualStatus(selectedTask) === "pending" ? (
                    <>
                      <PlayCircle size={16} />
                      Start Task
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Open Report
                    </>
                  )}
                </button>
              )}
              {getVisualStatus(selectedTask) !== "completed" &&
                getVisualStatus(selectedTask) !== "cancelled" && (
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() =>
                      handleStatusUpdate(selectedTask.taskId, "cancelled")
                    }
                    className="py-3 px-4 rounded-md bg-gray-100 text-gray-500 font-black uppercase tracking-wider text-[10px] sm:text-xs hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdatingStatus ? <Spinner /> : <XCircle size={16} />}
                    Cancel
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
