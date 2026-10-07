import { NoticeList } from "@/components";

export default function NoticePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notice Management</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Create and dispatch notifications to staff and customers</p>
      </div>
      <NoticeList />
    </div>
  );
}
