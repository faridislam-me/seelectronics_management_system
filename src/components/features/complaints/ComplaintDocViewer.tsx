"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** A4 width in CSS pixels (210mm at 96dpi). */
const A4_WIDTH_PX = 793.7;

/**
 * On-screen viewer for an A4 complaint document (GD copy, absent notice):
 * shrinks the sheet to fit the screen, and offers Print (browser print dialog,
 * sheet only) and Download (the same document as a PDF via /pdf/download).
 */
export default function ComplaintDocViewer({
  title,
  downloadHref,
  backHref,
  children,
}: {
  title: string;
  downloadHref: string;
  backHref: string;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, el.clientWidth / A4_WIDTH_PX));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#e9edf5]">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
          body * { visibility: hidden !important; }
          .complaint-doc-sheet, .complaint-doc-sheet * { visibility: visible !important; }
          .complaint-doc-sheet { position: absolute !important; left: 0; top: 0; zoom: 1 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .complaint-doc-sheet * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="sticky top-0 z-20 bg-[#0b3d91] text-white shadow-md">
        <div className="max-w-[860px] mx-auto flex items-center gap-2 px-3 py-2.5">
          <a href={backHref} aria-label="ফিরে যান" className="size-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <ArrowLeft size={18} />
          </a>
          <span className="flex-1 min-w-0 truncate text-[15px] font-extrabold">{title}</span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white text-[#0b3d91] text-[13px] font-extrabold active:scale-[0.98]"
          >
            <Printer size={15} />
            প্রিন্ট
          </button>
          <a
            href={downloadHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#e0a11b] text-white text-[13px] font-extrabold active:scale-[0.98]"
          >
            <Download size={15} />
            ডাউনলোড
          </a>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto p-2 sm:p-4">
        <div ref={frameRef} className="w-full flex justify-center">
          <div className="complaint-doc-sheet shadow-[0_6px_24px_rgba(11,61,145,0.18)]" style={{ zoom }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
