import "server-only";
import { SELLER_CERTIFICATE_TYPES, SellerCertificatePayload } from "@/constants/sellerCertificates";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

export type SellerCertificateTemplateData = SellerCertificatePayload & {
  logo: string;
  seal: string;
  sign: string;
  qrcode: string;
};

const images = path.join(process.cwd(), "src", "assets", "images");
const toDataUrl = async (file: string, mime: string) =>
  `data:${mime};base64,${(await fs.promises.readFile(path.join(images, file))).toString("base64")}`;

/** Payload + the logo, seal, signature and QR code the certificate template needs. */
export async function buildSellerCertificateData(payload: SellerCertificatePayload): Promise<SellerCertificateTemplateData> {
  const [logo, seal, sign] = await Promise.all([
    toDataUrl("logo.jpg", "image/jpeg"),
    toDataUrl("documentSeal.jpeg", "image/jpeg"),
    toDataUrl("chairmanSeal.jpeg", "image/jpeg"),
  ]);
  const kind = SELLER_CERTIFICATE_TYPES[payload.certType];
  // QRCode directly (not id-gen) so this page does not load the native canvas module.
  const qr = await QRCode.toDataURL(
    [
      "SE ELECTRONICS CERTIFICATE",
      `No: ${payload.certNo}`,
      `Type: ${kind?.english || payload.certType}`,
      `Shop: ${payload.shopName}`,
      `Seller ID: ${payload.sellerId}`,
      `Issued: ${new Date(payload.issuedAt).toLocaleDateString("en-GB")}`,
    ].join("\n"),
    { margin: 1, width: 300 },
  );
  return { ...payload, logo, seal, sign, qrcode: qr };
}
