import { UrlConfig } from "@/types";
import { randomBytes } from "crypto";

export class AppError extends Error {
  digest: string;
  constructor(message: string = "কিছু ভুল হয়েছে!") {
    super(message);
    this.name = "AppError";
    this.digest = message;
  }
}

export function generateRandomId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return "SE" + result;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-4);
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();

  return `${timestamp}${randomPart}`;
}

export function generateVipCardNumber(): string {
  // Generate a 16-digit number
  let result = "";
  for (let i = 0; i < 4; i++) {
    const segment = Math.floor(1000 + Math.random() * 9000).toString();
    result += segment;
  }
  return result;
}

export function getBaseUrl() {
  return process.env.APP_URL
    ? `https://${process.env.APP_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "https://seelectronicspro.vercel.app";
}

export const generateUrl = <T extends UrlConfig["type"]>(
  type: T,
  params: Extract<UrlConfig, { type: T }>["params"],
) => {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    throw new Error("Base URL is not defined");
  }

  const p = params as any;

  switch (type) {
    case "registration":
      if (!p.token) {
        throw new Error("token is required");
      }
      return `${baseUrl}/register?token=${p.token}`;

    case "seller-registration":
      if (!p.token) {
        throw new Error("token is required");
      }
      return `${baseUrl}/seller/register?token=${p.token}`;

    case "seller-login":
      return `${baseUrl}/seller/login`;

    case "application-tracking":
      if (!p.trackingId) {
        throw new Error("trackingId is required");
      }
      return `${baseUrl}/application-track?trackingId=${p.trackingId}`;

    case "service-tracking":
      if (!p.trackingId) {
        throw new Error("trackingId is required");
      }
      return `${baseUrl}/service-track?trackingId=${p.trackingId}`;

    case "service-report":
      if (!p.serviceId) {
        throw new Error("serviceId is required");
      }
      return `${baseUrl}/service-report?serviceId=${p.serviceId}`;

    case "invoice-download":
      if (!p.token) {
        throw new Error("token is required");
      }
      return `${baseUrl}/pdf/download?token=${p.token}`;

    case "id-card-download":
      if (!p.token) {
        throw new Error("token is required");
      }
      return `${baseUrl}/pdf/download?token=${p.token}`;

    case "certificate-download":
      if (!p.token) {
        throw new Error("token is required");
      }
      return `${baseUrl}/staff/certificate?token=${p.token}`;

    case "feedback":
      if (!p.serviceId) {
        throw new Error("serviceId is required");
      }
      return `${baseUrl}/service-feedback?serviceId=${p.serviceId}`;

    case "customer-login":
      return `${baseUrl}/customer/login`;

    default: {
      throw new Error("Invalid type");
    }
  }
};

export const formatDate = (
  timestamp: Date | string | number,
  includeTime = false,
) => {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const datePart = new Intl.DateTimeFormat("en-US", dateOptions).format(date);

  if (!includeTime) {
    return datePart;
  }

  const timePart = new Intl.DateTimeFormat("en-US", timeOptions).format(date);
  return `${datePart} - ${timePart}`;
};

export function isWarrantyValid(
  warrantyStartDate: Date,
  warrantyDurationMonths: number,
): boolean {
  const currentDate = new Date();
  const warrantyEndDate = new Date(warrantyStartDate);
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyDurationMonths);
  return currentDate <= warrantyEndDate;
}

export function calculateWarrantyEndDate(
  startDate: Date,
  durationMonths: number,
): Date {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + durationMonths);
  return date;
}

export function renderText(text: string, data?: any) {
  return text.replace(/{([^}]+)}/g, (match, key) => data[key] || "");
}

export function isNumber(str: string | number) {
  return !isNaN(str as number) && !Number.isNaN(str);
}

export function parseUserAgent(ua = "") {
  ua = ua.toLowerCase();

  // --- Detect Browser ---
  let browser = "Unknown";
  if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opr") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("msie") || ua.includes("trident"))
    browser = "Internet Explorer";

  // --- Detect Device Type ---
  let device = "Desktop";
  if (/mobile|iphone|ipod|android/i.test(ua)) device = "Mobile";
  else if (/ipad|tablet/i.test(ua)) device = "Tablet";

  // --- Detect OS (optional but handy) ---
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/ios|iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, device, os };
}

export function validateFormData(formData: FormData) {
  const entries = Object.fromEntries(formData.entries());

  for (const [key, value] of Object.entries(entries)) {
    // Handle file inputs
    if (value instanceof File) {
      // If it's a file input but no file was selected
      if (!value.name) return { valid: false, field: key };
      continue;
    }

    // Handle string inputs (text, textarea, select)
    const strVal = value.toString().trim();
    if (strVal === "") return { valid: false, field: key };
  }

  return { valid: true };
}
