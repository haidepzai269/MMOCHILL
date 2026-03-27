"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  MoreVertical,
  Mail,
  User,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  useEffect(() => {
    // SSE to refresh ticket list for real-time blue dots in the list
    const token = getCookie("user_token_local");
    if (!token) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/notifications/stream?token=${token}`,
      { withCredentials: true },
    );

    eventSource.addEventListener("support_update", () => {
      fetchTickets();
    });

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetail(selectedTicket.id);

      // WebSocket Connection
      const token = getCookie("user_token_local");
      const wsUrl = `${(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1").replace("http", "ws")}/support/ws?ticket_id=${selectedTicket.id}&token=${token}`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () =>
        console.log("WS Connected for ticket", selectedTicket.id);
      socket.onerror = (err) => console.error("WS Error:", err);
      socket.onclose = () =>
        console.log("WS Closed for ticket", selectedTicket.id);

      socket.onmessage = (event) => {
        try {
          const newMessage = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;

            // Find an optimistic message that matches this new one (by content and sender)
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.message === newMessage.message &&
                m.is_admin === newMessage.is_admin,
            );

            if (optimisticIndex !== -1) {
              const newMsgs = [...prev];
              newMsgs[optimisticIndex] = {
                ...newMessage,
                id: prev[optimisticIndex].id,
                real_id: newMessage.id,
              };
              return newMsgs;
            }

            return [...prev, newMessage];
          });

          // Auto-mark as pending if admin is currently viewing this ticket
          // and the new message is from the user
          if (
            !newMessage.is_admin &&
            selectedTicket?.id === newMessage.ticket_id
          ) {
            updateStatus("pending", newMessage.ticket_id);
          }
        } catch (error) {
          console.error("WS Parse Error:", error);
        }
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
      setLoading(true);
      const token = getCookie("user_token_local");
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/support`,
      );
      if (filterStatus) url.searchParams.append("status", filterStatus);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/support/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setMessages(data.messages || []);
      // Update selected ticket in list as well if needed
    } catch (error) {
      toast.error("Failed to fetch ticket details");
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
      sender_id: "admin",
      is_admin: true,
      message: currentReply,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/support/${selectedTicket.id}/reply`,
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
        toast.error("Failed to send reply");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setReply(currentReply);
      } else {
        fetchTickets(); // Refresh list to see updated status
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

  const updateStatus = async (status: string, ticketId?: string) => {
    const id = ticketId || selectedTicket?.id;
    if (!id) return;
    try {
      const token = getCookie("user_token_local");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/admin/support/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) {
        if (!ticketId) {
          toast.success(`Ticket marked as ${status}`);
          if (selectedTicket)
            setSelectedTicket({ ...selectedTicket, status: status as any });
        }
        fetchTickets();
      }
    } catch (error) {
      if (!ticketId) toast.error("Failed to update status");
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedTicket ? "hidden md:flex" : "flex"}`}
      >
        <div>
          <h1 className="text-2xl font-bold">Support Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and respond to user inquiries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] lg:h-[calc(100vh-180px)] overflow-hidden">
        {/* Ticket List */}
        <div
          className={`lg:col-span-4 flex flex-col gap-3 overflow-y-auto ${selectedTicket ? "hidden lg:flex" : "flex"}`}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border rounded-xl p-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.div
                layout
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  if (ticket.status === "open") {
                    updateStatus("pending", ticket.id);
                  }
                }}
                className={`p-4 bg-card border rounded-xl cursor-pointer transition-all hover:shadow-md relative ${
                  selectedTicket?.id === ticket.id
                    ? "border-primary ring-1 ring-primary/20 shadow-sm"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {ticket.status === "open" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                    )}
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
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase ${ticket.priority === "high" ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {ticket.priority} Priority
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-1">
                  {ticket.subject}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{ticket.user_email}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground italic">
                    Updated {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Conversation */}
        <div
          className={`lg:col-span-8 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm ${selectedTicket ? "flex" : "hidden lg:flex"}`}
        >
          {selectedTicket ? (
            <>
              <div className="p-3 sm:p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden p-2 -ml-1 hover:bg-muted rounded-full transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h2 className="text-base sm:text-lg font-bold truncate">
                        {selectedTicket.subject}
                      </h2>
                      <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                        ID: {selectedTicket.id.split("-")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {selectedTicket.user_email}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedTicket.created_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateStatus("resolved")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg text-xs font-semibold transition-colors border border-green-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </button>
                  <button
                    onClick={() => updateStatus("closed")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-xs font-semibold transition-colors border border-border"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5 scroll-smooth"
              >
                {/* Ticket Description */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="max-w-[85%] w-fit">
                    <div className="bg-background border border-border/50 p-4 rounded-2xl rounded-tl-none shadow-sm shadow-black/5">
                      <p className="text-sm whitespace-pre-wrap text-foreground/90">
                        {selectedTicket.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 block ml-1">
                      Initial Request •{" "}
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-3 ${msg.is_admin ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                          msg.is_admin
                            ? "bg-primary border-primary/20 text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-muted border-border/50 text-muted-foreground"
                        }`}
                      >
                        {msg.is_admin ? "A" : <User className="w-4 h-4" />}
                      </div>
                      <div
                        className={`max-w-[85%] w-fit ${msg.is_admin ? "ml-auto" : "mr-auto"}`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl shadow-sm ${
                            msg.is_admin
                              ? "bg-primary text-primary-foreground rounded-tr-none text-left"
                              : "bg-background border border-border/50 rounded-tl-none text-left"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] text-muted-foreground mt-1.5 block px-1 opacity-60 font-medium uppercase ${msg.is_admin ? "text-right" : "text-left"}`}
                        >
                          {msg.is_admin ? "Admin" : "User"} •{" "}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <form
                onSubmit={handleReply}
                className="p-3 border-t border-border/40 bg-background"
              >
                <div className="relative flex items-end gap-2 max-w-5xl mx-auto">
                  <div className="relative flex-1 group">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your reply to the user..."
                      className="w-full bg-muted/20 border border-border/50 rounded-2xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-[44px] max-h-[120px] resize-none shadow-inner scrollbar-none"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-2">
                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="bg-primary text-primary-foreground p-1.5 rounded-xl hover:opacity-90 transition-all font-medium flex items-center justify-center disabled:opacity-30 shadow-md shadow-primary/20"
                      >
                        {sending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-xl font-bold">Select a ticket to respond</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Manage customer queries efficiently. You can filter by status or
                search by email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
