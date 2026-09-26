"use client";

import { getStaffNotices, markNoticeAsRead } from "@/actions/noticeActions";
import { getStaffNotifications, markStaffNotificationAsRead } from "@/actions/staffActions";
import { NoticeRecipientType, StaffNotificationType } from "@/types";
import { useEffect, useState } from "react";
import NotificationFeed, { FeedItem } from "./NotificationFeed";

const kindOf = (type: string): FeedItem["kind"] => {
  const t = (type || "").toLowerCase();
  if (t.includes("balance") || t.includes("payment") || t.includes("credit")) return "payment";
  if (t.includes("approv") || t.includes("complete") || t.includes("status")) return "approval";
  return "system";
};
const titleOf = (type: string) => {
  const map: Record<string, string> = { balance_added: "Balance Added", payment_request: "Payment Request", payment_completed: "Payment Completed", account_status: "Account Status", certificate: "Certificate", id_card: "ID Card", staff_application: "Application" };
  return map[type] || (type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Notification");
};

export default function StaffNotificationList() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, n] = await Promise.all([getStaffNotifications(), getStaffNotices()]);
      const list: FeedItem[] = [];
      if (a.success && a.data) {
        for (const x of a.data as StaffNotificationType[]) {
          list.push({ id: x.id, isRead: x.isRead, createdAt: x.createdAt, title: titleOf(x.type), message: x.message, link: x.link, kind: kindOf(x.type),
            onOpen: async () => { await markStaffNotificationAsRead(x.id); setItems((p) => p.map((i) => (i.id === x.id ? { ...i, isRead: true } : i))); } });
        }
      }
      if (n.success && n.data) {
        for (const x of n.data as NoticeRecipientType[]) {
          list.push({ id: x.id, isRead: x.isRead, createdAt: x.createdAt, title: x.notice?.title || "New Notice", message: x.notice?.content || "", kind: "notice", priority: x.notice?.priority,
            onOpen: async () => { await markNoticeAsRead(x.id); setItems((p) => p.map((i) => (i.id === x.id ? { ...i, isRead: true } : i))); } });
        }
      }
      list.sort((p, q) => new Date(q.createdAt).getTime() - new Date(p.createdAt).getTime());
      setItems(list); setIsLoading(false);
    })();
  }, []);

  return <NotificationFeed items={items} isLoading={isLoading} />;
}
