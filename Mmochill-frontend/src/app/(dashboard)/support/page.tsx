"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  LifeBuoy,
  History,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium",
  });
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetail(selectedTicket.id);

      // WebSocket Connection
      const token = getCookie("user_token_local");
      const wsUrl = `${(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1").replace("http", "ws")}/support/ws?ticket_id=${selectedTicket.id}&token=${token}`;
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const newMessage = JSON.parse(event.data);
          setMessages((prev) => {
            // Check if message already exists by ID
            if (prev.find((m) => m.id === newMessage.id)) return prev;

            // Find an optimistic message that matches this new one (by content and same sender)
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") && m.message === newMessage.message,
            );

            if (optimisticIndex !== -1) {
              const newMsgs = [...prev];
              // Keep the temp- ID as the primary ID to maintain the key and avoid animation flicker,
              // but we store the real ID for other purposes if needed
              newMsgs[optimisticIndex] = {
                ...newMessage,
                id: prev[optimisticIndex].id,
                real_id: newMessage.id,
              };
              return newMsgs;
            }

            return [...prev, newMessage];
          });
        } catch (error) {
          console.error("WS Parse Error:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WS Error:", error);
      };

      return () => {
        socket.close();
      };
    }
  }, [selectedTicket]);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  const fetchTickets = async () => {
    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/support/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (id: string) => {
    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/support/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      toast.error("Failed to fetch ticket details");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/support/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTicket),
        },
      );
      if (res.ok) {
        toast.success("Ticket created successfully");
        setIsCreateModalOpen(false);
        setNewTicket({ subject: "", description: "", priority: "medium" });
        fetchTickets();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create ticket");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;

    const currentReply = reply;
    setReply("");

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      ticket_id: selectedTicket.id,
      sender_id: "me",
      is_admin: false,
      message: currentReply,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/support/${selectedTicket.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: currentReply }),
        },
      );
      if (!res.ok) {
        toast.error("Failed to send message");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setReply(currentReply); // Restore reply
      }
    } catch (error) {
      toast.error("An error occurred");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setReply(currentReply);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const statusIcons = {
    open: <Clock className="w-4 h-4 text-blue-500" />,
    pending: <AlertCircle className="w-4 h-4 text-amber-500" />,
    resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    closed: <CheckCircle2 className="w-4 h-4 text-muted-foreground" />,
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground mt-1">
            Get help from our team and track your inquiries.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-[calc(100vh-200px)] lg:h-[calc(100vh-250px)] overflow-hidden">
        {/* Ticket List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`lg:col-span-4 flex flex-col gap-4 bg-card/50 border border-border/50 rounded-2xl p-4 overflow-y-auto ${
            selectedTicket ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-border/30">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Your Tickets
            </h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
              <LifeBuoy className="w-12 h-12 mb-4" />
              <p className="text-sm">No tickets found.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                variants={itemVariants}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket?.id === ticket.id
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "border-border/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      ticket.status === "open"
                        ? "bg-blue-500/10 text-blue-500"
                        : ticket.status === "pending"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    {ticket.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-medium text-sm line-clamp-1">
                  {ticket.subject}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {ticket.description}
                </p>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Chat / Detail Area */}
        <div
          className={`lg:col-span-8 bg-card/50 border border-border/50 rounded-2xl flex flex-col overflow-hidden shadow-sm ${
            selectedTicket ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedTicket.status === "open"
                        ? "bg-blue-500/10"
                        : selectedTicket.status === "pending"
                          ? "bg-amber-500/10"
                          : "bg-green-500/10"
                    }`}
                  >
                    {statusIcons[selectedTicket.status]}
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Priority:{" "}
                      <span className="capitalize">
                        {selectedTicket.priority}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              >
                {/* Original Description */}
                <div className="flex flex-row-reverse gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-2 opacity-50">
                      <span className="text-[10px]">
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-3 ${msg.is_admin ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          msg.is_admin
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 border border-amber-500/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {msg.is_admin ? (
                          <span className="text-xs font-bold">A</span>
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[80%] shadow-sm ${
                          msg.is_admin
                            ? "bg-muted/40 backdrop-blur-sm border border-border/50 rounded-tl-none"
                            : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-50">
                          <span className="text-[9px] uppercase font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <form
                onSubmit={handleReply}
                className="p-3 border-t border-border/40 bg-background/50 backdrop-blur-md"
              >
                <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                  <div className="relative flex-1 group">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message here..."
                      className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[44px] max-h-[120px] shadow-sm scrollbar-none"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-2.5">
                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="p-1.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-30 shadow-md shadow-primary/20"
                      >
                        {sending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium">No ticket selected</h3>
              <p className="text-sm max-w-[250px] mt-2">
                Choose a ticket from the left to view the conversation or create
                a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-bold">New Support Ticket</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the details below to request assistance.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <input
                    required
                    value={newTicket.subject}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, subject: e.target.value })
                    }
                    placeholder="e.g., Cannot withdraw balance"
                    className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value })
                    }
                    className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    required
                    value={newTicket.description}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your issue in detail..."
                    className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Create Ticket"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
