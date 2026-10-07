"use server";

import { DocType } from "@/types";
import { AppError } from "@/utils";
import fs from "fs";
import path from "path";
import {
  CertificatePayload,
  CertificateTemplateData,
  CompletionNoticeTemplateData,
  CustomerComplaintTemplateData,
  HearingNoticeTemplateData,
  IdCardTemplateData,
  InvoiceTemplateData,
  PaymentReceiptTemplateData,
  PunishmentTemplateData,
  StaffNotGuiltyTemplateData,
} from "./pdfTypes";

interface GeneratePDFResult {
  success: boolean;
  pdfBuffer?: Uint8Array;
  docType?: string;
  message?: string;
}

interface TokenPayload {
  type?: string;
  id?: string;
  staffId?: string;
  [key: string]: unknown;
}

interface PDFOptions {
  format?: any;
  width?: string | number;
  height?: string | number;
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
}
const productMap: Record<string, string> = {
  ips: "আইপিএস (IPS)",
  battery: "ব্যাটারি (Battery)",
  stabilizer: "ভোল্টেজ স্ট্যাবিলাইজার",
  others: "অন্যান্য",
};

async function convertToBase64(filePath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filePath);
  const extensionName = path.extname(filePath).toLowerCase();
  let mimeType = "image/jpeg";
  if (extensionName === ".png") mimeType = "image/png";
  else if (extensionName === ".svg") mimeType = "image/svg+xml";
  else if (extensionName === ".ttf") mimeType = "font/ttf";

  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

