"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  title,
  isVisible,
  onClose,
  width,
  children,
}: {
  title?: string;
  isVisible: boolean;
  width?: "500" | "600" | "700" | "800" | "900";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  const widthVariants = {
    500: "sm:max-w-[500px]",
    600: "sm:max-w-[600px]",
    700: "sm:max-w-[700px]",
    800: "sm:max-w-[800px]",
    900: "sm:max-w-[900px]",
  };

  useEffect(() => {
    setMounted(true);
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  if (!mounted) return null;

  return createPortal(
    isVisible && (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4  overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        />

        {/* Modal Content */}
        <div
          className={clsx(
            "relative w-full bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]",
            "rounded-t-3xl sm:rounded-3xl",
            "animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out",
            width ? widthVariants[width] : "sm:max-w-[800px]",
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-white sticky top-0 z-10">
            <h3 className="font-black text-xl sm:text-2xl text-brand truncate pr-4">
              {title || "Modal Title"}
            </h3>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-brand"
            >
              <X size={24} />
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    ),
    document.body,
  );
}
