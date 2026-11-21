/**
 * Installment (কিস্তি) profile lock.
 *
 * An admin "ব্যান" sets `installment_plans.status = 'banned'`. A customer with
 * any banned plan has a locked installment profile: the customer installment
 * pages show a locked notice instead of their content, and payment claims and
 * new applications are rejected server-side until an admin re-activates it.
 */
export const isInstallmentPlanLocked = (status: string | null | undefined) => status === "banned";

export const INSTALLMENT_LOCKED_MESSAGE =
  "আপনার কিস্তি প্রোফাইল লক করা হয়েছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।";
