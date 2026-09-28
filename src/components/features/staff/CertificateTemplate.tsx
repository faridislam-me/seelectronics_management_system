import { CertificateData } from "@/types";

interface CertificateProps extends CertificateData {
  issueDate: Date;
  bgImage: string;
  qrcode: string;
  font1: string;
  font2: string;
  font3: string;
}

export default function CertificateTemplate({
  data,
}: {
  data: CertificateProps;
}) {
  return (
    <div
      className="relative  w-[297mm] h-[210mm] mx-auto  bg-center bg-no-repeat bg-cover text-slate-900 grid-cols-[156px_88px_576px_140px_162px] grid-rows-[138px_89px_11px_32px_35px_55px_55px_55px_1fr]"
      style={{ backgroundImage: `url(${data.bgImage})` }}
    >
      <style>{`
            @font-face {
                font-family: 'font1';
                src: url('${data.font1}') format('truetype');
            }
            @font-face {
                font-family: 'font2';
                src: url('${data.font2}') format('truetype');
            }
            @font-face {
                font-family: 'font3';
                src: url('${data.font3}') format('truetype');
            }
            `}</style>
      {/* All positions are in px on the 297mm x 210mm (1123 x 794) artwork.
          Each field sits on its dotted line with the same 4px gap. */}
      {/* QR code (enlarged, drawn over the artwork's small QR box) */}
      <div className="absolute left-[146px] top-[120px] w-[118px] flex flex-col items-stretch">
        <div className="h-[112px] bg-white border-2 border-[#2b3a67] rounded-[3px] flex items-center justify-center">
          <img src={data.qrcode} alt="qr" width={108} height={108} className="w-[108px] h-[108px] object-contain" />
        </div>
        <div className="-mt-[2px] h-[26px] bg-white border-2 border-[#2b3a67] rounded-[3px] text-[12px] font-bold tracking-wide text-[#16213a] flex items-center justify-center">SCAN NOW</div>
      </div>

      {/* Shop name: larger, one line below "PROUDLY PRESENTED TO SHOP NAME" */}
      <div
        className="absolute left-[300px] w-[530px] top-[246px] h-[50px] flex items-center justify-center text-[42px] leading-none font-bold text-slate-900 whitespace-nowrap"
        style={{ fontFamily: '"font1", system-ui' }}
      >
        {data.shopName}
      </div>

      {/* Member number, centred in its box */}
      <div className="absolute left-[885px] top-[240px] w-[78px] h-[27px] flex items-center justify-center font-bold text-slate-800 text-[19px] tracking-wider leading-none">
        {data.memberNumber}
      </div>

      {/* Fields: bottom edge 4px above each dotted line */}
      <Field left={342} line={351} width={590} font="font2" size={30}>{data.ownerName}</Field>
      <Field left={286} line={387} width={245} font="font2" size={30}>{data.shopId}</Field>
      <Field left={634} line={387} width={298} font="font2" size={30}>{data.phone}</Field>
      <Field left={286} line={430} width={322} font="font2" size={30}>{data.address}</Field>
      <Field left={732} line={430} width={200} font="font2" size={30}>{data.district}</Field>

      {/* Issue date, centred on its line */}
      <div className="absolute left-[145px] w-[150px] top-[598px] h-[30px] flex items-end justify-center pb-[3px] text-xl leading-none text-slate-700">
        {data.issueDate.toLocaleDateString("en-GB")}
      </div>

        <p className="absolute top-[119mm] left-[12.5%] w-[75%] text-center font-bold text-slate-800 leading-relaxed">
          This certificate is proudly awarded to {data.shopName || "N/A"}. Your
          passion for contributing has been a source of endless inspiration.
          With great admiration, we present this gesture of gratitude. our
          heartfelt efforts for SE ELECTRONICS BD have not gone unnoticed.
        </p>
    </div>
  );
}

function Field({ left, line, width, font, size, children }: { left: number; line: number; width: number; font: "font2" | "font3" | "sans"; size: number; children: React.ReactNode }) {
  const h = 40;
  return (
    <div
      className="absolute flex items-end overflow-visible whitespace-nowrap leading-none text-slate-900"
      style={{
        left,
        top: line - h + 5, // script font has a deep descent; this puts the baseline just on the dotted line
        width,
        height: h,
        fontSize: size,
        fontFamily: font === "sans" ? "system-ui, sans-serif" : `"${font}", cursive`,
        fontWeight: 400, // thin script, same for every field
      }}
    >
      {children}
    </div>
  );
}
