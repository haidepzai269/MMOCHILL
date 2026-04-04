"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Plus, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Bot,
  Loader2,
  Trash,
  Send,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { adminDeleteComment, adminAddBotComment } from "@/app/actions/community";

interface Comment {
  id: string;
  username: string;
  avatar_url: string;
  content: string;
  is_bot: boolean;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Bot Form State
  const [botName, setBotName] = useState("");
  const [botAvatar, setBotAvatar] = useState("");
  const [botContent, setBotContent] = useState("");
  const [isSubmittingBot, setIsSubmittingBot] = useState(false);
  const [showBotForm, setShowBotForm] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/community/comments?limit=100`);
      const data = await res.json();
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    setIsDeleting(id);
    try {
      const res = await adminDeleteComment(id);
      if (res.success) {
        setComments(comments.filter(c => c.id !== id));
      } else {
        alert(res.error || "Lỗi khi xóa bình luận hoặc bạn không có quyền Admin");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddBotComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName || !botContent) return;
    
    setIsSubmittingBot(true);
    try {
      const res = await adminAddBotComment(botName, botAvatar, botContent);
      
      if (res.success) {
        setBotName("");
        setBotAvatar("");
        setBotContent("");
        setShowBotForm(false);
        fetchComments();
      } else {
        alert(res.error || "Lỗi khi thêm bình luận bot");
      }
    } catch (error) {
      console.error("Error adding bot comment:", error);
    } finally {
      setIsSubmittingBot(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border/50 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Comment <span className="text-primary">Management</span></h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Admin control panel</p>
          </div>
        </div>

        <button 
          onClick={() => setShowBotForm(!showBotForm)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
        >
          {showBotForm ? "CLOSE FORM" : "CREATE BOT COMMENT"} 
          {showBotForm ? <AlertCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Bot comment form */}
      <AnimatePresence>
        {showBotForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleAddBotComment}
              className="bg-card border border-primary/20 p-8 rounded-3xl shadow-xl shadow-primary/5 flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                <Bot className="w-4 h-4" />
                <span>Bot Persona Configuration</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bot Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <input 
                      type="text" 
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="e.g. MMO Bot 01"
                      className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Avatar URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <input 
                      type="text" 
                      value={botAvatar}
                      onChange={(e) => setBotAvatar(e.target.value)}
                      placeholder="https://... | Leave empty for default"
                      className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Comment Content</label>
                <textarea 
                  value={botContent}
                  onChange={(e) => setBotContent(e.target.value)}
                  placeholder="What would like this bot to say?"
                  className="w-full bg-muted/20 border border-border/50 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmittingBot}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isSubmittingBot ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> DEPLOY BOT COMMENT</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
          <h2 className="text-lg font-bold italic uppercase tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Live Feed
          </h2>
          <span className="text-[10px] font-black bg-muted/30 px-3 py-1 rounded-full text-muted-foreground">{comments.length} TOTAL ITEMS</span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-left bg-muted/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <th className="p-6">User/Bot</th>
                <th className="p-6">Content</th>
                <th className="p-6">Created At</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-30 italic">Synchronizing with database...</p>
                  </td>
                </tr>
              ) : comments.length > 0 ? (
                comments.map((comment, index) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    key={comment.id} 
                    className="hover:bg-muted/5 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/50 overflow-hidden shrink-0 flex items-center justify-center">
                          {comment.avatar_url ? (
                            <img src={comment.avatar_url} alt={comment.username} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${comment.is_bot ? 'text-primary' : 'text-foreground'}`}>
                            {comment.username}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground opacity-50 italic">
                            {comment.is_bot ? 'Auto-generated Bot' : 'Authenticated User'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 max-w-md">
                      <div className="text-sm line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        {comment.content}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col min-w-[120px]">
                        <span className="text-xs font-bold">{new Date(comment.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-muted-foreground opacity-50">{new Date(comment.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeleting === comment.id}
                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50"
                      >
                        {isDeleting === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center opacity-30 select-none">
                    <Trash className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest italic">No comments found in historical records.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