export default async function generatePDF({
  docType,
  id,
  token,
}: {
  docType: DocType;
  id: string;
  token?: string;
}): Promise<GeneratePDFResult> {
  try {
    // Dynamic import of react-dom/server to fix Vercel build issues in Server Actions
    const { renderToStaticMarkup } = await import("react-dom/server");

    let finalDocType: DocType = docType;
    let finalId: string = id;
    let payload: TokenPayload | null = null;

    if (token) {
      const { verifyAuthToken } = await import("@/actions/authActions");
      const tokenResult = await verifyAuthToken(token);
      if (!tokenResult.isValid) {
        throw new AppError("ডাউনলোড লিংকটির মেয়াদ শেষ বা অকার্যকর।");
      }
      payload = (tokenResult.payload as TokenPayload) ?? null;
      if (payload) {
        finalDocType = (payload.type as DocType) || docType;
        finalId = payload.id ?? payload.staffId ?? id;
      }
    }

    let html = "";
    let options: PDFOptions = {
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    };

    switch (finalDocType) {
      case "invoice": {
        const InvoiceTemplate = (
          await import("@/components/features/invoices/InvoiceTemplate")
        ).default;
        const { getInvoiceByNumber } = await import("@/actions/invoiceActions");
        const response = await getInvoiceByNumber(finalId);

        if (!response.success || !response.data) {
          throw new AppError("ইনভয়েসটি পাওয়া যায়নি।");
        }
        const invoice = response.data;

        // Debug: log notes value to Vercel function logs
        console.log(`[PDF Debug] Invoice ${invoice.invoiceNumber} — notes value:`, JSON.stringify(invoice.notes), `| type: ${typeof invoice.notes} | length: ${invoice.notes?.length ?? 'N/A'}`);

        const isDue = invoice.dueAmount > 0;
        const templatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          isDue ? "customer-invoice-due.png" : "customer-invoice-paid.png",
        );
        const backgroundBase64 = await convertToBase64(templatePath);

        const data: InvoiceTemplateData = {
          ...invoice,
          dueType: invoice.dueType as "due" | "installment",
          bgImage: backgroundBase64,
        };

        html = renderToStaticMarkup(<InvoiceTemplate data={data} />);
        break;
      }

      case "seller-invoice": {
        const InvoiceTemplate = (
          await import("@/components/features/invoices/InvoiceTemplate")
        ).default;
        const { getSellerPurchaseInvoice } = await import("@/actions/sellerActions");
        const response = await getSellerPurchaseInvoice(finalId);
        if (!response.success || !response.data) {
          throw new AppError("ইনভয়েসটি পাওয়া যায়নি।");
        }
        const invoice = response.data;
        const templatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          invoice.dueAmount > 0 ? "customer-invoice-due.png" : "customer-invoice-paid.png",
        );
        const backgroundBase64 = await convertToBase64(templatePath);
        const data: InvoiceTemplateData = { ...invoice, bgImage: backgroundBase64 };
        html = renderToStaticMarkup(<InvoiceTemplate data={data} />);
        break;
      }

      case "payment": {
        const PaymentReceiptTemplate = (
          await import("@/components/features/payments/PaymentReceiptTemplate")
        ).default;
        const { getPaymentByNumber } = await import("@/actions/paymentActions");
        const response = await getPaymentByNumber(finalId);
        if (!response.success || !response.data)
          throw new AppError("পেমেন্টটি পাওয়া যায়নি।");
        const payment = response.data;

        const templatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          "payment-receipt.jpg",
        );
        const backgroundBase64 = await convertToBase64(templatePath);

        const data: PaymentReceiptTemplateData = {
          bgImage: backgroundBase64,
          invoiceNumber: payment.invoiceNumber,
          date: payment.date,
          description: payment.description,
          staffId: payment.staffId,
          transactionId: payment.transactionId,
          paymentId: payment.paymentId,
          paymentMethod: payment.paymentMethod,
          senderWalletNumber: payment.senderWalletNumber,
          senderBankInfo: payment.senderBankInfo,
          receiverWalletNumber: payment.receiverWalletNumber,
          receiverBankInfo: payment.receiverBankInfo,
          amount: payment.amount,
          staff: {
            name: payment.staff?.name || "",
          },
          serviceId: payment.serviceId,
        };

        html = renderToStaticMarkup(<PaymentReceiptTemplate data={data} />);
        break;
      }

      case "id-card": {
        const IdCardTemplate = (
          await import("@/components/features/staff/IdCardTemplate")
        ).default;
        const { getStaffById } = await import("@/actions/staffActions");
        const response = await getStaffById(finalId);
        if (!response.success || !response.data)
          throw new AppError("স্টাফকে পাওয়া যায়নি।");
        const staff = response.data;

        const frontTemplatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          staff.role === "technician"
            ? "technician-card.jpg"
            : "electrician-card.jpg",
        );
        const backTemplatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          "id-card-back.jpg",
        );

        const frontBase64 = await convertToBase64(frontTemplatePath);
        const backBase64 = await convertToBase64(backTemplatePath);

        const { qrcode, barcode } = await import("@/lib/id-gen");
        const qrCodeData = await qrcode(staff.staffId);
        const barcodeData = await barcode(staff.staffId);

        const data: IdCardTemplateData = {
          ...staff,
          currentPoliceStation: staff.currentPoliceStation || "",
          currentPostOffice: staff.currentPostOffice || "",
          photoUrl: staff.photoUrl || "",
          frontBgImage: frontBase64,
          backBgImage: backBase64,
          issueDate: new Date(),
          qrcode: qrCodeData,
          barcode: barcodeData,
        };

        html = renderToStaticMarkup(<IdCardTemplate data={data} />);
        options = {
          format: "A4",
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        };
        break;
      }

      case "certificate": {
        const CertificateTemplate = (
          await import("@/components/features/staff/CertificateTemplate")
        ).default;

        let staffInfo: CertificatePayload | null =
          payload as CertificatePayload;

        if (
          !staffInfo ||
          finalDocType !== "certificate" ||
          !staffInfo.shopName
        ) {
          throw new AppError(
            "সার্টিফিকেট ডাউনলোড করার জন্য একটি বৈধ ডাউনলোড লিঙ্ক প্রয়োজন।",
          );
        }

        const templatePath = path.join(
          process.cwd(),
          "src",
          "assets",
          "images",
          "certificate-template.jpg",
        );
        const backgroundBase64 = await convertToBase64(templatePath);

        const fontsPath = path.join(process.cwd(), "src", "assets", "fonts");
        const font1 = await convertToBase64(
          path.join(fontsPath, "oldenglishtextmt.ttf"),
        );
        const font2 = await convertToBase64(
          path.join(fontsPath, "edwardianscriptitc.ttf"),
        );
        const font3 = await convertToBase64(
          path.join(fontsPath, "brockScript.ttf"),
        );

        const { qrcode } = await import("@/lib/id-gen");
        // Scanning opens the staff's public profile when the certificate belongs to a staff.
        const { getBaseUrl } = await import("@/utils");
        const certStaffId = (staffInfo as any).staffId as string | undefined;
        const qrCodeData = await qrcode(
          certStaffId
            ? `${getBaseUrl()}/team-members?staffId=${encodeURIComponent(certStaffId)}`
            : ((staffInfo as any).shopId as string),
          1,
        );

        const data: CertificateTemplateData = {
          ...(staffInfo as any as CertificateTemplateData),
          bgImage: backgroundBase64,
          role: (staffInfo as any).role || "technician",
          staffId: (staffInfo as any).staffId || finalId,
          memberNumber: (staffInfo as any).memberNumber || "N/A",
          shopName: (staffInfo as any).shopName || "N/A",
          shopId: (staffInfo as any).shopId || "N/A",
          ownerName:
            (staffInfo as any).ownerName || (staffInfo as any).name || "N/A",
          phone: (staffInfo as any).phone || "N/A",
          address:
            (staffInfo as any).address ||
            (staffInfo as any).currentStreetAddress ||
            "N/A",
          district:
            (staffInfo as any).district ||
            (staffInfo as any).currentDistrict ||
            "N/A",
          issueDate: new Date(),
          qrcode: qrCodeData,
          font1,
          font2,
          font3,
        };

        html = renderToStaticMarkup(<CertificateTemplate data={data} />);
        options = {
          format: "A4",
          landscape: true,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        };
        break;
      }

      case "complaint": {
        const PunishmentTemplate = (
          await import("@/components/features/complaints/PunishmentTemplate")
        ).default;
        const { getComplaintById } = await import("@/actions/complaintActions");
        const response = await getComplaintById(finalId);
        if (!response.success || !response.data)
          throw new AppError("অভিযোগটি পাওয়া যায়নি।");
        const c = response.data!;

        // Map data for PunishmentTemplate
        const complaintDate = new Date(c.createdAt).toLocaleDateString("bn-BD");
        const orderNumber = `SE/HR/${new Date().getFullYear()}/${c.complaintId.replace(/\D/g, "").slice(0, 5)}`;

        const documentSealBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "documentSeal.jpeg",
          ),
        ).catch(() => undefined);

        const atikurSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "atikurSign.jpeg",
          ),
        ).catch(() => undefined);
        const chairmanSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "chairmanSeal.jpeg",
          ),
        ).catch(() => undefined);

        // Determine punishment type from adminNote or status
        // Handle punishment type from dynamic DB fields or fallback to adminNote detection
        let punishment:
          | "warning"
          | "fine"
          | "suspension"
          | "demotion"
          | "termination" = (c.punishmentType as any) || "warning";

        if (!c.punishmentType && c.adminNote) {
          const note = c.adminNote.toLowerCase();
          if (note.includes("terminate") || note.includes("চাকরিচ্যুত")) {
            punishment = "termination";
          } else if (note.includes("suspend") || note.includes("বরখাস্ত")) {
            punishment = "suspension";
          } else if (note.includes("demote") || note.includes("অবনমন")) {
            punishment = "demotion";
          } else if (note.includes("fine") || note.includes("জরিমানা")) {
            punishment = "fine";
          }
        }

        const data: PunishmentTemplateData = {
          orderNumber,
          customerName: c.customer?.name || "",
          customerId: c.customer?.customerId || "",
          complaintDate,
          staffName: c.staff?.name || "",
          staffId: c.staffId || "",
          staffRole: c.staff?.role || "টেকনিশিয়ান",
          staffOffice: c.staff?.currentDistrict || "সিলেট বিভাগীয় কার্যালয়",
          trackingNumber: c.complaintId,
          subject: c.subject,
          description: c.description,
          punishment,
          punishmentStartDate: c.punishmentStartDate || undefined,
          punishmentEndDate: c.punishmentEndDate || undefined,
          fineAmount: c.punishmentFineAmount || undefined,
          newPosition: c.punishmentNewPosition || undefined,
          adminNote: c.adminNote || undefined,
          signatoryName: c.hearingOfficerName || "মোঃ সাহাব উদ্দিন মাহমুদ",
          signatoryTitle:
            c.hearingOfficerDesignation || "চেয়ারম্যান, এস ই ইলেকট্রনিক্স",
          companyName: "SE Electronics / SE Power IPS",
          documentSeal: documentSealBase64,
          atikurSign: atikurSignBase64,
          chairmanSign: chairmanSignBase64,
        };

        html = renderToStaticMarkup(<PunishmentTemplate data={data} />);
        break;
      }

      case "hearing-notice": {
        const HearingNoticeTemplate = (
          await import("@/components/features/complaints/HearingNoticeTemplate")
        ).default;
        const { getComplaintById } = await import("@/actions/complaintActions");
        const response = await getComplaintById(finalId);
        if (!response.success || !response.data)
          throw new AppError("অভিযোগটি পাওয়া যায়নি।");
        const c = response.data!;

        const logoBase64 = await convertToBase64(
          path.join(process.cwd(), "src", "assets", "images", "logo.jpg"),
        ).catch(() => undefined);

        const issueDateBn = new Date().toLocaleDateString("bn-BD");
        const receiptNum =
          c.complaintId.replace(/\D/g, "").slice(0, 5) || "14285";

        const documentSealBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "documentSeal.jpeg",
          ),
        ).catch(() => undefined);

        const atikurSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "atikurSign.jpeg",
          ),
        ).catch(() => undefined);

        const ajomSignBase64 = await convertToBase64(
          path.join(process.cwd(), "src", "assets", "images", "ajomSign.jpeg"),
        ).catch(() => undefined);

        const data: HearingNoticeTemplateData = {
          complaintId: c.complaintId,
          customer: {
            name: c.customer?.name || "",
            customerId: c.customer?.customerId || "",
            phone: c.customer?.phone || "",
            address: c.customer?.address || "",
          },
          staff: {
            name: c.staff?.name || "",
            phone: c.staff?.phone || "",
            role: c.staff?.role || "",
            staffId: c.staffId,
          },
          subject: c.subject,
          adminNote: c.adminNote || "",
          issueDateBn,
          receiptNum,
          logo: logoBase64,
          orderNum: receiptNum, // Use receiptNum as orderNum if mapping required
          documentSeal: documentSealBase64,
          atikurSign: atikurSignBase64,
          ajomSign: ajomSignBase64,
          officerName: c.hearingOfficerName || "",
          officerDesignation: c.hearingOfficerDesignation || "",
        };

        html = renderToStaticMarkup(<HearingNoticeTemplate data={data} />);
        break;
      }

      case "completion-notice": {
        const CompletionNoticeTemplate = (
          await import("@/components/features/complaints/CompletionNoticeTemplate")
        ).default;
        const { getComplaintById } = await import("@/actions/complaintActions");
        const response = await getComplaintById(finalId);
        if (!response.success || !response.data)
          throw new AppError("অভিযোগটি পাওয়া যায়নি।");
        const c = response.data!;

        const logoBase64 = await convertToBase64(
          path.join(process.cwd(), "src", "assets", "images", "logo.jpg"),
        ).catch(() => undefined);

        const resolvedDateBn = new Date().toLocaleDateString("bn-BD");
        const receiptNo =
          c.complaintId.replace(/\D/g, "").slice(0, 5) || "14285";

        const documentSealBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "documentSeal.jpeg",
          ),
        ).catch(() => undefined);

        const chairmanSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "chairmanSeal.jpeg",
          ),
        ).catch(() => undefined);
        const data: CompletionNoticeTemplateData = {
          complaintId: c.complaintId,
          customer: {
            name: c.customer?.name || "",
            customerId: c.customer?.customerId || "",
            phone: c.customer?.phone || "",
            address: c.customer?.address || "",
          },
          staff: {
            name: c.staff?.name || "",
            phone: c.staff?.phone || "",
            role: c.staff?.role || "",
            staffId: c.staffId,
          },
          subject: c.subject,
          adminNote: c.customerNote || c.adminNote || "",
          punishmentType:
            (await import("@/constants/complaintData")).PUNISHMENT_TYPES.find(
              (p) => p.id === c.punishmentType,
            )?.label ||
            c.punishmentType ||
            "",
          punishmentStartDate: c.punishmentStartDate || "",
          punishmentEndDate: c.punishmentEndDate || "",
          resolvedDateBn,
          receiptNo,
          logo: logoBase64,
          documentSeal: documentSealBase64,
          chairmanSeal: chairmanSignBase64,
          officerName: c.hearingOfficerName || "",
          officerDesignation: c.hearingOfficerDesignation || "",
        };

        html = renderToStaticMarkup(<CompletionNoticeTemplate data={data} />);
        break;
      }
      case "staff-not-guilty": {
        const StaffNotGuiltyTemplate = (
          await import("@/components/features/complaints/StaffNotGuiltyTemplate")
        ).default;
        const { getComplaintById } = await import("@/actions/complaintActions");
        const response = await getComplaintById(finalId);
        if (!response.success || !response.data)
          throw new AppError("অভিযোগটি পাওয়া যায়নি।");
        const c = response.data!;

        const logoBase64 = await convertToBase64(
          path.join(process.cwd(), "src", "assets", "images", "logo.jpg"),
        ).catch(() => undefined);

        const resolvedDateBn = new Date().toLocaleDateString("bn-BD");
        const receiptNo =
          c.complaintId.replace(/\D/g, "").slice(0, 5) || "14285";

        const documentSealBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "documentSeal.jpeg",
          ),
        ).catch(() => undefined);
        const atikurSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "atikurSign.jpeg",
          ),
        ).catch(() => undefined);

        const chairmanSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "chairmanSeal.jpeg",
          ),
        ).catch(() => undefined);

        const data: StaffNotGuiltyTemplateData = {
          complaintId: c.complaintId,
          customer: {
            name: c.customer?.name || "",
            customerId: c.customer?.customerId || "",
            phone: c.customer?.phone || "",
            address: c.customer?.address || "",
          },
          staff: {
            name: c.staff?.name || "",
            phone: c.staff?.phone || "",
            role: c.staff?.role || "",
            staffId: c.staffId,
          },
          subject: c.subject,
          adminNote: c.adminNote || "",
          resolvedDateBn,
          receiptNo,
          logo: logoBase64,
          documentSeal: documentSealBase64,
          atikurSign: atikurSignBase64,
          chairmanSign: chairmanSignBase64,
          officerName: c.hearingOfficerName || "",
          officerDesignation: c.hearingOfficerDesignation || "",
        };

        html = renderToStaticMarkup(<StaffNotGuiltyTemplate data={data} />);
        break;
      }

      case "complaint_customer": {
        const CustomerComplaintTemplate = (
          await import("@/components/features/complaints/CustomerComplaintTemplate")
        ).default;
        const { getComplaintById } = await import("@/actions/complaintActions");
        const response = await getComplaintById(finalId);
        if (!response.success || !response.data)
          throw new AppError("অভিযোগটি পাওয়া যায়নি।");
        const c = response.data!;

        const logoBase64 = await convertToBase64(
          path.join(process.cwd(), "src", "assets", "images", "logo.jpg"),
        ).catch(() => undefined);

        const documentSealBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "documentSeal.jpeg",
          ),
        ).catch(() => undefined);

        const atikurSignBase64 = await convertToBase64(
          path.join(
            process.cwd(),
            "src",
            "assets",
            "images",
            "atikurSign.jpeg",
          ),
        ).catch(() => undefined);

        const data: CustomerComplaintTemplateData = {
          complaintId: c.complaintId,
          serviceId: c.serviceId || "",
          customer: {
            name: c.customer?.name || "",
            customerId: c.customer?.customerId || "",
            phone: c.customer?.phone || "",
            address: c.customer?.address || "",
          },
          staff: {
            name: c.staff?.name || "",
            staffId: c.staffId || "",
          },
          subject: c.subject,
          description: c.description,
          createdAt: c.createdAt,
          logo: logoBase64,
          documentSeal: documentSealBase64,
          atikurSign: atikurSignBase64,
        };

        html = renderToStaticMarkup(<CustomerComplaintTemplate data={data} />);
        options = {
          format: "A4",
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        };
        break;
      }

      default:
        throw new AppError("অকার্যকর ডকুমেন্ট টাইপ।");
    }

    const puppeteer = (await import("puppeteer-core")).default;
    const chromium = (await import("@sparticuz/chromium")).default;

    let browser;
    // Chromium setup for Vercel/Production
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      browser = await puppeteer.launch({
        args: (chromium as any).args,
        defaultViewport: (chromium as any).defaultViewport,
        executablePath: await (chromium as any).executablePath(),
        headless: (chromium as any).headless,
      });
    } else {
      // Local development Chrome paths
      const chromePaths = [
        path.join(
          process.env.LOCALAPPDATA || "",
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
      ];
      let executablePath = null;
      for (const p of chromePaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
      if (!executablePath)
        throw new AppError("Chrome browser was not found locally.");
      browser = await puppeteer.launch({
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Tiro+Bangla&display=swap" rel="stylesheet">
                <style>
                    @page { margin: 0; }
                    body { margin: 0; padding: 0; font-family: 'SolaimanLipi', 'Tiro Bangla', sans-serif; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                </style>
            </head>
            <body class="bg-gray-100">
                ${html}
            </body>
            </html>
        `;

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    await page.evaluateHandle(() => document.fonts.ready);
    const pdf = await page.pdf(options);
    await browser.close();

    // Return Uint8Array as expected by DocDownloadPage
    return {
      success: true,
      pdfBuffer: new Uint8Array(pdf),
      docType: finalDocType,
    };
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return {
      success: false,
      message: error.message || "পিডিএফ তৈরি করতে সমস্যা হয়েছে।",
    };
  }
}
