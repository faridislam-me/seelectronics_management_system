import { getCustomerById } from "@/actions";
import { getMyServices, getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/utils";
import { verifyStaffSession } from "@/actions/staffActions";

export default async function StaffCustomerProfilePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const { customerId } = await params;
  const [customerRes, statsRes] = await Promise.all([
    getCustomerById(customerId),
    getStaffProfileStats(session.userId as string),
  ]);

  if (!customerRes.success || !customerRes.data) {
    notFound();
  }

  const customer = customerRes.data;
  const stats = statsRes.success ? statsRes.data : null;

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-2">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/staff/services"
            className="p-2 rounded-md bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-brand transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Customer Profile
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              ID: {customer.customerId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl" />

              <div className="relative z-10 text-center pb-6 border-b border-gray-50">
                <div className="size-24 rounded-[2rem] bg-gray-50 border-2 border-gray-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <User size={40} className="text-gray-300" />
                </div>
                <h2 className="text-xl font-black text-gray-900">
                  {customer.name}
                </h2>
                <span className="inline-block px-3 py-1 bg-brand/5 text-brand text-[10px] font-black uppercase tracking-widest rounded-md mt-2">
                  Registered Customer
                </span>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-500">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      Phone Number
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {customer.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      Installation Address
                    </p>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed">
                      {customer.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-md bg-amber-50 flex items-center justify-center text-amber-500">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      Joined Since
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
              <Link
                href={`tel:${customer.phone}`}
                className="w-full flex items-center justify-center gap-3 bg-brand text-white py-4 rounded-md font-black text-sm shadow-lg shadow-brand/20 active:scale-95"
              >
                <Phone size={18} />
                Call Customer
              </Link>
              <Link
                href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-white py-4 rounded-md font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                WhatsApp
              </Link>
            </div>
          </div>

          {/* Service History / Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[400px]">
              <h3 className="text-base font-black text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-brand" />
                Service History
              </h3>

              {customer.invoice ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-md border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Primary Invoice
                      </p>
                      <p className="text-sm font-black text-gray-900">
                        {customer.invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-tight">
                        {customer.invoice.paymentType} • Total: ৳
                        {customer.invoice.total}
                      </p>
                    </div>
                    <Link
                      href={`/staff/payment/${customer.invoice.invoiceNumber}`}
                      className="px-5 py-2.5 rounded-md bg-white text-gray-900 text-sm font-black shadow-sm border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                    >
                      Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-4">
                    <Briefcase size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-400">
                    No service history found for this customer.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">
                  Account Status
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 rounded-md bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                      Status
                    </p>
                    <p className="text-sm font-black text-emerald-700">
                      ACTIVE
                    </p>
                  </div>
                  <div className="flex-1 p-4 rounded-md bg-brand/5 border border-brand/10">
                    <p className="text-[10px] font-black text-brand uppercase mb-1">
                      Balance
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      ৳{customer.invoice?.dueAmount || 0} DUE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
