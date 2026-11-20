import { InstallmentStickerTemplateData } from "@/app/pdf/download/actions/pdfTypes";

/**
 * Product sticker for a financed (installment) unit — printed and stuck on the
 * product. Clean BLACK & WHITE label matching the physical SE Electronics
 * sticker: a thick black double-ruled box, the logo + large company name /
 * tagline / contact header separated by a rule, a column of large
 * `label ঃ value` spec rows, a QR floating bottom-right and a full-width
 * barcode at the foot. Square 76mm (≈3in) format. Electrical specs (VA/Watt,
 * Volt, Display) only show for IPS-like units.
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
      className="relative bg-white box-border overflow-hidden flex flex-col text-black"
      style={{
        width: "76mm",
        height: "76mm",
        fontFamily: `'Tiro Bangla', SolaimanLipi, Inter, sans-serif`,
        border: "3px solid #000",
        // Thin inner line → the double-ruled box look of the printed sticker.
        outline: "1px solid #000",
        outlineOffset: "-1.8mm",
      }}
    >
      {/* Header: logo + company identity (all black), ruled off below. */}
      <div className="flex items-center gap-2 px-2.5 pt-2 pb-1 border-b-[2.5px] border-black">
        {data.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logo}
            alt="logo"
            className="shrink-0 object-contain"
            style={{ width: "14mm", height: "14mm" }}
          />
        ) : null}
        <div className="min-w-0 flex-1 text-center leading-tight">
          <div className="text-[22px] font-black tracking-wide">এস ই ইলেকট্রনিক্স</div>
          <div className="text-[11px] font-bold">সেলস্‌ সার্ভিস সাপোর্ট</div>
          <div className="text-[9px] font-semibold">
            এয়ারপোর্ট রোড বাদাম বাগিচা সিলেট। ফোনঃ ০১৩২২২৪৭৭৭১
          </div>
        </div>
      </div>

      {/* Spec rows — large, evenly distributed down the available height. Values
          use (almost) the full width so long ones stay on one line; the QR is
          kept small and low so it only sits beside the last short-value rows. */}
      <div className="flex-1 min-h-0 flex flex-col justify-evenly pl-2.5 pr-2 py-[1mm] text-[13px]">
        <Row label="মডেল" value={data.productModel} />
        <Row label="সিরিয়াল নং" value={data.serialNumber} />
        {data.isElectrical && <Row label="ভিএ/ওয়াট" value={data.vaWatt} />}
        {data.isElectrical && <Row label="ভোল্ট" value={data.volt} />}
        <Row label="টাইপ" value={data.productType} />
        {data.isElectrical && <Row label="ডিসপ্লে" value={data.display} />}
        <Row label="প্রডাক্ট" value={data.productName} />
        <Row label="প্রাইজ" value={`${Number(data.price).toLocaleString("en-US")} TAKA`} />
        <Row label="কিস্তির মেয়াদ" value={`${data.months} MONTH`} />
        <Row label="ব্রান্ডের নাম" value={data.brand} />
      </div>

      {/* QR — floats bottom-right, boxed, above the barcode. */}
      {data.qrcode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.qrcode}
          alt="qr"
          className="absolute bg-white object-contain"
          style={{
            right: "2mm",
            bottom: "13mm",
            width: "14mm",
            height: "14mm",
            padding: "0.3mm",
            border: "1px solid #000",
          }}
        />
      ) : null}

      {/* Barcode — full width at the foot, inside the box. */}
      {data.barcode ? (
        <div
          className="px-2.5 pb-2 h-[11mm] w-full shrink-0 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: data.barcode }}
        />
      ) : null}
    </div>
  );
}
