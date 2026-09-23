"use client";

import { SellersType } from "@/types";
import { Eye, MapPin, Phone, ShieldAlert, ShieldCheck, Store } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SellerProfileModal from "./SellerProfileModal";

export default function SellerListClient({ sellers }: { sellers: SellersType[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex-1 overflow-auto p-2 sm:p-3">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {sellers.map((seller) => (
          <div key={seller.id} onClick={() => setSelected(seller.sellerId)} className="group bg-white border border-gray-100 rounded-md sm:rounded-[2rem] p-3 sm:p-5 text-center transition-all hover:shadow-xl hover:shadow-brand/5 hover:border-brand/20 cursor-pointer relative overflow-hidden active:scale-[0.98]">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              {seller.isActiveSeller ? <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full" title="Active"><ShieldCheck size={14} /></div> : <div className="bg-rose-50 text-rose-600 p-1.5 rounded-full" title="Blocked"><ShieldAlert size={14} /></div>}
            </div>
            <div className="relative mx-auto mb-4">
              <div className="size-24 sm:size-32 rounded-md md:rounded-[2rem] overflow-hidden __center mx-auto border-4 border-gray-50 bg-gray-50">
                {seller.shopFrontPhotoUrl ? <Image src={seller.shopFrontPhotoUrl} alt={seller.shopName} width={160} height={160} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" /> : <Store className="text-gray-300" size={40} />}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                <span className="text-[11px] font-black text-brand uppercase tracking-widest">{seller.sellerId}</span>
              </div>
            </div>
            <h3 className="text-sm sm:text-base font-black text-gray-900 group-hover:text-brand line-clamp-1 mt-2">{seller.shopName}</h3>
            <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{seller.ownerName}</p>
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-50 mt-2 text-gray-500">
              <div className="flex items-center justify-center gap-1.5"><Phone size={12} className="text-brand/40" /><span className="text-xs font-bold">{seller.phone}</span></div>
              <div className="flex items-center justify-center gap-1.5"><MapPin size={12} className="text-brand/40" /><span className="text-xs font-bold truncate max-w-[120px]">{seller.shopDistrict}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-3 text-center">
              <div className="bg-gray-50 rounded-md py-1.5"><div className="text-sm font-black">{seller.purchasedUnits ?? 0}</div><div className="text-[9px] text-gray-500 uppercase">Units</div></div>
              <div className="bg-gray-50 rounded-md py-1.5"><div className="text-sm font-black">{seller.customersCount ?? 0}</div><div className="text-[9px] text-gray-500 uppercase">Cust.</div></div>
              <div className="bg-gray-50 rounded-md py-1.5"><div className={`text-sm font-black ${(seller.dueAmount ?? 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>৳{Math.round(seller.dueAmount ?? 0).toLocaleString()}</div><div className="text-[9px] text-gray-500 uppercase">Due</div></div>
            </div>
            <div className="pt-3">
              <div className="w-full py-2.5 rounded-md text-gray-900 bg-gray-50 group-hover:bg-brand group-hover:text-white transition-all flex items-center justify-center gap-2">
                <Eye size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">View Details</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && <SellerProfileModal sellerId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
