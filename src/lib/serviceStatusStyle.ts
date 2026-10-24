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

export const PRODUCT_IMAGES: Record<string, string> = {
  ips: "/products/ips.jpg",
  battery: "/products/battery.jpg",
  stabilizer: "/products/stabilizer.jpg",
  others: "/products/others.jpg",
};

export const productImage = (type: string) => PRODUCT_IMAGES[type] ?? PRODUCT_IMAGES.others;
