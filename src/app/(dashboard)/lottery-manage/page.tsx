import { verifySession } from "@/lib";
import {
  getCampaigns,
  getLotteryCards,
  getLotteryEntries,
  getLotteryWinners,
} from "@/actions/lotteryActions";
import { getBaseUrl } from "@/utils";
import { brandUrl } from "@/constants/domains";
import { redirect } from "next/navigation";
import LotteryManageClient from "./LotteryManageClient";

export const dynamic = "force-dynamic";

export default async function LotteryManagePage() {
  const session = await verifySession(false, "admin");
  if (!session) redirect("/login");

  // The lottery QR opens the public /lottery submission page. It is customer-
  // facing, so prefer the customer brand domain (matches how customer SMS links
  // are built); fall back to the app base URL in dev where it is undefined.
  const publicBaseUrl = brandUrl("customer", process.env.CUSTOMER_APP_URL) ?? getBaseUrl();

  const [campaignsRes, cardsRes, entriesRes, winnersRes] = await Promise.all([
    getCampaigns(),
    getLotteryCards(),
    getLotteryEntries(),
    getLotteryWinners(),
  ]);

  return (
    <LotteryManageClient
      initialCampaigns={campaignsRes.success ? campaignsRes.data : []}
      initialCards={cardsRes.success ? cardsRes.data : []}
      initialEntries={entriesRes.success ? entriesRes.data : []}
      initialWinners={winnersRes.success ? winnersRes.data : []}
      baseUrl={publicBaseUrl}
    />
  );
}
