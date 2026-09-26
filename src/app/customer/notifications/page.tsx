"use client";

import { getCustomerNotifications, markCustomerNotificationAsRead } from "@/actions/customerActions";
import { getCustomerNotices, markNoticeAsRead } from "@/actions/noticeActions";
import NotificationFeed, { FeedItem } from "@/components/features/notifications/NotificationFeed";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { useEffect, useState } from "react";

const kindOf = (type: string): FeedItem["kind"] => {
  const t = (type || "").toLowerCase();
  if (t.includes("payment") || t.includes("referral") || t.includes("bonus") || t.includes("invoice")) return "payment";
  if (t.includes("approv") || t.includes("complete") || t.includes("service")) return "approval";
  return "system";
};
const titleOf = (type: string) => (type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");

export default function CustomerNotificationsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, n] = await Promise.all([getCustomerNotifications(), getCustomerNotices()]);
      const list: FeedItem[] = [];
      if (a.success && a.data) {
        for (const x of a.data as any[]) {
          list.push({ id: x.id, isRead: x.isRead, createdAt: x.createdAt, title: titleOf(x.type), message: x.message, link: x.link, kind: kindOf(x.type),
            onOpen: async () => { await markCustomerNotificationAsRead(x.id); setItems((p) => p.map((i) => (i.id === x.id ? { ...i, isRead: true } : i))); } });
        }
      }
      if (n.success && n.data) {
        for (const x of n.data as any[]) {
          list.push({ id: x.id, isRead: x.isRead, createdAt: x.createdAt, title: x.notice?.title || "New Notice", message: x.notice?.content || "", kind: "notice", priority: x.notice?.priority,
            onOpen: async () => { await markNoticeAsRead(x.id); setItems((p) => p.map((i) => (i.id === x.id ? { ...i, isRead: true } : i))); } });
        }
      }
      list.sort((p, q) => new Date(q.createdAt).getTime() - new Date(p.createdAt).getTime());
      setItems(list); setIsLoading(false);
    })();
  }, []);

  return (
    <CustomerLayout>
      <NotificationFeed items={items} isLoading={isLoading} />
    </CustomerLayout>
  );
}
