import { verifyStaffSession } from "@/actions";
import { getStaffFeedbacks } from "@/actions/feedbackActions";
import { StaffLayout, MobilePageHeader } from "@/components/layout";
import { 
  MessageSquare, 
  Star, 
  Phone, 
  MapPin, 
  Package, 
  Zap, 
  User, 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle 
} from "lucide-react";
import { FeedbackItem } from "../FeedbackItem";
import { FeedbackCard } from "../FeedbackCard";

export default async function StaffFeedbacksPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const feedbacksRes = await getStaffFeedbacks(userId);

  const feedbacksList = feedbacksRes.success ? (feedbacksRes.data ?? []) : [];

  return (
    <StaffLayout>
      {/* <MobilePageHeader 
        title="Feedbacks" 
        backHref="/staff/profile" 
        Icon={Star}
      /> */}
      
      <div className="px-3 py-2 space-y-1">
        {/* Page Title (Desktop Only) */}
        <div className="hidden md:flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-100/50 rounded-md text-yellow-600">
            <Star size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Customer Feedbacks
          </h1>
        </div>

        {feedbacksList.length === 0 ? (
          <div className="bg-white p-12 rounded-md shadow-sm border border-gray-100 text-center text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="font-bold text-gray-700">No feedbacks yet.</p>
            <p className="text-sm mt-1 text-gray-400 font-medium">
              When customers give feedback on your services, they&apos;ll appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedbacksList.map((feedback: any) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
