import { getAdminStats } from "@/actions/adminActions";
import {
  CheckCircle,
  Clock,
  CreditCard,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";

export default async function AdminStats() {
  const statsResponse = await getAdminStats();

  if (!statsResponse.success || !statsResponse.data) {
    return <div className="text-red-500">Could not load stats</div>;
  }

  const stats = statsResponse.data;

  const cards = [
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: Wrench,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Staff Members",
      value: stats.totalStaff,
      icon: CheckCircle,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Revenue",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Active Subs",
      value: stats.activeSubscriptions,
      icon: ShoppingBag,
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  // Icon + label on top, value on its own full-width row so long amounts
  // (Total Revenue) never get cut on narrow desktop columns.
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-2.5 sm:gap-3 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-md p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col gap-2 min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`${card.color} size-8 sm:size-9 rounded-md flex items-center justify-center shrink-0`}>
              <card.icon size={18} />
            </span>
            <p className="text-[12.5px] sm:text-sm font-bold text-gray-600 leading-tight">{card.title}</p>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tabular-nums leading-none break-all">
            {card.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
