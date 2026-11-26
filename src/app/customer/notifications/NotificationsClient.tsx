"use client";

import { getCustomerNotifications, markCustomerNotificationAsRead } from "@/actions/customerActions";
import { getCustomerNotices, markNoticeAsRead } from "@/actions/noticeActions";
import NotificationFeed, { FeedItem } from "@/components/features/notifications/NotificationFeed";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { Suspense, use, useMemo, useState } from "react";

type FeedData = [
  Awaited<ReturnType<typeof getCustomerNotifications>>,
  Awaited<ReturnType<typeof getCustomerNotices>>,
];

// Known notification types get a friendly Bangla title; everything else falls
// back to a prettified version of the raw type key.
const TITLE_MAP: Record<string, string> = {
  complaint_customer_absent: "অভিযোগ নোটিশ",
  guarantor_notice: "জামিনদার নোটিশ",
  recharge_accepted: "রিচার্জ গৃহীত",
  recharge_delivered: "রিচার্জ সফল",
  recharge_refund: "রিচার্জ ব্যর্থ — টাকা ফেরত",
};
const kindOf = (type: string): FeedItem["kind"] => {
  const t = (type || "").toLowerCase();
  if (t.includes("complaint") || t.includes("guarantor")) return "notice";
  if (t.includes("recharge") || t.includes("payment") || t.includes("referral") || t.includes("bonus") || t.includes("invoice")) return "payment";
  if (t.includes("approv") || t.includes("complete") || t.includes("service")) return "approval";
  return "system";
};
const titleOf = (type: string) =>
  TITLE_MAP[type] || (type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");

function Feed({ data }: { data: Promise<FeedData> }) {
  const [a, n] = use(data);
  // Ids opened in this visit, so they show as read straight away.
  const [read, setRead] = useState<Record<string, true>>({});

  const items = useMemo(() => {
    const markLocal = (id: string) => setRead((p) => ({ ...p, [id]: true }));
    const list: FeedItem[] = [];
    if (a.success && a.data) {
      for (const x of a.data as any[]) {
        list.push({ id: x.id, isRead: x.isRead || !!read[x.id], createdAt: x.createdAt, title: titleOf(x.type), message: x.message, link: x.link, kind: kindOf(x.type),
          onOpen: async () => { markLocal(x.id); await markCustomerNotificationAsRead(x.id); } });
      }
    }
    if (n.success && n.data) {
      for (const x of n.data as any[]) {
        list.push({ id: x.id, isRead: x.isRead || !!read[x.id], createdAt: x.createdAt, title: x.notice?.title || "New Notice", message: x.notice?.content || "", kind: "notice", priority: x.notice?.priority,
          onOpen: async () => { markLocal(x.id); await markNoticeAsRead(x.id); } });
      }
    }
    list.sort((p, q) => new Date(q.createdAt).getTime() - new Date(p.createdAt).getTime());
    return list;
  }, [a, n, read]);

  return <NotificationFeed items={items} isLoading={false} />;
}

export default function NotificationsClient({ data }: { data: Promise<FeedData> }) {
  return (
    <CustomerLayout>
      <Suspense fallback={<NotificationFeed items={[]} isLoading />}>
        <Feed data={data} />
      </Suspense>
    </CustomerLayout>
  );
}
