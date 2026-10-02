/**
 * Brand domains for links sent by SMS. In production, a link never points at a
 * *.vercel.app host: it uses <portal>.seelectronicsbd.com unless an env var
 * explicitly supplies another custom domain. Local dev keeps its own URLs.
 */
export const BRAND_DOMAIN = "seelectronicsbd.com";

export type Portal = "admin" | "staff" | "customer" | "seller" | "supplier";

const isVercelHost = (u?: string) => !u || /\.vercel\.app/i.test(u);

/** Base URL (no trailing slash) for a portal, or undefined outside production without an env URL. */
export function brandUrl(portal: Portal, envUrl?: string): string | undefined {
  if (envUrl && !isVercelHost(envUrl)) return envUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return `https://${portal}.${BRAND_DOMAIN}`;
  return envUrl ? envUrl.replace(/\/$/, "") : undefined;
}

/**
 * Flip to true once supplier.seelectronicsbd.com resolves and is added to the
 * Vercel project (Cloudflare CNAME + Vercel Domains). Until then supplier links
 * keep using the admin domain so no SMS link breaks.
 */
export const SUPPLIER_SUBDOMAIN_LIVE = false;
