"use client";

import { staffLogin } from "@/actions";
import PortalLoginShell, { PortalInput, PortalRememberRow, PortalSubmit, useRememberedValue } from "@/components/features/auth/PortalLoginShell";
import { StaffBlockedLoginView } from "@/components/features/staff/StaffBlockedScreen";
import { ArrowLeft, Lock, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function StaffLoginPage() {
  const [state, loginAction, isPending] = useActionState(staffLogin, undefined);
  const [username, setUsername] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{
    name?: string;
    id?: string;
  } | null>(null);
  const { remember, setRemember, load, save } = useRememberedValue("se-staff-username");

  useEffect(() => {
    load(setUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state && !state.success && (state as any).isBlocked) {
      setBlockedInfo({
        name: (state as any).name,
        id: (state as any).id,
      });
      setShowBlocked(true);
    }
  }, [state]);

  const handleSubmit = () => {
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }
    save(username);
  };

  // Blocked staff: full-page blocked design instead of the login form.
  if (showBlocked && blockedInfo) {
    return (
      <div className="relative">
        <StaffBlockedLoginView
          name={blockedInfo.name}
          staffId={blockedInfo.id}
          action={
            <button type="button" onClick={() => setShowBlocked(false)} className="mt-1 inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-white border border-[#cfe0fb] text-[13px] font-bold text-[#0b3d91] shadow-sm">
              <ArrowLeft size={16} />
              Close and Try Again
            </button>
          }
        />
      </div>
    );
  }

  return (
    <PortalLoginShell role="staff" title="এস্টাফ লগইন পোর্টাল" footerSubtitle="Authorized Staff Portal">
      <form action={loginAction} className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <PortalInput icon={User} label="Your Username" labelBn="আপনার ইউজারনেম" name="username" value={username} onChange={setUsername} autoComplete="username" required />
        <PortalInput icon={Lock} iconFill={false} type="password" label="Your Password" labelBn="আপনার পাসওয়ার্ড" name="password" autoComplete="current-password" required />
        <PortalRememberRow remember={remember} onRemember={setRemember} />

        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md text-sm font-semibold text-center">
            {state.message}
          </div>
        )}

        <PortalSubmit pending={isPending} />
      </form>
    </PortalLoginShell>
  );
}
