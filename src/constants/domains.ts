/**
 * Brand domain for links sent by SMS. In production a link never points at a
 * *.vercel.app host: it uses <portal>.<BRAND_DOMAIN> unless an env var
 * explicitly supplies another custom domain. Local dev keeps its own URLs.
 *
 * The domain is read from NEXT_PUBLIC_BRAND_DOMAIN so it can be swapped from the
 * Vercel dashboard WITHOUT a code change — BD operators periodically ban a
 * domain from appearing in SMS, and this lets a safe replacement go live by just
 * updating the env var (and pointing the new domain's <portal> subdomains at the
 * app). Falls back to the current domain when the env var is unset.
 */
export const BRAND_DOMAIN =
  process.env.NEXT_PUBLIC_BRAND_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
  "seelectronicsbd.com";

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
export const SUPPLIER_SUBDOMAIN_LIVE = true;
