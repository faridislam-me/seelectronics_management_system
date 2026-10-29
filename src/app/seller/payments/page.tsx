import { getMySellerPaymentRequests } from "@/actions";
import { SellerLayout } from "@/components/layout";
import { BlueChip } from "@/components/ui";
import { DataTable, EmptyRow, Td, Th } from "@/components/ui/DataTable";
import { formatDate } from "@/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "green" | "amber" | "red" }> = {
  requested: { label: "অপেক্ষমাণ", tone: "amber" },
  approved: { label: "অনুমোদিত", tone: "green" },
  rejected: { label: "বাতিল", tone: "red" },
};

export default async function SellerPaymentsPage() {
  const res = await getMySellerPaymentRequests();
  if (!res.success) redirect("/seller/login");
  const rows = res.data;

  return (
    <SellerLayout>
      <div className="flex flex-col gap-2.5 p-2">
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-[#16213a]">আমার পেমেন্ট</span>
          <span className="text-xs font-semibold text-[#6b7690]">বকেয়া পরিশোধের জমা দেওয়া পেমেন্ট ও তার অবস্থা</span>
        </div>

        <DataTable>
          <thead>
            <tr>
              <Th>তারিখ</Th><Th>কী বাবদ</Th><Th right>পরিমাণ</Th><Th>মাধ্যম</Th><Th>সেন্ডার / TrxID</Th><Th>স্ট্যাটাস</Th><Th>রশিদ</Th><Th>নোট</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={8} text="এখনো কোনো পেমেন্ট জমা দেননি" />}
            {rows.map((r, i) => {
              const st = STATUS[r.status] ?? { label: r.status, tone: "amber" as const };
              return (
                <tr key={r.id} className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
                  <Td>{formatDate(r.createdAt)}</Td>
                  <Td nowrap={false} className="min-w-[150px]">
                    {r.targetType === "purchase" ? "মালের বাকি" : "সার্ভিস চার্জ"}
                    <span className="block text-[11px] text-[#6b7690]">{r.targetLabel}{r.targetRef2 ? ` · ${r.targetRef2}` : ""}</span>
                  </Td>
                  <Td right strong>৳{Math.round(r.amount).toLocaleString()}</Td>
                  <Td className="uppercase">{r.paymentMethod}</Td>
                  <Td nowrap={false} className="min-w-[120px] text-[11.5px] text-[#5b6784]">
                    {r.senderNumber || "—"}{r.transactionId ? <span className="block">TrxID: {r.transactionId}</span> : null}
                  </Td>
                  <Td><BlueChip tone={st.tone}>{st.label}</BlueChip></Td>
                  <Td>
                    {r.status === "approved" ? (
                      <a
                        href={`/pdf/download?type=seller-payment&id=${r.requestId}`}
                        target="_blank"
                        className="inline-flex items-center h-7 px-2.5 rounded-md bg-[#1f7cf0] text-white text-[11px] font-extrabold"
                      >
                        ডাউনলোড
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#9aa4b8]">—</span>
                    )}
                  </Td>
                  <Td nowrap={false} className="min-w-[120px] text-[11.5px] text-[#5b6784]">{r.adminNote || r.note || "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>
    </SellerLayout>
  );
}
