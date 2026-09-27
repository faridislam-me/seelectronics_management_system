import { getCustomerSubscriptionById } from "@/actions/subscriptionActions";
import { CustomerLayout } from "@/components/layout";
import { 
    Zap, 
    Calendar, 
    Clock, 
    MapPin, 
    CreditCard, 
    ShieldCheck, 
    Activity,
    Info,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Smartphone,
    Building2,
    Tag,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PlanDetailsPageProps {
    params: Promise<{
        planId: string;
    }>;
}

export default async function SubscriptionPlanDetailsPage({ params }: PlanDetailsPageProps) {
    const { planId } = await params;
    const { success, data: sub } = await getCustomerSubscriptionById(planId);

    if (!success || !sub) {
        notFound();
    }

    const isActive = sub.isActive && sub.status === 'active';
    const progress = (sub.servicesCompleted / sub.subscriptionDuration) * 100;

    return (
        <CustomerLayout>
            <div className="min-h-screen bg-[#fafafa] p-4 sm:p-6 pb-2 selection:bg-blue-200">
                {/* Top Navigation */}
                <div className="max-w-4xl mx-auto mb-6">
                    <Link 
                        href="/customer/plans/subscription" 
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-brand font-black text-xs uppercase tracking-widest transition-colors mb-4"
                    >
                        <ChevronLeft size={16} />
                        Back to Plans
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isActive ? 'bg-brand/10' : 'bg-slate-100'}`}>
                                <Zap className={isActive ? 'text-brand' : 'text-slate-400'} size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 capitalize">
                                    {sub.subscriptionType.replace(/_/g, ' ')}
                                </h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    Subscription ID: {sub.subscriptionId}
                                </p>
                            </div>
                        </div>
                        <div className={`self-start sm:self-center px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 border ${
                            isActive 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : sub.status === 'expired' 
                                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            {sub.status}
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Status Card (Usage) */}
                        <div className="bg-white border border-slate-200 rounded-md p-6 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Activity size={14} className="text-brand" />
                                Service Usage Progress
                            </h2>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="space-y-1">
                                    <div className="text-4xl font-black text-slate-900">
                                        {sub.servicesCompleted} <span className="text-lg text-slate-400 font-bold">/ {sub.subscriptionDuration}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">Total Services Completed</p>
                                </div>
                                <div className="relative size-24 shrink-0">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3"></circle>
                                        <circle 
                                            cx="18" cy="18" r="16" fill="none" 
                                            className="stroke-brand transition-all duration-1000 ease-out" 
                                            strokeWidth="3" 
                                            strokeDasharray="100" 
                                            strokeDashoffset={100 - progress}
                                            strokeLinecap="round"
                                        ></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-brand">
                                        {Math.round(progress)}%
                                    </div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-brand h-full rounded-full transition-all duration-1000" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Subscription Info Grid */}
                        <div className="bg-white border border-slate-200 rounded-md p-6">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Info size={14} className="text-brand" />
                                Technical Specifications
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Battery Type</label>
                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-brand/60" />
                                        {sub.batteryType}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IPS Brand</label>
                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <Building2 size={16} className="text-brand/60" />
                                        {sub.ipsBrand || 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Power Rating</label>
                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <Zap size={16} className="text-brand/60" />
                                        {sub.ipsPowerRating || 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Duration</label>
                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <Calendar size={16} className="text-brand/60" />
                                        {sub.subscriptionDuration} Months
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="bg-white border border-slate-200 rounded-md p-6">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MapPin size={14} className="text-brand" />
                                Registered Address
                            </h2>
                            <div className="flex gap-4">
                                <div className="p-3 bg-slate-50 rounded-md shrink-0">
                                    <Building2 size={20} className="text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-800">{sub.streetAddress}</p>
                                    <p className="text-xs font-medium text-slate-500">
                                        {sub.policeStation && `${sub.policeStation}, `}
                                        {sub.postOffice && `${sub.postOffice}, `}
                                        {sub.district}
                                    </p>
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Smartphone size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{sub.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Billing & Extra */}
                    <div className="space-y-6">
                        {/* Billing Card */}
                        <div className="bg-slate-900 rounded-md p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mb-16 pointer-events-none"></div>
                            
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <CreditCard size={14} />
                                Billing Information
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                                    <span>Base Price</span>
                                    <span>৳{sub.basePrice.toLocaleString()}</span>
                                </div>
                                {!!sub.surchargeAmount && (
                                    <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                                        <span>Surcharge</span>
                                        <span>+৳{sub.surchargeAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {!!sub.discountAmount && (
                                    <div className="flex justify-between items-center text-sm font-medium text-emerald-400">
                                        <span>Discount</span>
                                        <span>-৳{sub.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-3xl font-black">৳{sub.totalFee.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-brand/20 text-brand text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border border-brand/30">
                                        Paid
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Details */}
                        <div className="bg-white border border-slate-200 rounded-md p-6">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Receipt size={14} className="text-brand" />
                                Payment Details
                            </h2>
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pt-0.5">Method</span>
                                    <span className="text-slate-800 font-black uppercase tracking-tight">{sub.paymentType}</span>
                                </div>
                                {sub.transactionId && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pt-0.5">TXID</span>
                                        <span className="text-slate-800 font-black truncate max-w-[120px]">{sub.transactionId}</span>
                                    </div>
                                )}
                                {sub.walletNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pt-0.5">Wallet</span>
                                        <span className="text-slate-800 font-black">{sub.walletNumber}</span>
                                    </div>
                                )}
                                {sub.bankInfo && (
                                    <div className="pt-2 space-y-2 border-t border-slate-50">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pt-0.5">Bank</span>
                                            <span className="text-slate-800 font-black">{(sub.bankInfo as any).bankName}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white border border-slate-200 rounded-md p-6">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock size={14} className="text-brand" />
                                Timeline
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="bg-slate-100 p-2 rounded-md h-fit">
                                        <CheckCircle2 size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-0.5">Subscribed On</p>
                                        <p className="text-xs font-black text-slate-800">{new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-slate-100 p-2 rounded-md h-fit">
                                        <Tag size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-0.5">Last Activity</p>
                                        <p className="text-xs font-black text-slate-800">{new Date(sub.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
