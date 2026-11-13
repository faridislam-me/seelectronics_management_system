"use client";

import {
  getComplaintById,
  updateComplaintStatus,
} from "@/actions/complaintActions";
import {
  COMPLAINT_OFFICERS,
  PUNISHMENT_TYPES,
} from "@/constants/complaintData";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  Shield,
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ComplaintDetailsPage() {
  const { complaintId } = useParams() as { complaintId: string };
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [adminNote, setAdminNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [punishment, setPunishment] = useState({
    type: "",
    startDate: "",
    endDate: "",
    fineAmount: "",
    newPosition: "",
  });

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);



  async function loadComplaint() {
    setLoading(true);
    const res = await getComplaintById(complaintId);
    if (res.success && res.data) {
      const data = res.data;
      setComplaint(data);
      setAdminNote(data.adminNote || "");
      setCustomerNote(data.customerNote || "");
      if (data.hearingOfficerName) {
        setSelectedOfficer({
          name: data.hearingOfficerName,
          phone: data.hearingOfficerPhone,
          designation: data.hearingOfficerDesignation,
        });
      }
      if (data.punishmentType) {
        setPunishment({
          type: data.punishmentType,
          startDate: data.punishmentStartDate || "",
          endDate: data.punishmentEndDate || "",
          fineAmount: data.punishmentFineAmount || "",
          newPosition: data.punishmentNewPosition || "",
        });
      }
    } else {
      toast.error(res.message || "Complaint not found");
      router.push("/complaints");
    }
    setLoading(false);
  }

  async function handleStatusUpdate(newStatus: string) {
    if (newStatus === "hearing" && (!selectedOfficer || !adminNote.trim())) {
      toast.error("Please select an officer and provide hearing details");
      return;
    }
    if (newStatus === "completed" && (!punishment.type || !adminNote.trim() || !customerNote.trim())) {
      toast.error("Please select a punishment and provide both staff and customer resolution notes");
      return;
    }

    setIsUpdating(true);
    const res = await updateComplaintStatus(complaintId, newStatus as any, adminNote, customerNote, {
      hearingOfficer: selectedOfficer,
      punishment: punishment.type ? punishment : undefined,
    });

    if (res.success) {
      toast.success(res.message);
      loadComplaint();
    } else {
      toast.error(res.message);
    }
    setIsUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!complaint) return null;

  const getStatusDisplay = (status: string) => {
    const statuses = {
      under_trial: { label: "Under Trial", color: "text-red-600 bg-red-50 border-red-100" },
      processing: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-100" },
      hearing: { label: "Hearing Issued", color: "text-amber-600 bg-amber-50 border-amber-100" },
      completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      customer_absent: { label: "গ্রাহক উপস্থিত ছিলেন না", color: "text-orange-600 bg-orange-50 border-orange-100" },
    };
    return statuses[status as keyof typeof statuses] || { label: status, color: "bg-gray-100" };
  };

  const statusInfo = getStatusDisplay(complaint.status);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/complaints"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">Complaint Details</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-500 font-mono text-sm">{complaint.complaintId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/pdf/download?type=complaint_customer&id=${complaint.complaintId}`}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-black uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            target="_blank"
          >
            <Download size={14} /> Complaint Copy
          </Link>

          {(complaint.status === "hearing" || complaint.status === "completed") && (
            <Link
              href={`/pdf/download?type=hearing-notice&id=${complaint.complaintId}`}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-black uppercase tracking-wider text-amber-700 hover:bg-amber-100 transition-all shadow-sm"
              target="_blank"
            >
              <Download size={14} /> Hearing Notice
            </Link>
          )}

          {complaint.status === "completed" && (
            <>
              {complaint.punishmentType === "not_guilty" ? (
                <Link
                  href={`/pdf/download?type=staff-not-guilty&id=${complaint.complaintId}`}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md"
                  target="_blank"
                >
                  <Download size={14} /> Resolution Notice
                </Link>
              ) : (
                <>
                  <Link
                    href={`/pdf/download?type=complaint&id=${complaint.complaintId}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] font-black uppercase tracking-wider text-red-700 hover:bg-red-100 transition-all shadow-sm"
                    target="_blank"
                  >
                    <Download size={14} /> Punishment Order
                  </Link>
                  <Link
                    href={`/pdf/download?type=completion-notice&id=${complaint.complaintId}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md"
                    target="_blank"
                  >
                    <Download size={14} /> Completion Notice
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="text-red-500" size={20} />
                Complaint Issue
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Subject</label>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{complaint.subject}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Description</label>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
                </div>
                {complaint.serviceId && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Linked Service</p>
                      <p className="font-bold text-blue-900">{complaint.serviceId}</p>
                    </div>
                    <Link href={`/service-track?trackingId=${complaint.serviceId}`} className="p-2 bg-white rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                      <ExternalLink size={18} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-gray-50/30 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Customer Information
                </h4>
                <div>
                  <p className="text-base font-bold text-gray-900">{complaint.customer.name}</p>
                  <p className="text-sm font-medium text-gray-500">{complaint.customer.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">{complaint.customer.address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Accused Staff
                </h4>
                <div>
                  <p className="text-base font-bold text-red-600">@{complaint.staff.name}</p>
                  <p className="text-sm font-medium text-gray-500">{complaint.staff.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">Staff ID: {complaint.staffId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action History / Notes */}
          {complaint.adminNote && (
            <div className={`p-8 rounded-3xl border shadow-sm ${complaint.status === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${complaint.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {complaint.status === 'completed' ? 'Final Resolution Note' : 'Hearing Detail / Admin Note'}
              </h4>
              <p className={`text-sm font-bold leading-relaxed ${complaint.status === 'completed' ? 'text-emerald-900' : 'text-amber-900'}`}>
                {complaint.adminNote}
              </p>
            </div>
          )}

          {/* Punishment Card if Completed */}
          {complaint.status === 'completed' && complaint.punishmentType && (
            <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-[0_10px_30px_rgba(239,68,68,0.05)]">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 font-mono">
                <AlertTriangle size={14} /> Disciplinary Action (শাস্তিমূলক আদেশ)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-black text-red-400 uppercase mb-1">Type</p>
                  <p className="text-lg font-black text-red-700 capitalize">{complaint.punishmentType.replace('_', ' ')}</p>
                  {complaint.punishmentType === 'not_guilty' && (
                    <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest">নির্দোষ সাব্যস্ত (Exonerated)</p>
                  )}
                  {complaint.punishmentFineAmount && (
                    <p className="text-sm font-bold text-red-600 mt-1">জরিমানা: {complaint.punishmentFineAmount} টাকা</p>
                  )}
                  {complaint.punishmentNewPosition && (
                    <p className="text-sm font-bold text-red-600 mt-1">নতুন পদবি: {complaint.punishmentNewPosition}</p>
                  )}
                </div>
                {complaint.punishmentStartDate && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Timeline</p>
                    <p className="font-bold text-gray-700">
                      {complaint.punishmentStartDate} {complaint.punishmentEndDate ? `- ${complaint.punishmentEndDate}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Management Actions */}
        <div className="space-y-8">
          <div className="bg-black text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-black mb-6">Manage Status</h3>

            <div className="space-y-4">
              {/* Mark as Processing */}
              {complaint.status === "under_trial" && (
                <button
                  onClick={() => handleStatusUpdate("processing")}
                  disabled={isUpdating}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                >
                  <FileText size={18} className="group-hover:scale-110 transition-transform" />
                  Mark as Processing
                </button>
              )}

              {/* Hearing Section */}
              {complaint.status === "processing" && (
                <div className="space-y-6">
                  <div className="space-y-4 border-b border-white/10 pb-6">
                    <label className="text-sm font-black uppercase text-white/50 tracking-widest block">Select Investigation Officer</label>
                    <select
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const officer = COMPLAINT_OFFICERS.find(o => o.phone === e.target.value);
                        setSelectedOfficer(officer);
                      }}
                      value={selectedOfficer?.phone || ""}
                    >
                      <option value="" disabled className="bg-black">তদন্তকারী কর্মকর্তা নির্বাচন করুন (Select Officer)</option>
                      {COMPLAINT_OFFICERS.map((officer) => (
                        <option 
                          key={officer.phone} 
                          value={officer.phone}
                          className="bg-black"
                        >
                          {officer.name} ({officer.phone}) - {officer.designation}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-black uppercase text-white/50 tracking-widest block">Hearing Details (Date/Venue)</label>
                      <select
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold outline-none focus:ring-2 focus:ring-amber-500"
                        onChange={(e) => setAdminNote(e.target.value)}
                        value=""
                      >
                        <option value="" disabled className="bg-black text-gray-500">শুনানীর বিবরণ নির্বাচন করুন (Quick Select)</option>
                        <option value={`আগামী ২৫/০৪/২০২৬ ইং রোজ সোমবার দুপুর ২.৩০ টায় আপনাকে আমাদের সিলেট সদর এয়ারপোর্ট রোড বাদাম বাগিচা অফিসে সরাসরি/ভিডিও কলে শুনানী কার্যক্রম করা হবে।`} className="bg-black">অফিস শুনানী (Office Hearing)</option>
                        <option value={`আগামী কাল সকাল ১০.৩০ টায় ভিডিও কলের মাধ্যমে শুনানী কার্যক্রম সম্পন্ন করা হবে।`} className="bg-black">অনলাইন শুনানী (Online Hearing)</option>
                        <option value={`জরুরি শুনানী: আগামী ২০/০৪/২০২৬ ইং তারিখ দুপুর ১২:০০ টায় প্রধান কার্যালয়ে উপস্থিত থাকার জন্য অনুরোধ করা হলো।`} className="bg-black">জরুরি শুনানী (Urgent)</option>
                      </select>
                    </div>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Hearing scheduled for 14th April at Office Hall..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base outline-none focus:ring-2 focus:ring-amber-500 h-32 placeholder:text-white/20 transition-all font-medium"
                    />
                  </div>

                  <button
                    onClick={() => handleStatusUpdate("hearing")}
                    disabled={isUpdating}
                    className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <Gavel size={20} />
                    Issue Hearing Notice
                  </button>
                </div>
              )}

              {/* Customer-absent (ex-parte) outcome — only AFTER the hearing is
                  called: you cannot close one-sidedly before the hearing. */}
              {complaint.status === "hearing" && (
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleStatusUpdate("customer_absent")}
                    disabled={isUpdating}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <UserX size={18} className="group-hover:scale-110 transition-transform" />
                    গ্রাহক উপস্থিত ছিলেন না (একতরফা নিষ্পত্তি)
                  </button>
                  <p className="text-white/40 text-xs text-center">শুনানিতে গ্রাহক না এলে একতরফাভাবে নিষ্পত্তি ও নথিভুক্ত হবে।</p>
                </div>
              )}

              {/* Completion Section */}
              {complaint.status === "hearing" && (
                <div className="space-y-6">
                  <div className="space-y-4 border-b border-white/10 pb-6">
                    <label className="text-sm font-black uppercase text-white/50 tracking-widest block">Staff Punishment Type</label>
                    <select
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold outline-none focus:ring-2 focus:ring-red-500"
                      onChange={(e) => setPunishment({ ...punishment, type: e.target.value })}
                      value={punishment.type}
                    >
                      <option value="" disabled className="bg-black">শাস্তির প্রকার নির্বাচন করুন (Select Punishment)</option>
                      {PUNISHMENT_TYPES.map((p) => (
                        <option key={p.id} value={p.id} className="bg-black">
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(punishment.type === 'suspension' || punishment.type === 'termination' || punishment.type === 'fine' || punishment.type === 'demotion') && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                      {(punishment.type === 'suspension' || punishment.type === 'termination') && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/50 uppercase">Start Date</label>
                          <input
                            type="text"
                            placeholder="DD/MM/YY"
                            value={punishment.startDate}
                            onChange={(e) => setPunishment({ ...punishment, startDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-white"
                          />
                        </div>
                      )}
                      {punishment.type === 'suspension' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/50 uppercase">End Date</label>
                          <input
                            type="text"
                            placeholder="DD/MM/YY"
                            value={punishment.endDate}
                            onChange={(e) => setPunishment({ ...punishment, endDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-white"
                          />
                        </div>
                      )}
                      {punishment.type === 'fine' && (
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-white/50 uppercase">Fine Amount (টাকা)</label>
                          <input
                            type="text"
                            placeholder="e.g. 2500"
                            value={punishment.fineAmount}
                            onChange={(e) => setPunishment({ ...punishment, fineAmount: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-white"
                          />
                        </div>
                      )}
                      {punishment.type === 'demotion' && (
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-white/50 uppercase">New Position/Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Associate Technician"
                            value={punishment.newPosition}
                            onChange={(e) => setPunishment({ ...punishment, newPosition: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-white"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Staff Resolution Statement */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-black uppercase text-white/50 tracking-widest block">Staff Resolution Statement (Staff Notice)</label>
                      <select
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setAdminNote(e.target.value)}
                        value=""
                      >
                        <option value="" disabled className="bg-black text-gray-500">স্টাফ স্টেটমেন্ট নির্বাচন করুন (Select Statement)</option>
                        <option value={`আমরা বিষয়টি অত্যন্ত গুরুত্বের সাথে যাচাই করেছি। তদন্তে দেখা গেছে যে স্টাফের বিরুদ্ধে আনীত অভিযোগটি প্রমাণিত হয়নি। সংশ্লিষ্ট ঘটনার জন্য স্টাফ সরাসরি দায়ী নন।`} className="bg-black">নির্দোষ ও দায়মুক্ত (Not Guilty)</option>
                        <option value={`তদন্তে আপনার অবহেলার প্রমাণ পাওয়া গেছে। সংশ্লিষ্ট ঘটনার প্রেক্ষিতে আপনাকে দাপ্তরিক বিধি অনুযায়ী দণ্ডিত করা হয়েছে। ভবিষ্যতে সতর্ক থাকার পরামর্শ প্রদান করা হলো।`} className="bg-black">দোষী সাব্যস্ত - শাস্তিপ্রদান (Guilty - Punished)</option>
                        <option value={`নিযুক্ত তদন্ত কর্মকর্তার সুপারিশক্রমে আপনাকে সাময়িকভাবে রহিত করা হয়েছে। দাপ্তরিক কার্যক্রম থেকে বিরত থাকতে নির্দেশ প্রদান করা হলো।`} className="bg-black">সাময়িক বরখাস্ত (Suspended)</option>
                        <option value={`প্রতিষ্ঠানের ভাবমূর্তি ক্ষুণ্ণ করার দায়ে আপনার নিয়োগ অদ্যই বাতিল করা হলো। আপনাকে চাকুরি থেকে অব্যহতি প্রদান করা হয়েছে।`} className="bg-black">চাকরিচ্যুতি (Terminated)</option>
                      </select>
                    </div>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Staff final decision statement..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base outline-none focus:ring-2 focus:ring-emerald-500 h-28 placeholder:text-white/20 transition-all font-medium text-white"
                    />
                  </div>

                  {/* Customer Resolution Statement */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-black uppercase text-white/50 tracking-widest block">Customer Completion Statement (Customer Copy)</label>
                      <select
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        onChange={(e) => setCustomerNote(e.target.value)}
                        value=""
                      >
                        <option value="" disabled className="bg-black text-gray-500">কাস্টমার স্টেটমেন্ট নির্বাচন করুন (Select Statement)</option>
                        <option value={`আমরা বিষয়টি গুরুত্বের সাথে যাচাই করেছি। তদন্তে স্টাফের কোনো অবহেলা প্রমাণিত হয়নি। আপনার সহযোগিতার জন্য ধন্যবাদ।`} className="bg-black">অভিযোগ প্রমাণিত হয়নি (Staff Exonerated)</option>
                        <option value={`তদন্তে আপনার অভিযোগের সত্যতা প্রমাণিত হয়েছে এবং সংশ্লিষ্ট টেকনিশিয়ান দোষী সাব্যস্ত হয়েছেন। আমরা তার বিরুদ্ধে যথাযথ শাস্তিমূলক ব্যবস্থা গ্রহণ করেছি।`} className="bg-black">অভিযোগ প্রমাণিত (Proven)</option>
                        <option value={`আপনার অভিযোগের প্রেক্ষিতে সংশ্লিষ্ট টেকনিশিয়ানকে সতর্ক করা হয়েছে। আশা করি ভবিষ্যতে এমন ঘটনার পুনরাবৃত্তি হবে না।`} className="bg-black">পদক্ষেপ গ্রহণ করা হয়েছে (Action Taken)</option>
                        <option value={`অনাকাঙ্ক্ষিত ঘটনার জন্য আমরা ক্ষমা চাচ্ছি। টেকনিশিয়ানকে চাকুরি থেকে অব্যাহতি দেওয়া হয়েছে এবং আপনার সমস্যার সমাধান নিশ্চিত করা হয়েছে।`} className="bg-black">চুড়ান্ত পদক্ষেপ (Final Action)</option>
                      </select>
                    </div>
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Customer resolution explanation..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-base outline-none focus:ring-2 focus:ring-emerald-500 h-28 placeholder:text-white/20 transition-all font-medium text-white"
                    />
                  </div>

                  <button
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={isUpdating}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={20} />
                    Finalize & Resolve
                  </button>
                </div>
              )}

              {complaint.status === "completed" && (
                <div className="text-center py-6 space-y-4">
                  <div className="size-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-black text-white">Issue Resolved</h4>
                  <p className="text-white/40 text-sm">This complaint has been officially closed and the decision has been sent to the customer.</p>
                </div>
              )}

              {complaint.status === "customer_absent" && (
                <div className="text-center py-6 space-y-4">
                  <div className="size-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserX size={32} />
                  </div>
                  <h4 className="text-lg font-black text-white">গ্রাহক উপস্থিত ছিলেন না</h4>
                  <p className="text-white/40 text-sm">যাচাইয়ের সময় গ্রাহককে পাওয়া যায়নি। গ্রাহককে SMS ও ভয়েস কলে জানানো হয়েছে।</p>
                  <button
                    onClick={() => handleStatusUpdate("processing")}
                    disabled={isUpdating}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    পুনরায় প্রক্রিয়াকরণ করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metadata</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium tracking-tight">Created At</span>
                <span className="font-bold text-gray-900">{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium tracking-tight">Last Updated</span>
                <span className="font-bold text-gray-900">{new Date(complaint.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
