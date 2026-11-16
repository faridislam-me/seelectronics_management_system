import { verifySession } from "@/lib";
import {
  getLotteryCards,
  getLotteryEntries,
  getLotteryWinners,
} from "@/actions/lotteryActions";
import { redirect } from "next/navigation";
import LotteryManageClient from "./LotteryManageClient";

export const dynamic = "force-dynamic";

export default async function LotteryManagePage() {
  const session = await verifySession(false, "admin");
  if (!session) redirect("/login");

  const [cardsRes, entriesRes, winnersRes] = await Promise.all([
    getLotteryCards(),
    getLotteryEntries(),
    getLotteryWinners(),
  ]);

  return (
    <LotteryManageClient
      initialCards={cardsRes.success ? cardsRes.data : []}
      initialEntries={entriesRes.success ? entriesRes.data : []}
      initialWinners={winnersRes.success ? winnersRes.data : []}
    />
  );
}
