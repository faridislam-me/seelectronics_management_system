"use client";

import { useState } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

export default function ZoomableView({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const handleReset = () => setScale(1);

  return (
    <div className="flex flex-col items-center w-full h-full relative">
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

      <div className="flex-1 w-full h-full overflow-auto relative rounded-md bg-white border border-[#dfe6f2] p-2 pt-14 sm:p-6 sm:pt-16 flex">
        <div className="m-auto w-max h-max">
          <div
            className="origin-center transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
