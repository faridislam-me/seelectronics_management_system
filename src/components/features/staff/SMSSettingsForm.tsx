"use client";

import { updateStaffSMSPreferences } from "@/actions/taskActions";
import { Spinner } from "@/components/ui";
import { StaffsType, SMSFrequency } from "@/types";
import { useState } from "react";
import { toast } from "react-toastify";
import { 
  Bell,
  Check,
  Clock, 
  Settings, 
  Save, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle,
  CalendarDays
} from "lucide-react";
import clsx from "clsx";

interface SMSSettingsFormProps {
  initialData: {
    smsNotificationEnabled: boolean;
    smsWorkingHoursOnly: boolean;
    smsFrequency: SMSFrequency;
    smsOptOut: boolean;
  };
}

export default function SMSSettingsForm({ initialData }: SMSSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const res = await updateStaffSMSPreferences(formData);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setIsPending(false);
  };

  const Toggle = ({ checked, onChange, danger = false, label }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean; label: string }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <span className={clsx(
        "w-10 h-[22px] rounded-full transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-[18px]",
        danger ? "bg-[#f3c6cd] peer-checked:bg-[#e0243f]" : "bg-[#cfd7e4] peer-checked:bg-[#1f7cf0]",
      )} />
    </label>
  );

  const Row = ({ icon: Icon, title, desc, children, disabled = false }: { icon: any; title: string; desc: string; children: React.ReactNode; disabled?: boolean }) => (
    <div className={clsx("flex items-center gap-2.5 py-2.5 border-t border-[#eef1f6] first:border-0", disabled && "opacity-50 pointer-events-none")}>
      <span className="size-9 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Icon size={17} /></span>
      <span className="flex flex-col min-w-0 flex-1 leading-tight">
        <span className="text-[13.5px] font-extrabold text-[#16213a]">{title}</span>
        <span className="text-[11.5px] text-[#5b6784]">{desc}</span>
      </span>
      {children}
    </div>
  );

  const freq = [
    { key: "immediate" as SMSFrequency, title: "Immediate", desc: "Send SMS as soon as a task is assigned" },
    { key: "daily_digest" as SMSFrequency, title: "Daily Digest", desc: "Receive one summary SMS at the end of the day" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full max-w-2xl mx-auto">
      {/* Title */}
      <section className="rounded-md bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_100%)] text-white p-3 flex items-center gap-3 shadow-[0_6px_18px_rgba(11,61,145,0.20)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Settings size={22} /></span>
        <span className="flex flex-col leading-tight">
          <span className="text-[18px] font-extrabold">Settings / সেটিংস</span>
          <span className="text-[11.5px] text-white/85">Control how and when you receive alerts</span>
        </span>
      </section>

      {/* SMS Notifications */}
      <section className="rounded-md bg-white border border-[#dfe6f2] shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7] rounded-t-md">
          <span className="size-7 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Smartphone size={15} /></span>
          <span className="text-[14.5px] font-extrabold text-[#0b3d91]">SMS Notifications</span>
        </div>
        <div className="px-2.5">
          <Row icon={Bell} title="Enable SMS Alerts" desc="Receive real-time SMS for new task assignments">
            <Toggle label="Enable SMS Alerts" checked={formData.smsNotificationEnabled} onChange={(v) => setFormData({ ...formData, smsNotificationEnabled: v })} />
          </Row>
          <Row icon={Clock} title="Working Hours Only" desc="Only send SMS between 9:00 AM and 9:00 PM" disabled={!formData.smsNotificationEnabled}>
            <Toggle label="Working Hours Only" checked={formData.smsWorkingHoursOnly} onChange={(v) => setFormData({ ...formData, smsWorkingHoursOnly: v })} />
          </Row>
        </div>

        {/* Frequency */}
        <div className={clsx("px-2.5 pt-1 pb-2.5 flex flex-col gap-2", !formData.smsNotificationEnabled && "opacity-50 pointer-events-none")}>
          <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold tracking-wide text-[#5b6784] uppercase"><CalendarDays size={14} className="text-[#1f7cf0]" />Notification Frequency</span>
          <div className="grid grid-cols-2 gap-2">
            {freq.map((f) => {
              const on = formData.smsFrequency === f.key;
              return (
                <button key={f.key} type="button" onClick={() => setFormData({ ...formData, smsFrequency: f.key })}
                  className={clsx("relative text-left rounded-md border p-2.5 transition-colors", on ? "bg-[#e8f1ff] border-[#1f7cf0]" : "bg-[#f7f9fc] border-[#dfe6f2]")}>
                  {on && <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>}
                  <span className={clsx("block text-[13px] font-extrabold pr-6", on ? "text-[#0b3d91]" : "text-[#16213a]")}>{f.title}</span>
                  <span className="block text-[11px] text-[#5b6784] leading-snug mt-0.5">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Opt-out */}
      <section className="rounded-md bg-[#fff4f5] border border-[#f7d4d9] p-2.5 flex items-start gap-2.5">
        <span className="size-9 rounded-full bg-white text-[#e0243f] border border-[#f7d4d9] flex items-center justify-center shrink-0"><AlertCircle size={18} /></span>
        <span className="flex flex-col min-w-0 flex-1 gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-extrabold text-[#9f1239]">Complete Opt-out</span>
            <Toggle danger label="Complete Opt-out" checked={formData.smsOptOut} onChange={(v) => setFormData({ ...formData, smsOptOut: v })} />
          </span>
          <span className="text-[11.5px] text-[#be123c] leading-relaxed">
            By enabling this, you will no longer receive any SMS notifications from SE Electronics, including urgent task updates and payment alerts.
          </span>
        </span>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[13.5px] font-extrabold tracking-wide inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.30)] disabled:opacity-60 active:scale-[0.98] transition-transform"
      >
        {isPending ? (
          <Spinner message="Saving..." />
        ) : (
          <>
            <Save size={18} />
            Save Notification Preferences
          </>
        )}
      </button>
    </form>
  );
}
