"use client";

import { Eraser, PenLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Draw-your-signature box. Writes a transparent PNG (data URL) into a hidden
 * input called `name`, so it travels with the normal form post. Empty = "".
 */
export default function SignaturePad({ name = "signatureData", height = 150 }: { name?: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [value, setValue] = useState("");
  const [empty, setEmpty] = useState(true);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    // Keep what was drawn when the size changes (rotation / keyboard).
    const snapshot = value && !empty ? canvas.toDataURL() : "";
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0a0a0a";
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    last.current = p;
    const ctx = e.currentTarget.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setEmpty(false);
    setValue(e.currentTarget.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setValue("");
    setEmpty(true);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={value} />
      {/* Hidden required marker so the browser blocks submit until something is drawn */}
      <input tabIndex={-1} aria-hidden value={value} required onChange={() => {}} className="sr-only" style={{ position: "absolute", opacity: 0, height: 0, width: 0 }} />
      <div className="relative rounded-md border-2 border-dashed border-[#b9cdee] bg-white overflow-hidden" style={{ height }}>
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#9aa4b8]">
            <PenLine size={22} />
            <span className="text-[12.5px] font-semibold">এখানে আঙুল দিয়ে আপনার স্বাক্ষর করুন</span>
          </span>
        )}
        <span className="pointer-events-none absolute left-3 right-3 bottom-8 border-b border-[#dfe6f2]" />
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#5b6784]">এই স্বাক্ষর আপনার আইডি কার্ডে ব্যবহার করা হবে।</span>
        <button type="button" onClick={clear} className="h-8 px-3 rounded-md border border-[#dfe6f2] bg-white text-[12px] font-bold text-[#c81f38] inline-flex items-center gap-1.5">
          <Eraser size={14} />মুছুন
        </button>
      </div>
    </div>
  );
}
