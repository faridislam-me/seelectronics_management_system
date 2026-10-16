"use client";

import { getSellerNotifications, markSellerNotificationAsRead } from "@/actions/sellerActions";
import NotificationFeed, { FeedItem } from "@/components/features/notifications/NotificationFeed";
import { SellerLayout } from "@/components/layout/SellerLayout";
import { useEffect, useState } from "react";

const kindOf = (type: string): FeedItem["kind"] => {
  const t = (type || "").toLowerCase();
  if (t.includes("purchase") || t.includes("payment") || t.includes("due")) return "payment";
  if (t.includes("approv") || t.includes("complete") || t.includes("service") || t.includes("customer")) return "approval";
  return "system";
};
const titleOf = (type: string) => (type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");

export default function SellerNotificationsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getSellerNotifications();
      const list: FeedItem[] = [];
      if (res.success && res.data) {
        for (const x of res.data) {
          list.push({
            id: x.id, isRead: x.isRead, createdAt: x.createdAt as any, title: titleOf(x.type), message: x.message, link: x.link ?? undefined, kind: kindOf(x.type),
            onOpen: async () => { await markSellerNotificationAsRead(x.id); setItems((p) => p.map((i) => (i.id === x.id ? { ...i, isRead: true } : i))); },
          });
        }
      }
      setItems(list); setIsLoading(false);
    })();
  }, []);

  return (
    <SellerLayout>
      <NotificationFeed items={items} isLoading={isLoading} />
    </SellerLayout>
  );
}
