"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

export default function ZoomableView({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [fit, setFit] = useState(1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Start zoomed to fit the available width so the card never overflows small phones.
  useEffect(() => {
    const box = boxRef.current, content = contentRef.current;
    if (!box || !content) return;
    const avail = box.clientWidth - 16;
    const natural = content.scrollWidth;
    const f = natural > 0 ? Math.min(1, avail / natural) : 1;
    setFit(f);
    setScale(f);
  }, []);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const handleReset = () => setScale(fit);

  return (
    <div className="flex flex-col items-center w-full relative">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-[#dfe6f2] shadow-[0_4px_14px_rgba(11,61,145,0.10)] p-1 rounded-md z-20">
        <button
          onClick={handleZoomOut}
          className="size-8 flex items-center justify-center text-[#0b3d91] bg-[#eef4fd] hover:bg-[#dbe7fb] rounded-md transition-colors"
          title="Zoom Out"
        >
          <Minus className="size-4" />
        </button>
        <span className="text-[13px] font-extrabold w-12 text-center text-[#0b3d91]">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="size-8 flex items-center justify-center text-[#0b3d91] bg-[#eef4fd] hover:bg-[#dbe7fb] rounded-md transition-colors"
          title="Zoom In"
        >
          <Plus className="size-4" />
        </button>
        <div className="w-px h-5 bg-[#dfe6f2] mx-0.5"></div>
        <button
          onClick={handleReset}
          className="size-8 flex items-center justify-center text-[#0b3d91] bg-[#eef4fd] hover:bg-[#dbe7fb] rounded-md transition-colors"
          title="Reset Zoom"
        >
          <Maximize className="size-4" />
        </button>
      </div>

      <div ref={boxRef} className="w-full overflow-auto relative rounded-md bg-white border border-[#dfe6f2] p-2 pt-12 sm:p-6 sm:pt-16 flex">
        <div className="m-auto w-max h-max">
          <div ref={contentRef} style={{ zoom: scale }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
