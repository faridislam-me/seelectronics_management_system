"use client";

import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";

// A4 width (210mm) in CSS pixels — the notice is laid out at this fixed width
// and zoomed down to fit narrower (phone) screens.
const A4_WIDTH_PX = 794;

/** Print / Download toolbar plus a fit-to-screen wrapper around the A4 notice. */
export default function NoticeFrame({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerWidth - 16) / A4_WIDTH_PX));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="gn-no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-[#0b3d91] truncate">এস ই ইলেকট্রনিক্স — নোটিশ</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#0b3d91]/25 bg-[#0b3d91]/5 text-[#0b3d91] text-[12px] font-extrabold"
          >
            <Printer size={14} /> প্রিন্ট
          </button>
          <a
            href={`/pdf/download?type=guarantor-notice&id=${token}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold"
          >
            <Download size={14} /> ডাউনলোড (PDF)
          </a>
        </div>
      </div>

      <div className="gn-sheet-wrap py-3 print:py-0 flex justify-center">
        <div className="gn-sheet shadow-md print:shadow-none" style={{ zoom }}>
          {children}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #fff !important; }
          .gn-no-print { display: none !important; }
          .gn-sheet { zoom: 1 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
