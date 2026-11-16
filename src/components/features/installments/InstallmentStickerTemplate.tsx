import { InstallmentStickerTemplateData } from "@/app/pdf/download/actions/pdfTypes";

/**
 * Product sticker for a financed (installment) unit — printed and stuck on the
 * product. Polished BLUE design: a filled blue header band (logo on a white
 * disc + Bangla company name / tagline), a blue contact strip, a column of
 * `label ঃ value` spec rows, a QR floating bottom-right, a full-width barcode,
 * and a blue footer band ("SE Electronics — Always With You"). Square 76mm
 * (≈3in) format. Electrical specs (VA/Watt, Volt, Display) only show for
 * IPS-like units, so a fridge/other unit shows just its relevant fields.
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
        <span className="w-[24mm] shrink-0 font-bold text-[#0b3d91]">{label}</span>
        <span className="shrink-0 font-bold text-[#0b3d91]">ঃ</span>
        <span className="flex-1 pl-1 font-extrabold text-black break-words">{text}</span>
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
        border: "2px solid #0b3d91",
      }}
    >
      {/* Blue header band: logo on a white disc + company identity. */}
      <div className="flex items-center gap-2 px-2 py-1.5" style={{ background: "#0b3d91" }}>
        {data.logo ? (
          <span
            className="shrink-0 rounded-full bg-white flex items-center justify-center"
            style={{ width: "12mm", height: "12mm" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logo}
              alt="logo"
              className="object-contain"
              style={{ width: "10.5mm", height: "10.5mm" }}
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 text-center leading-tight text-white">
          <div className="text-[17px] font-black tracking-wide">এস ই ইলেকট্রনিক্স</div>
          <div className="text-[10px] font-bold opacity-90">সেলস্ সার্ভিস সাপোর্ট</div>
        </div>
      </div>

      {/* Contact strip under the header band. */}
      <div
        className="text-center text-[8.5px] font-semibold leading-tight py-[0.6mm] border-b-2"
        style={{ borderColor: "#0b3d91", color: "#0b3d91" }}
      >
        এয়ারপোর্ট রোড বাদাম বাগিচা সিলেট। ফোনঃ ০১৩২২২৪৭৭৭১
      </div>

      {/* Spec rows — distributed EVENLY down the whole available height so the
          card fills top-to-bottom (no cramped block up top with dead space
          below). Right padding keeps the values clear of the QR that floats in
          the bottom-right. justify-evenly adapts: few rows spread out, many rows
          sit closer. */}
      <div className="flex-1 min-h-0 flex flex-col justify-evenly pl-2 pr-[14mm] py-[1.5mm] text-[11px]">
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

      {/* QR — floats bottom-right, boxed in the blue accent, above the barcode. */}
      {data.qrcode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.qrcode}
          alt="qr"
          className="absolute bg-white object-contain rounded"
          style={{
            right: "2mm",
            bottom: "14mm",
            width: "13mm",
            height: "13mm",
            padding: "0.3mm",
            border: "1px solid #0b3d91",
          }}
        />
      ) : null}

      {/* Barcode — full width, just above the footer band. */}
      {data.barcode ? (
        <div
          className="px-2 h-[9mm] w-full shrink-0 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: data.barcode }}
        />
      ) : null}

      {/* Blue footer band. */}
      <div
        className="text-center text-[8.5px] font-bold text-white py-[0.7mm] shrink-0"
        style={{ background: "#0b3d91" }}
      >
        SE Electronics — Always With You
      </div>
    </div>
  );
}
