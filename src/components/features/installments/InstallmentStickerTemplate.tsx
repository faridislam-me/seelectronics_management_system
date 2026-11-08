import { InstallmentStickerTemplateData } from "@/app/pdf/download/actions/pdfTypes";

const tk = (n: number) =>
  `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} Tk`;

/**
 * Compact product sticker (80mm × 110mm) meant to be printed and stuck on the
 * financed unit. The QR encodes the planCode so staff can scan to open the plan.
 */
export default function InstallmentStickerTemplate({
  data,
}: {
  data: InstallmentStickerTemplateData;
}) {
  return (
    <div
      className="bg-white box-border overflow-hidden flex flex-col"
      style={{
        width: "80mm",
        height: "110mm",
        padding: "5mm",
        fontFamily: `Inter, 'Tiro Bangla', SolaimanLipi, sans-serif`,
        border: "2px solid #0b3d91",
      }}
    >
      <div className="text-center border-b-2 border-[#0b3d91] pb-1.5">
        <div className="text-lg font-black tracking-wide text-[#0b3d91]">
          SE Electronics
        </div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Installment / কিস্তি
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center gap-1.5 py-2 text-center">
        {data.qrcode ? (
          <img
            src={data.qrcode}
            alt="plan-qr"
            style={{ width: "32mm", height: "32mm" }}
          />
        ) : null}
        <div className="font-mono text-base font-black text-[#0b3d91] tracking-wide">
          {data.planCode}
        </div>
        <div className="text-[13px] font-extrabold text-slate-900 leading-tight">
          {data.productModel}
          {data.productType ? (
            <span className="text-slate-500 font-semibold"> · {data.productType}</span>
          ) : null}
        </div>
        {data.serialNumber ? (
          <div className="text-[10px] text-slate-500">S/N: {data.serialNumber}</div>
        ) : null}
      </div>

      <div className="border-t-2 border-[#0b3d91] pt-1.5 text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Customer</span>
          <span className="font-bold text-slate-900 text-right truncate max-w-[45mm]">
            {data.customerName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Monthly</span>
          <span className="font-black text-[#0b3d91]">
            {tk(data.monthlyAmount)} × {data.months}
          </span>
        </div>
      </div>
    </div>
  );
}
