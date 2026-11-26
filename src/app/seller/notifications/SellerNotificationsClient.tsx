"use client";

import { getSellerNotifications, markSellerNotificationAsRead } from "@/actions/sellerActions";
import NotificationFeed, { FeedItem } from "@/components/features/notifications/NotificationFeed";
import { SellerLayout } from "@/components/layout/SellerLayout";
import { Suspense, use, useEffect, useMemo, useState } from "react";

type FeedData = Awaited<ReturnType<typeof getSellerNotifications>>;

// Tab + tag for every notification type the seller portal sends. Without this
// a rejected payment or an unpaid service charge showed a green "Success" /
// "Approved" tag, because the tag was derived from the tab alone.
const TYPE_META: Record<string, { kind: FeedItem["kind"]; tag?: FeedItem["tag"] }> = {
  purchase_added: { kind: "payment", tag: { label: "New", tone: "info" } },
  purchase_updated: { kind: "payment", tag: { label: "Updated", tone: "info" } },
  payment_approved: { kind: "payment", tag: { label: "Approved", tone: "success" } },
  payment_rejected: { kind: "payment", tag: { label: "Rejected", tone: "danger" } },
  service_charge: { kind: "payment", tag: { label: "Due", tone: "danger" } },
  service_charge_paid: { kind: "payment", tag: { label: "Paid", tone: "success" } },
  service_charge_waived: { kind: "payment", tag: { label: "Waived", tone: "success" } },
  service_approved: { kind: "approval" },
  customer_added: { kind: "approval", tag: { label: "New", tone: "info" } },
  certificate: { kind: "system", tag: { label: "Award", tone: "success" } },
};

const metaOf = (type: string): { kind: FeedItem["kind"]; tag?: FeedItem["tag"] } => {
  if (TYPE_META[type]) return TYPE_META[type];
  const t = (type || "").toLowerCase();
  if (t.includes("reject") || t.includes("cancel")) return { kind: "system", tag: { label: "Rejected", tone: "danger" } };
  if (t.includes("purchase") || t.includes("payment") || t.includes("due") || t.includes("charge")) return { kind: "payment", tag: { label: "Info", tone: "info" } };
  if (t.includes("approv") || t.includes("complete")) return { kind: "approval" };
  return { kind: "system" };
};
const titleOf = (type: string) => (type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");

function Feed({ data, onUnread }: { data: Promise<FeedData>; onUnread: (n: number) => void }) {
  const res = use(data);
  // Ids opened in this visit, so they show as read straight away.
  const [read, setRead] = useState<Record<string, true>>({});

  const items = useMemo(() => {
    const list: FeedItem[] = [];
    if (res.success && res.data) {
      for (const x of res.data) {
        const meta = metaOf(x.type);
        list.push({
          id: x.id,
          isRead: x.isRead || !!read[x.id],
          createdAt: x.createdAt,
          title: titleOf(x.type),
          message: x.message,
          // The default link points back at this very page; no "details" button for it.
          link: x.link && x.link !== "/seller/notifications" ? x.link : undefined,
          kind: meta.kind,
          tag: meta.tag,
          // Not awaited: the details open at once, the row is saved in the background.
          onOpen: () => {
            setRead((p) => ({ ...p, [x.id]: true }));
            markSellerNotificationAsRead(x.id).catch(() => {});
          },
        });
      }
    }
    return list;
  }, [res, read]);

  // Keep the header bell in step with what this page shows.
  const unread = items.filter((i) => !i.isRead).length;
  useEffect(() => { onUnread(unread); }, [unread, onUnread]);

  return (
    <>
      {!res.success && (
        <p className="mx-2 mt-2 rounded-md bg-[#ffe9ec] border border-[#f7c3ca] px-3 py-2 text-[13px] font-bold text-[#c81f38]">
          নোটিফিকেশন লোড করা যায়নি। পেজটি আবার খুলুন।
        </p>
      )}
      <NotificationFeed items={items} isLoading={false} />
    </>
  );
}

export default function SellerNotificationsClient({ data }: { data: Promise<FeedData> }) {
  // null until the list has arrived (the bell shows no number meanwhile).
  const [unread, setUnread] = useState<number | null>(null);
  return (
    <SellerLayout unreadCount={unread}>
      <Suspense fallback={<NotificationFeed items={[]} isLoading />}>
        <Feed data={data} onUnread={setUnread} />
      </Suspense>
    </SellerLayout>
  );
}
