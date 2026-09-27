"use client";

import { updateMyProfileForm } from "@/actions/staffActions";
import type { BankInfo } from "@/types";
import { methodLogos, methodThemes } from "@/components/features/payments/paymentThemes";
import clsx from "clsx";
import { Check, Save } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

type PaymentMethod = "bkash" | "nagad" | "rocket" | "bank";

interface StaffPaymentSettingsFormProps {
  initialPaymentPreference: string | null;
  initialWalletNumber: string | null;
  initialBankInfo: BankInfo | null;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank Account",
};

export function StaffPaymentSettingsForm({
  initialPaymentPreference,
  initialWalletNumber,
  initialBankInfo,
}: StaffPaymentSettingsFormProps) {
  const [method, setMethod] = useState<PaymentMethod>(
    (initialPaymentPreference as PaymentMethod) || "bkash",
  );
  const [walletNumber, setWalletNumber] = useState(initialWalletNumber ?? "");
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: initialBankInfo?.bankName ?? "",
    accountHolderName: initialBankInfo?.accountHolderName ?? "",
    accountNumber: initialBankInfo?.accountNumber ?? "",
    branchName: initialBankInfo?.branchName ?? "",
  });

  const [state, formAction, isPending] = useActionState(
    updateMyProfileForm,
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    toast(state.message, { type: state.success ? "success" : "error" });
  }, [state]);

  const isWallet =
    method === "bkash" || method === "nagad" || method === "rocket";

  const inputCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white px-3 text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0] transition-all";
  const labelCls = "block text-[12px] font-bold text-[#3d4a63] uppercase tracking-wide mb-1";

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="paymentPreference" value={method} />

      <div>
        <span className={labelCls}>Preferred payment method</span>
        <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-1.5">
          {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => {
            const t = methodThemes[m];
            const active = method === m;
            return (
              <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={active}
                className={clsx("relative h-[62px] rounded-md border flex flex-col items-center justify-center gap-1 transition-all", active ? clsx(t.card, t.border, "ring-2 ring-[#1f7cf0]") : "bg-white border-[#dfe6f2]")}>
                <Image src={methodLogos[m]} alt="" width={28} height={28} className="size-7 object-contain" />
                <span className={clsx("text-[11.5px] font-extrabold", active ? t.mark : "text-[#3d4a63]")}>{METHOD_LABELS[m]}</span>
                {active && <span className="absolute top-1 right-1 size-4 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><Check size={11} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      </div>

      {isWallet ? (
        <div>
          <label className={labelCls}>{METHOD_LABELS[method]} number</label>
          <input
            type="tel"
            name="walletNumber"
            value={walletNumber}
            onChange={(e) => setWalletNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            required={isWallet}
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-[#5b6784]">
            পেমেন্ট এই নম্বরে পাঠানো হবে। সঠিক পার্সোনাল নাম্বার দিন।
          </p>
        </div>
      ) : (
        <>
          <input type="hidden" name="walletNumber" value="" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Bank name</label>
              <input type="text" name="bankName" value={bankInfo.bankName} onChange={(e) => setBankInfo((p) => ({ ...p, bankName: e.target.value }))} placeholder="e.g. DBBL, City Bank" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Account holder name</label>
              <input type="text" name="accountHolderName" value={bankInfo.accountHolderName} onChange={(e) => setBankInfo((p) => ({ ...p, accountHolderName: e.target.value }))} placeholder="Your name" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Account number</label>
              <input type="text" name="accountNumber" value={bankInfo.accountNumber} onChange={(e) => setBankInfo((p) => ({ ...p, accountNumber: e.target.value }))} placeholder="1234567890" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Branch name</label>
              <input type="text" name="branchName" value={bankInfo.branchName} onChange={(e) => setBankInfo((p) => ({ ...p, branchName: e.target.value }))} placeholder="e.g. Sylhet Branch" required className={inputCls} />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white font-extrabold text-[14px] uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        <Save size={17} />
        {isPending ? "Saving..." : "Save payment details"}
      </button>
    </form>
  );
}
