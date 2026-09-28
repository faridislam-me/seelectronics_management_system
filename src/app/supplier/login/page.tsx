"use client";

import { supplierLogin } from "@/actions/supplierActions";
import PortalLoginShell, { PortalInput, PortalRememberRow, PortalSubmit, useRememberedValue } from "@/components/features/auth/PortalLoginShell";
import { Lock, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

export default function SupplierLoginPage() {
  const [state, loginAction, isPending] = useActionState(supplierLogin, undefined);
  const [username, setUsername] = useState("");
  const { remember, setRemember, load, save } = useRememberedValue("se-supplier-username");

  useEffect(() => {
    load(setUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalLoginShell role="supplier" title="সাপ্লায়ার লগইন পোর্টাল" footerSubtitle="Authorized Supplier Portal">
      <form action={loginAction} className="flex flex-col gap-3" onSubmit={() => save(username)}>
        <PortalInput icon={User} label="Your Username / Mobile" labelBn="আপনার ইউজারনেম / মোবাইল" name="username" value={username} onChange={setUsername} autoComplete="username" required />
        <PortalInput icon={Lock} iconFill={false} type="password" label="Your Password" labelBn="আপনার পাসওয়ার্ড" name="password" autoComplete="current-password" required />
        <PortalRememberRow remember={remember} onRemember={setRemember} />
        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md text-sm font-semibold text-center">{state.message}</div>
        )}
        <PortalSubmit pending={isPending} />
      </form>
    </PortalLoginShell>
  );
}
