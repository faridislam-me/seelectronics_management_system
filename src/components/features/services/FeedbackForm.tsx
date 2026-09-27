"use client";

import { createFeedback } from "@/actions";
import { StarRating } from "@/components/ui";
import {
  contactDetails,
  customFeedbackQuestion,
  feedbackQuestions,
} from "@/constants";
import clsx from "clsx";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { Banknote, BadgeCheck, Calendar, ClipboardCheck, Clock, FileText, Headset, Mail, MapPin, MessageSquareText, Package, Phone, Send, ShieldCheck, Star, ThumbsUp, User, UserCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type FeedbackService = {
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerAddressDistrict?: string | null;
  productType?: string | null;
  productModel?: string | null;
  type?: string | null;
  status?: string | null;
  staffName?: string | null;
  createdAt?: Date | string | null;
};

export default function FeedbackForm({
  serviceId,
  customerId,
  service,
}: {
  serviceId: string;
  customerId?: string;
  service?: FeedbackService | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [answers, setAnswers] = useState(feedbackQuestions.map(() => ""));
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [customAnswer, setCustomAnswer] = useState<{
    answer: string;
    amount?: number;
  }>({
    answer: "",
  });
  const handleAnswer = (index: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const hasEmptyAnswer =
      answers.some((ans) => ans === "") ||
      customAnswer.answer === "" ||
      (customAnswer.answer === "হ্যাঁ" && !customAnswer.amount);

    if (hasEmptyAnswer) {
      toast.error("প্রিয় গ্রাহক, অনুগ্রহ করে প্রয়োজনীয় তথ্য গুলো পূরণ করুন।");
      return;
    } else {
      toast.dismiss();
    }

    const feedbacks = feedbackQuestions.map((q, i) => ({
      question: q.question,
      answer: answers[i],
    }));
    feedbacks.push({
      question: customFeedbackQuestion,
      ...(comment !== "" && { comment: comment }),
      ...customAnswer,
    });

    setIsSubmitting(true);
    const res = await createFeedback({
      customerId: customerId,
      serviceId: serviceId,
      feedbacks,
      rating: rating > 0 ? rating : null,
    });
    setIsSubmitting(false);
    toast(res.message, {
      type: res.success ? "success" : "error",
    });
    setShowSuccessPage(res.success);
  };
  const qIcons = [ThumbsUp, Clock, BadgeCheck, UserCheck];
  const date = service?.createdAt ? new Date(service.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const address = [service?.customerAddress, service?.customerAddressDistrict].filter(Boolean).join(", ");

  const YesNo = ({ value, onYes, onNo }: { value: string; onYes: () => void; onNo: () => void }) => (
    <span className="grid grid-cols-2 gap-1.5 shrink-0 w-[118px]">
      <button type="button" onClick={onYes} className={clsx("h-8 rounded-md border text-[13px] font-extrabold transition-colors", value === "হ্যাঁ" ? "bg-[#1a9c4b] border-[#1a9c4b] text-white" : "bg-[#eefaf2] border-[#bfe8cd] text-[#178a42]")}>হ্যাঁ</button>
      <button type="button" onClick={onNo} className={clsx("h-8 rounded-md border text-[13px] font-extrabold transition-colors", value === "না" ? "bg-[#e0243f] border-[#e0243f] text-white" : "bg-[#fff0f2] border-[#f7c3ca] text-[#c81f38]")}>না</button>
    </span>
  );

  if (showSuccessPage) {
    return (
      <div className="min-h-screen bg-[#eef3fb]">
        <SuccessPopup
          title="আপনার মূল্যবান ফিডব্যাকের জন্য ধন্যবাদ"
          message="আপনার ফিডব্যাক এর মতামত এর প্রেক্ষিতে আমাদের কোম্পানি SE ELECTRONICS আরো ভালো সার্ভিস দেওয়ার আপ্রান চেষ্টা করবে"
          buttonLabel="Go to home"
          href="/customer/profile"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
      <header className="bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 h-[56px] flex items-center gap-2.5">
        <span className="flex flex-col leading-tight min-w-0 flex-1"><span className="text-[16px] font-extrabold truncate">SE Electronics</span><span className="text-[10.5px] text-white/85 font-medium truncate">Trusted Power | Better Tomorrow</span></span>
        <a href={`tel:${contactDetails.customerCare}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold leading-tight"><Headset size={20} /><span>Service<br />Support</span></a>
      </header>

      <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[640px] mx-auto">
        {/* Title */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="size-12 rounded-full bg-[linear-gradient(135deg,#1f7cf0,#0b3d91)] text-white flex items-center justify-center shrink-0"><ClipboardCheck size={24} /></span>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold text-[#0b2a66]">কাস্টমার সার্ভিস ম্যানেজমেন্ট</span>
            <span className="text-[12px] font-semibold text-[#1f5fc9]">গ্রাহক সেবা মূল‌্যায়ন ফর্ম পূরণ করুন</span>
          </span>
          <span className="shrink-0 rounded-md bg-[#eef4fd] border border-[#dfe8f7] px-2 py-1 text-right leading-tight"><span className="block text-[10px] font-semibold text-[#5b6784]">সার্ভিস নম্বর</span><b className="text-[12.5px]">{serviceId}</b></span>
        </section>

        {/* Customer info */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2.5"><span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><User size={18} /></span><span className="text-[15px] font-extrabold text-[#0b3d91]">গ্রাহকের তথ্য</span></div>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 flex flex-col divide-y divide-[#eef1f6] text-[12.5px]">
              {[
                { icon: User, k: "নাম", v: service?.customerName || customerId || "N/A" },
                { icon: Phone, k: "মোবাইল নাম্বার", v: service?.customerPhone || contactDetails.customerCare },
                { icon: Mail, k: "ইমেইল", v: contactDetails.email },
                { icon: MapPin, k: "ঠিকানা", v: address || contactDetails.headOffice },
              ].map((r) => (
                <span key={r.k} className="flex items-start gap-2 py-1.5">
                  <r.icon size={15} className="text-[#1f5fc9] mt-0.5 shrink-0" />
                  <span className="w-[86px] shrink-0 text-[#5b6784] font-semibold">{r.k}</span>
                  <b className="min-w-0 break-words">{r.v}</b>
                </span>
              ))}
            </div>
            <div className="w-[112px] shrink-0 rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2 flex flex-col gap-2 text-[11.5px]">
              <span className="flex items-start gap-1.5"><Calendar size={16} className="text-[#1f5fc9] shrink-0" /><span className="flex flex-col leading-tight"><span className="text-[10px] font-semibold text-[#5b6784]">তারিখ</span><b>{date || "N/A"}</b></span></span>
              <span className="flex items-start gap-1.5"><Wrench size={16} className="text-[#1f5fc9] shrink-0" /><span className="flex flex-col leading-tight"><span className="text-[10px] font-semibold text-[#5b6784]">টেকনিশিয়ান</span><b className="break-words">{service?.staffName || "SE Team"}</b></span></span>
              <span className={clsx("h-7 rounded-md border inline-flex items-center justify-center gap-1 text-[11px] font-extrabold", service?.status === "completed" ? "bg-[#e9f9ef] border-[#bfe8cd] text-[#178a42]" : "bg-[#e8f1ff] border-[#cfe0fb] text-[#1b6fd6]")}><ShieldCheck size={13} />{service?.status === "completed" ? "সার্ভিস সম্পন্ন" : "সার্ভিস"}</span>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2.5"><span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Package size={18} /></span><span className="text-[15px] font-extrabold text-[#0b3d91]">সার্ভিসের বিবরণ</span></div>
          {(service?.productType || service?.productModel) && (
            <div className="rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2 flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-[#1f5fc9] text-white flex items-center justify-center shrink-0"><Package size={17} /></span>
              <span className="flex flex-col leading-tight min-w-0 flex-1"><b className="text-[13px] uppercase truncate">{service?.productType} {service?.type === "install" ? "ইনস্টলেশন" : "সার্ভিস"}</b><span className="text-[11.5px] text-[#5b6784] truncate">{service?.productModel}</span></span>
            </div>
          )}

          <div className="rounded-md border border-[#eef1f6] divide-y divide-[#eef1f6]">
            {feedbackQuestions.map(({ question }, index) => {
              const Icon = qIcons[index % qIcons.length];
              return (
                <div key={question} className="flex items-center gap-2 p-2">
                  <span className="size-8 rounded-full bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center shrink-0"><Icon size={16} /></span>
                  <span className="flex-1 min-w-0 text-[12.5px] leading-snug">{question} <span className="text-[#e0243f]">*</span></span>
                  <YesNo value={answers[index]} onYes={() => handleAnswer(index, "হ্যাঁ")} onNo={() => handleAnswer(index, "না")} />
                </div>
              );
            })}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center shrink-0"><Banknote size={16} /></span>
                <span className="flex-1 min-w-0 text-[12.5px] leading-snug">{customFeedbackQuestion} <span className="text-[#e0243f]">*</span></span>
                <YesNo value={customAnswer.answer} onYes={() => setCustomAnswer({ ...customAnswer, answer: "হ্যাঁ" })} onNo={() => setCustomAnswer({ answer: "না" })} />
              </div>
              {customAnswer.answer === "হ্যাঁ" && (
                <input onChange={(e) => setCustomAnswer({ ...customAnswer, amount: parseInt(e.target.value) })} value={customAnswer.amount ?? ""} autoFocus type="number" placeholder="টাকার পরিমান" className="ml-10 h-10 rounded-md border border-[#d9e2f0] px-2.5 text-[14px] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]" />
              )}
            </div>
          </div>

          <div className="rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2 flex flex-wrap items-center gap-2">
            <Star size={18} className="text-[#1f5fc9] fill-[#1f5fc9]" />
            <span className="text-[12.5px] font-bold text-[#0b2a66] flex-1 min-w-[150px]">আপনার অভিজ্ঞতা কেমন ছিল? রেটিং দিন।</span>
            <StarRating size={22} value={rating} onChange={(r) => setRating(r)} />
            <span className="text-[11px] text-[#5b6784]">(ঐচ্ছিক)</span>
          </div>

          <label htmlFor="comment" className="rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2 flex gap-2">
            <MessageSquareText size={18} className="text-[#1f5fc9] shrink-0 mt-0.5" />
            <span className="flex-1 flex flex-col gap-1">
              <span className="text-[12.5px] font-bold text-[#0b2a66]">মন্তব্য <span className="font-medium text-[#5b6784]">(optional)</span></span>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} name="comment" id="comment" rows={2} placeholder="আপনার মুল্যবান মন্তব্য লিখুন" className="w-full rounded-md border border-[#d9e2f0] bg-white p-2 text-[13px] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]" />
            </span>
          </label>

          <button disabled={isSubmitting} onClick={handleSubmit} className="mx-auto w-full max-w-[320px] h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-50 active:scale-[0.98] transition-all"><FileText size={17} />{isSubmitting ? "Submitting..." : "Submit"}<Send size={15} /></button>
        </section>

        {/* Contact */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-1 text-[12px] text-[#3d4a63]">
          <span className="flex items-center gap-2"><Mail size={14} className="text-[#1f5fc9]" />Email : <b className="text-[#16213a]">{contactDetails.email}</b></span>
          <span className="flex items-center gap-2"><Phone size={14} className="text-[#1f5fc9]" />হেল্পলাইন : <a href={`tel:${contactDetails.customerCare}`} className="font-bold text-[#1f5fc9]">{contactDetails.customerCare}</a></span>
          <span className="flex items-start gap-2"><MapPin size={14} className="text-[#1f5fc9] mt-0.5 shrink-0" /><span>হেড অফিস : {contactDetails.headOffice}</span></span>
        </section>
      </div>
    </div>
  );
}
