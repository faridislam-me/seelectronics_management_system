"use client";

import { sellerLogin } from "@/actions";
import PortalLoginShell, { PortalInput, PortalRememberRow, PortalSubmit, useRememberedValue } from "@/components/features/auth/PortalLoginShell";
import { contactDetails } from "@/constants";
import { Lock, PhoneCall, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

export default function SellerLoginPage() {
  const [state, loginAction, isPending] = useActionState(sellerLogin, undefined);
  const [username, setUsername] = useState("");
  const { remember, setRemember, load, save } = useRememberedValue("se-seller-username");

  useEffect(() => {
    load(setUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalLoginShell role="seller" title="সেলার লগইন পোর্টাল" footerSubtitle="Authorized Seller Portal">
      <form action={loginAction} className="flex flex-col gap-3" onSubmit={() => save(username)}>
        <PortalInput icon={User} label="Your Username" labelBn="আপনার ইউজারনেম" name="username" value={username} onChange={setUsername} autoComplete="username" required />
        <PortalInput icon={Lock} iconFill={false} type="password" label="Your Password" labelBn="আপনার পাসওয়ার্ড" name="password" autoComplete="current-password" required />
        <PortalRememberRow remember={remember} onRemember={setRemember} />

        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-md text-sm font-semibold text-center">
            {state.message}
            {(state as any).isBlocked && <a href={`tel:${contactDetails.customerCare}`} className="flex items-center justify-center gap-2 mt-2 text-brand font-black"><PhoneCall size={14} />{contactDetails.customerCare}</a>}
          </div>
        )}

        <PortalSubmit pending={isPending} />
      </form>
      <p className="mt-3 text-center text-[10.5px] font-semibold uppercase tracking-wider text-[#8a95ab]">Authorized Seller &amp; Dealer Portal</p>
    </PortalLoginShell>
  );
}
