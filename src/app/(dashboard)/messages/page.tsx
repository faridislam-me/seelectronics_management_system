"use client";

import {
  getAllContactMessages,
  replyToMessage,
} from "@/actions/contactActions";
import {
  CheckCircle,
  Mail,
  MessageSquare,
  Reply,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [adminReply, setAdminReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [sendSms, setSendSms] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    const res = await getAllContactMessages();
    if (res.success) {
      setMessages(res.data || []);
    }
    setLoading(false);
  }

  async function handleReply() {
    if (!selectedMessage || !adminReply.trim()) {
      toast.error("Please provide a reply");
      return;
    }
    setIsReplying(true);
    const res = await replyToMessage(selectedMessage.messageId, adminReply, { sendSms });
    if (res.success) {
      toast.success(res.message);
      setSelectedMessage(null);
      setAdminReply("");
      loadMessages();
    } else {
      toast.error(res.message);
    }
    setIsReplying(false);
  }

  const filteredMessages = messages.filter((m) => {
    const matchesStatus =
      filter === "all" ||
      (filter === "replied" && m.isRead) ||
      (filter === "pending" && !m.isRead);
    const matchesSearch =
      m.messageId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            Customer Messages
          </h1>
          <p className="text-gray-500">
            Respond to customer inquiries and feedback
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-md border border-gray-100 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === "all" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === "pending" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("replied")}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === "replied" ? "bg-green-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Replied
          </button>
        </div>
      </header>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by ID, Customer or Subject..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-md border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <Mail className="mx-auto text-gray-200 mb-4" size={64} />
          <p className="text-gray-500 font-bold">
            No messages found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMessages.map((msg) => (
            <div
              key={msg.messageId}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      msg.isRead
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {msg.isRead ? "Replied" : "Unread"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {msg.messageId}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                  {msg.subject}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={12} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">
                    From: {msg.customer.name}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed italic mb-4">
                  "{msg.message}"
                </p>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                {!msg.isRead ? (
                  <button
                    onClick={() => setSelectedMessage(msg)}
                    className="w-full py-3 bg-blue-600 rounded-md text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Reply size={16} />
                    Reply to Message
                  </button>
                ) : (
                  <div className="bg-white rounded-md p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle size={10} className="text-green-500" />
                      Admin Reply
                    </p>
                    <p className="text-gray-700 text-sm font-medium">
                      "{msg.adminReply}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 bg-blue-600 text-white">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <Send className="rotate-45" />
                Send Reply
              </h2>
              <p className="text-blue-100 text-sm">
                Customer: {selectedMessage.customer.name}
              </p>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="mb-6">
                <p className="text-sm font-black text-gray-400 uppercase mb-2 tracking-widest">
                  Customer Subject & Message
                </p>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 border-l-4 border-l-blue-500">
                  <h4 className="font-bold text-gray-900 mb-1 italic">
                    {selectedMessage.subject}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "{selectedMessage.message}"
                  </p>
                </div>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Your Professional Response
              </label>
              <textarea
                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Type your response here..."
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
              />
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="size-4 accent-blue-600"
                />
                Also send as SMS to customer
                <span className="text-xs font-medium text-gray-400">
                  ({selectedMessage?.customer?.phone || "customer phone"})
                </span>
              </label>
            </div>

            <div className="p-8 bg-gray-50 flex gap-4">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={isReplying || !adminReply.trim()}
                className="flex-1 py-4 bg-black text-white rounded-md text-sm font-bold shadow-lg disabled:bg-gray-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isReplying ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
