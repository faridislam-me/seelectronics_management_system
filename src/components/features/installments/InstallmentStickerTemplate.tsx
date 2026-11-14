import { InstallmentStickerTemplateData } from "@/app/pdf/download/actions/pdfTypes";

/**
 * Product sticker for a financed (installment) unit — printed and stuck on the
 * product. Rebuilt to match the client's black-bordered label reference exactly:
 * a company header (logo + Bangla name / tagline / address) over a divider, a
 * column of `label ঃ value` spec rows stacked from the top with a fixed, roomy
 * line spacing (NOT spread to fill), a QR code floating at the bottom-right, and
 * a full-width barcode pinned at the very bottom. The square format mirrors the
 * 3in×3in (76mm) reference. Electrical specs (VA/Watt, Volt, Display) only show
 * for IPS-like units; a fridge/other unit shows just its relevant fields and
 * naturally leaves clean space at the bottom where the QR sits — exactly like
 * the reference sticker for such products.
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
        <span className="flex-1 pl-1.5 font-bold break-words">{text}</span>
      </div>
    );
  };

  return (
    <div
      className="relative bg-white box-border overflow-hidden flex flex-col text-black"
      style={{
        width: "76mm",
        height: "76mm",
        padding: "2mm",
        fontFamily: `'Tiro Bangla', SolaimanLipi, Inter, sans-serif`,
        border: "2.5px solid #000",
      }}
    >
      {/* Header: logo + company identity, with a full-width divider under it. */}
      <div className="border-b-[2.5px] border-black pb-1">
        <div className="flex items-center gap-2">
          {data.logo ? (
            <img
              src={data.logo}
              alt="logo"
              className="shrink-0 object-contain"
              style={{ width: "12mm", height: "12mm" }}
            />
          ) : null}
          <div className="min-w-0 flex-1 text-center leading-tight">
            <div className="text-[18px] font-black tracking-wide">
              এস ই ইলেকট্রনিক্স
            </div>
            <div className="text-[11px] font-bold">সেলস্ সার্ভিস সাপোর্ট</div>
          </div>
        </div>
        <div className="mt-0.5 text-center text-[9px] font-semibold leading-tight">
          এয়ারপোর্ট রোড বাদাম বাগিচা সিলেট। ফোনঃ ০১৩২২২৪৭৭৭১
        </div>
      </div>

      {/* Spec rows — stacked from the top with a fixed, roomy line spacing so a
          few-field unit packs neatly at the top (leaving clean space below for
          the QR) and a many-field unit extends down, both matching the client
          reference. */}
      <div className="flex-1 min-h-0 flex flex-col justify-start gap-[0.7mm] pt-[1.5mm] text-[11px]">
        <Row label="মডেল" value={data.productModel} />
        <Row label="সিরিয়াল নং" value={data.serialNumber} />
        {data.isElectrical && <Row label="ভিএ/ওয়াট" value={data.vaWatt} />}
        {data.isElectrical && <Row label="ভোল্ট" value={data.volt} />}
        <Row label="টাইপ" value={data.productType} />
        {data.isElectrical && <Row label="ডিসপ্লে" value={data.display} />}
        <Row label="প্রডাক্ট" value={data.productName} />
        <Row
          label="প্রাইজ"
          value={`${Number(data.price).toLocaleString("en-US")} TAKA`}
        />
        <Row label="কিস্তির মেয়াদ" value={`${data.months} MONTH`} />
        <Row label="ব্রান্ডের নাম" value={data.brand} />
      </div>

      {/* QR — floats at the bottom-right, just above the barcode, like the
          reference. In a dense unit it overlaps the right of the last rows (whose
          values are short and left-aligned); in a sparse unit it sits in the
          clean space below the rows. */}
      {data.qrcode ? (
        <img
          src={data.qrcode}
          alt="qr"
          className="absolute bg-white object-contain"
          style={{ right: "2mm", bottom: "12.5mm", width: "13mm", height: "13mm" }}
        />
      ) : null}

      {/* Barcode — full width, pinned at the very bottom as the last flex child
          (no caption, no divider above it), matching the reference. Kept in flow
          so a dense unit's rows can never overflow on top of it. */}
      {data.barcode ? (
        <div
          className="h-[10mm] w-full shrink-0 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: data.barcode }}
        />
      ) : null}
    </div>
  );
}
