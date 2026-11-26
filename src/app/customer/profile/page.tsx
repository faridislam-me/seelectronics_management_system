import { verifyCustomerSession, customerLogout } from "@/actions/customerActions";
import { getCustomerProfileStats } from "@/actions/customerActions";
import { getActiveBanners } from "@/actions/bannerActions";
import CustomerDashboardClient from "@/components/features/customers/CustomerDashboardClient";
import Link from "next/link";

export default async function CustomerProfilePage() {
  const session = await verifyCustomerSession();

  if (!session.isAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 selection:bg-blue-200">
        <div className="max-w-md w-full bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden group">
          <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 backdrop-blur-sm">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Login Required</h2>
              <p className="text-slate-400 text-sm font-medium">Please sign in to access your customer dashboard and VIP services.</p>
            </div>
          </div>

          <div className="p-8 space-y-4">
            <form action={customerLogout} className="w-full">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-4 px-8 rounded-md shadow-lg shadow-blue-600/20 hover:shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
              >
                Sign In to Dashboard
              </button>
            </form>
            <p className="text-center text-gray-400 text-xs font-medium">
              Don't have an ID? Contact our support
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userId = session.userId as string;
  // Independent reads: fetch together instead of one after the other.
  const [statsRes, bannersRes] = await Promise.all([
    getCustomerProfileStats(userId),
    getActiveBanners("customer"),
  ]);
  const stats = statsRes.success ? statsRes.data : null;
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || "017XXXXXXXX";

  const activeBanners = bannersRes.banners?.map((b: any) => ({ img: b.url })) || [];

  if (!session.customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Customer profile not found.</div>
      </div>
    );
  }

  return (
    <CustomerDashboardClient
      customer={session.customer as any}
      stats={stats as any}
      adminPhone="09649355555"
      banners={activeBanners}
    />
  );
}
