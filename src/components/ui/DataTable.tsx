import clsx from "clsx";
import type { ReactNode } from "react";

/** Bordered data table in the same style as the supplier statement / invoice tables. Scrolls sideways on phones. */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <div className="overflow-x-auto rounded-md border border-[#c9d4e6] bg-white">
        <table className="w-full border-collapse text-[12px] text-[#16213a]">{children}</table>
      </div>
      <span className="px-0.5 text-[10.5px] font-semibold text-[#6b7690] sm:hidden">← আরও কলাম দেখতে টেবিল পাশে সরান →</span>
    </div>
  );
}

export const thCls = "border border-[#c9d4e6] bg-[#eaf0fa] px-2 py-1.5 text-left font-bold whitespace-nowrap";
export const tdCls = "border border-[#c9d4e6] px-2 py-1.5 align-top";

export function Th({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) {
  return <th className={clsx(thCls, right && "text-right", className)}>{children}</th>;
}

export function Td({ children, right, nowrap = true, className, rowSpan, strong }: { children?: ReactNode; right?: boolean; nowrap?: boolean; className?: string; rowSpan?: number; strong?: boolean }) {
  return (
    <td rowSpan={rowSpan} className={clsx(tdCls, right && "text-right", nowrap && "whitespace-nowrap", strong && "font-bold", className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-2 py-6 text-center text-[#6b7690]">
        {text}
      </td>
    </tr>
  );
}
