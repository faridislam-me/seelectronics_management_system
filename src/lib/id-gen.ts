import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

/** `margin` is the white quiet zone in modules (library default 4). */
export async function qrcode(text: string, margin?: number): Promise<string> {
    try {
        return await QRCode.toDataURL(text, margin === undefined ? undefined : { margin, width: 300 });
    } catch (err) {
        console.error("QR Code Error:", err);
        return "";
    }
}

export async function barcode(text: string): Promise<string> {
    try {
        const canvas = createCanvas(150, 40);
        JsBarcode(canvas, text, {
            format: "CODE128",
            displayValue: false,
            width: 2,
            height: 30,
            margin: 0,
        });
        return canvas.toDataURL();
    } catch (err) {
        console.error("Barcode Error:", err);
        return "";
    }
}
