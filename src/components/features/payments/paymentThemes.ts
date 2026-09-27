/** Brand logos and light "watermark" themes per payout method, shared by staff payment screens. */
export const methodLogos: Record<string, string> = { bkash: "/bkash.png", nagad: "/nagad.png", rocket: "/rocket.png", bank: "/bank.png" };

export type MethodTheme = { card: string; border: string; chip: string; label: string; mark: string };

export const methodThemes: Record<string, MethodTheme> = {
  bkash: { card: "bg-[linear-gradient(100deg,#ffe9f1_0%,#fff5f9_100%)]", border: "border-[#ffd6e5]", chip: "bg-[#ffd6e5] text-[#c2185b]", label: "bKash Wallet", mark: "text-[#e2136e]" },
  nagad: { card: "bg-[linear-gradient(100deg,#fff0e6_0%,#fff8f2_100%)]", border: "border-[#ffd9bf]", chip: "bg-[#ffe0cc] text-[#d9480f]", label: "Nagad Wallet", mark: "text-[#f15a22]" },
  rocket: { card: "bg-[linear-gradient(100deg,#f5e9fb_0%,#fbf5fe_100%)]", border: "border-[#e6cdf3]", chip: "bg-[#ecd6f7] text-[#8c3494]", label: "Rocket Wallet", mark: "text-[#8c3494]" },
  bank: { card: "bg-[linear-gradient(100deg,#e6f0ff_0%,#f3f8ff_100%)]", border: "border-[#cfe0fb]", chip: "bg-[#d6e7ff] text-[#1b6fd6]", label: "Bank Account", mark: "text-[#1f7cf0]" },
  cash: { card: "bg-[linear-gradient(100deg,#e9f9ef_0%,#f4fcf7_100%)]", border: "border-[#bfe8cd]", chip: "bg-[#d4f3e0] text-[#178a42]", label: "Cash", mark: "text-[#1a9c4b]" },
  virtual: { card: "bg-[linear-gradient(100deg,#0a2f70_0%,#1259c9_100%)]", border: "border-[#0b3d91]", chip: "bg-white/20 text-white", label: "SE Virtual Account", mark: "text-white" },
  /** Light list-card variant of the virtual account (credited payments). */
  virtualLight: { card: "bg-[linear-gradient(100deg,#e3edff_0%,#f3f7ff_100%)]", border: "border-[#c5d8fa]", chip: "bg-[#0b3d91] text-white", label: "SE Virtual Account", mark: "text-[#0b3d91]" },
};

/** Theme key for a payment: credited payments go to the SE virtual account, others by payout method. */
export function methodKey(status: string | null | undefined, method: string | null | undefined, light = false) {
  if (status === "credited") return light ? "virtualLight" : "virtual";
  const m = (method || "").toLowerCase();
  return methodThemes[m] ? m : "bank";
}
