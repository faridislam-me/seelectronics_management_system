"use client";

import { customerLogin } from "@/actions";
import PortalLoginShell, { PortalInput, PortalSubmit, useRememberedValue } from "@/components/features/auth/PortalLoginShell";
import { IdCard } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function CustomerLoginPage() {
  const [state, loginAction, isPending] = useActionState(
    customerLogin,
    undefined,
  );
  const [username, setUsername] = useState("");
  const { remember, setRemember, load, save } = useRememberedValue("se-customer-id");

  useEffect(() => {
    load(setUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    if (!username.trim()) {
      toast.error("Please enter your phone number or username");
      return;
    }
    save(username);
  };

  return (
    <PortalLoginShell role="customer" title="কাস্টমার লগইন পোর্টাল" footerSubtitle="Authorized Customer Portal">
      <form action={loginAction} className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <PortalInput icon={IdCard} iconFill={false} label="Your Customer ID / Invoice No." labelBn="আপনার কাস্টমার আইডি / ইনভয়েস নম্বর" name="customerId" value={username} onChange={setUsername} required />

        <label className="flex items-start gap-2.5 cursor-pointer px-0.5">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 size-5 accent-[#1f7cf0] shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-[#16213a]">Remember Me</span>
            <span className="text-[11.5px] text-[#5b6784]">আমাকে মনে রাখুন</span>
          </span>
        </label>

        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md text-sm font-semibold text-center">
            {state.message}
          </div>
        )}

        <PortalSubmit pending={isPending} pendingText="AUTHENTICATING..." />
      </form>
      <p className="mt-3 text-center text-[10.5px] font-semibold uppercase tracking-wider text-[#8a95ab]">© 2026 SE Electronics</p>
    </PortalLoginShell>
  );
}
