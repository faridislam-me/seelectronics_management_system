export const SUPPLIER_PRODUCT_TYPES = ["ips", "battery", "stabilizer", "others"] as const;

export const SUPPLIER_PRODUCT_LABEL: Record<string, string> = {
  ips: "আইপিএস",
  battery: "ব্যাটারি",
  stabilizer: "স্ট্যাবিলাইজার",
  others: "অন্যান্য",
};

export const supplierProductLabel = (t: string | null | undefined) => (t ? SUPPLIER_PRODUCT_LABEL[t] ?? t : null);
