import { ClipboardList, History, Home, Package, User } from "lucide-react";

/** Bottom nav for the customer "My All Products" pages (same chrome as the service pages). */
export const CUSTOMER_PRODUCT_NAV = [
  { label: "হোম", icon: Home, href: "/customer/profile" },
  { label: "প্রোডাক্ট", icon: Package, href: "/customer/products" },
  { label: "সার্ভিস রিকোয়েস্ট", icon: ClipboardList, href: "/get-service" },
  { label: "হিস্টোরি", icon: History, href: "/customer/services" },
  { label: "প্রোফাইল", icon: User, href: "/customer/profile" },
];
