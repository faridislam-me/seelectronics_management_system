"use client";

import { getSellerOptions } from "@/actions";
import { useEffect, useState } from "react";

export default function SellerSelect({ value, onChange, className }: { value: string; onChange: (sellerId: string) => void; className?: string }) {
  const [options, setOptions] = useState<{ sellerId: string; shopName: string; ownerName: string }[]>([]);
  useEffect(() => { getSellerOptions().then((res) => setOptions(res.data || [])); }, []);
  return (
    <div className={className ?? "flex-1 text-start"}>
      <label className="text-sm">
        Purchased from (Seller / Dealer)
        <select name="sellerId" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border rounded-md outline-none h-10 px-2 mt-1">
          <option value="">Direct (SE Electronics)</option>
          {options.map((s) => <option key={s.sellerId} value={s.sellerId}>{s.shopName} · {s.ownerName} ({s.sellerId})</option>)}
        </select>
      </label>
    </div>
  );
}
