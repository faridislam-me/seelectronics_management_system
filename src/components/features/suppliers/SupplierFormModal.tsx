"use client";

import { createSupplier, updateSupplier } from "@/actions/supplierActions";
import { Modal } from "@/components/ui";
import { CheckCircle2, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export type SupplierFormValues = {
  supplierId?: string;
  name?: string;
  shopName?: string;
  phone?: string;
  address?: string | null;
  origin?: string | null;
  note?: string | null;
};

const inputCls =
  "w-full h-10 rounded-md border border-[#d9e2f0] bg-white px-2.5 text-[14px] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";

/** Add / edit supplier. After creating, shows the login credentials once. */
export default function SupplierFormModal({ initial, onClose }: { initial?: SupplierFormValues; onClose: () => void }) {
  const router = useRouter();
  const isEdit = !!initial?.supplierId;
  const [pending, setPending] = useState(false);
  const [phone, setPhone] = useState(initial?.phone || "");
  const [username, setUsername] = useState("");
  const [created, setCreated] = useState<{ supplierId: string; username: string; password: string } | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    setPending(true);
    const res = isEdit ? await updateSupplier(initial!.supplierId!, fd) : await createSupplier(fd);
    setPending(false);
    if (!res.success) return void toast.error(res.message);
    toast.success(res.message);
    router.refresh();
    if (!isEdit && "data" in res && res.data) setCreated(res.data as any);
    else onClose();
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success("Copied"));
  };

  return (
    <Modal title={isEdit ? "Edit Supplier" : "Add Supplier"} isVisible width="600" onClose={onClose}>
      {created ? (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2 text-[#178a42] font-bold"><CheckCircle2 size={20} />Supplier created — save these login details now</div>
          <div className="rounded-md border border-[#dfe6f2] bg-[#f5f8fd] p-3 text-[14px] flex flex-col gap-2">
            {[
              ["Supplier ID", created.supplierId],
              ["Username", created.username],
              ["Password", created.password],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-[#5b6784]">{k}</span>
                <span className="flex items-center gap-2 font-bold">{v}<button type="button" onClick={() => copy(v)} className="text-[#1f7cf0]" aria-label={`Copy ${k}`}><Copy size={15} /></button></span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#5b6784]">Login page: <b>/supplier/login</b>. The password is shown only once.</p>
          <button type="button" onClick={onClose} className="h-10 rounded-md bg-[#0b3d91] text-white font-bold">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
          <label className="flex flex-col gap-1 text-[13px] font-semibold">Name *<input name="name" required defaultValue={initial?.name} className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">Shop name *<input name="shopName" required defaultValue={initial?.shopName} className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">Mobile *<input name="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold">From (origin)<input name="origin" defaultValue={initial?.origin || ""} placeholder="China / Dhaka ..." className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold sm:col-span-2">Address<input name="address" defaultValue={initial?.address || ""} className={inputCls} /></label>
          {!isEdit && (
            <label className="flex flex-col gap-1 text-[13px] font-semibold">Username<input name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={phone || "defaults to mobile"} className={inputCls} /></label>
          )}
          <label className="flex flex-col gap-1 text-[13px] font-semibold">{isEdit ? "New password (optional)" : "Password *"}<input name="password" type="text" required={!isEdit} minLength={6} autoComplete="new-password" className={inputCls} /></label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold sm:col-span-2">Note<textarea name="note" rows={2} defaultValue={initial?.note || ""} className={inputCls + " h-auto py-2"} /></label>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-[#d9e2f0] font-bold">Cancel</button>
            <button type="submit" disabled={pending} className="h-10 px-5 rounded-md bg-[#0b3d91] text-white font-bold disabled:opacity-60">{pending ? "Saving..." : isEdit ? "Save" : "Create Supplier"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
