import "server-only";

import { db } from "@/db/drizzle";
import { guarantorNotices, installmentPlans } from "@/db/schema";
import { GUARANTOR_NOTICE_TOKEN_RE } from "@/lib/guarantorNotice";
import { eq } from "drizzle-orm";

/**
 * Loads a guarantor notice (plus its plan) by the random public token. Used by
 * the public notice page and the PDF generator — the token is the only key, so
 * a sequential id / plan code can never be used to enumerate notices.
 */
export async function getGuarantorNoticeByToken(token: string) {
  if (!GUARANTOR_NOTICE_TOKEN_RE.test(token || "")) return null;

  const notice = await db.query.guarantorNotices.findFirst({
    where: eq(guarantorNotices.token, token),
  });
  if (!notice) return null;

  const plan = await db.query.installmentPlans.findFirst({
    where: eq(installmentPlans.id, notice.planId),
  });

  return { notice, plan: plan ?? null };
}

export type GuarantorNoticeWithPlan = NonNullable<
  Awaited<ReturnType<typeof getGuarantorNoticeByToken>>
>;
