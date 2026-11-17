import { getPublicCampaign } from "@/actions/lotteryActions";
import LotteryForm from "./LotteryForm";

export const metadata = {
  title: "SE Electronics লটারি",
  description: "স্ক্র্যাচ কার্ডের লটারি নাম্বার দিয়ে লটারিতে অংশ নিন",
};

export const dynamic = "force-dynamic";

export default async function LotteryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // The scratch-card QR carries the random lottery number. Accept a few common
  // param names so the printed QR link can be any of them.
  const raw = sp.n ?? sp.code ?? sp.card ?? sp.lottery ?? sp.number;
  const prefillCode = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim().toUpperCase() ?? "";

  const res = await getPublicCampaign();
  const campaign = res.success ? res.data : null;

  return <LotteryForm campaign={campaign} prefillCode={prefillCode} />;
}
