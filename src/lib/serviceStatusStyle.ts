/** Badge colours / labels for a service request status (shared by customer-portal pages). */
export const SERVICE_STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  completed: { cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]", label: "COMPLETED" },
  canceled: { cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]", label: "CANCELED" },
  pending: { cls: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]", label: "PENDING" },
  in_progress: { cls: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]", label: "PROCESSING" },
  staff_departed: { cls: "bg-[#f3e9ff] text-[#7a3fd0] border-[#e2cffb]", label: "ON THE WAY" },
  staff_arrived: { cls: "bg-[#ecebff] text-[#4b3fd0] border-[#d6d3fb]", label: "ARRIVED" },
  appointment_retry: { cls: "bg-[#fff0e6] text-[#d9480f] border-[#ffd9bf]", label: "RESCHEDULING" },
  service_center: { cls: "bg-[#e3f8fb] text-[#0e7c8c] border-[#bdeaf1]", label: "SERVICE CENTER" },
  service_center_received: { cls: "bg-[#e3f8fb] text-[#0e7c8c] border-[#bdeaf1]", label: "SERVICE CENTER" },
};

export const serviceStatusStyle = (status: string) =>
  SERVICE_STATUS_STYLE[status] ?? { cls: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]", label: "PROCESSING" };

// Per-category product photos (transparent PNGs — product only, no background).
// Covers every installment product category so the কিস্তিপণ্য list shows the
// real product image instead of a generic box. `others` keeps the generic photo.
export const PRODUCT_IMAGES: Record<string, string> = {
  fridge: "/products/fridge.png",
  ac: "/products/ac.png",
  tv: "/products/tv.png",
  oven: "/products/oven.png",
  washing_machine: "/products/washing_machine.png",
  mobile: "/products/mobile.png",
  ips: "/products/ips.png",
  battery: "/products/battery.png",
  ips_package: "/products/ips_package.png",
  stabilizer: "/products/stabilizer.png",
  blender: "/products/blender.png",
  others: "/products/others.jpg",
};

export const productImage = (type: string) => PRODUCT_IMAGES[type] ?? PRODUCT_IMAGES.others;
