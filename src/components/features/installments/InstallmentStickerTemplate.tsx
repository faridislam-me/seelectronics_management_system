import { InstallmentStickerTemplateData } from "@/app/pdf/download/actions/pdfTypes";

/**
 * Product sticker for a financed (installment) unit — printed and stuck on the
 * product. Matches the client's black-bordered label reference: company header
 * (logo + Bangla name / tagline / address), a column of `label ঃ value` spec
 * rows, and a barcode + QR at the bottom. The square format mirrors the 3in×3in
 * (216pt) reference. Electrical specs (VA/Watt, Volt, Display) only show for
 * IPS-like units; a fridge/other unit shows just its relevant fields.
 */
export default function InstallmentStickerTemplate({
  data,
}: {
  data: InstallmentStickerTemplateData;
}) {
  // A spec row renders only when it has a value, so the label column stays clean
  // and data-driven rather than showing a form full of blanks.
  const Row = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null | undefined;
  }) => {
    const text =
      value === null || value === undefined || value === "" ? null : String(value);
    if (!text) return null;
    return (
      <div className="flex items-start leading-tight">
        <span className="w-[26mm] shrink-0 font-bold">{label}</span>
        <span className="shrink-0 font-bold">ঃ</span>
        <span className="flex-1 pl-1.5 font-extrabold break-words">{text}</span>
      </div>
    );
  };

  return (
    <div
      className="bg-white box-border overflow-hidden flex flex-col text-black"
      style={{
        width: "76mm",
        height: "76mm",
        padding: "1.5mm",
        fontFamily: `'Tiro Bangla', SolaimanLipi, Inter, sans-serif`,
        border: "2.5px solid #000",
      }}
    >
      {/* Header: logo + company identity */}
      <div className="flex items-center gap-1.5 border-b-2 border-black pb-1">
        {data.logo ? (
          <img
            src={data.logo}
            alt="logo"
            className="shrink-0 object-contain"
            style={{ width: "12mm", height: "12mm" }}
          />
        ) : null}
        <div className="min-w-0 text-center flex-1 leading-tight">
          <div className="text-[14px] font-black tracking-wide">
            এস ই ইলেকট্রনিক্স
          </div>
          <div className="text-[9px] font-bold">সেলস সার্ভিস সাপোর্ট</div>
          <div className="text-[7px] font-semibold">
            এয়ারপোর্ট রোড বাদাম বাগিচা সিলেট। ফোনঃ ০১৩২২২৪৭৭৭১
          </div>
        </div>
      </div>

      {/* Spec rows — justify-evenly spreads whatever rows exist across the full
          body height, so a fridge/other unit with only a few specs still fills
          the label like the dense IPS reference instead of leaving a big blank. */}
      <div className="flex-1 flex flex-col justify-evenly py-1.5 text-[12px]">
        <Row label="মডেল" value={data.productModel} />
        <Row label="সিরিয়াল নং" value={data.serialNumber} />
        {data.isElectrical && <Row label="ভিএ/ওয়াট" value={data.vaWatt} />}
        {data.isElectrical && <Row label="ভোল্ট" value={data.volt} />}
        <Row label="টাইপ" value={data.productType} />
        {data.isElectrical && <Row label="ডিসপ্লে" value={data.display} />}
        <Row label="প্রডাক্ট" value={data.productName} />
        <Row
          label="প্রাইজ"
          value={`${Number(data.price).toLocaleString("en-US")} টাকা`}
        />
        <Row label="কিস্তির মেয়াদ" value={`${data.months} মাস`} />
        <Row label="ব্রান্ডের নাম" value={data.brand} />
      </div>

      {/* Bottom: barcode + QR */}
      <div className="flex items-end justify-between gap-2 border-t-2 border-black pt-1">
        <div className="min-w-0 flex-1">
          {data.barcode ? (
            <div
              className="h-[10mm] w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: data.barcode }}
            />
          ) : null}
          <div className="text-center font-mono text-[8px] font-bold tracking-wide">
            {data.serialNumber || data.planCode}
          </div>
        </div>
        {data.qrcode ? (
          <img
            src={data.qrcode}
            alt="qr"
            className="shrink-0"
            style={{ width: "15mm", height: "15mm" }}
          />
        ) : null}
      </div>
    </div>
  );
}
