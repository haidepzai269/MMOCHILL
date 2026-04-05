import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ArrowDownRight, ArrowUpRight, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function AdminUserHistory({ user, onBack }: { user: any, onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/users/${user.id}/transactions?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const rawText = await res.text();
        let json;
        try {
           json = JSON.parse(rawText);
        } catch (e) {
           console.error("Lỗi parse JSON. HTTP Status:", res.status, "Raw text:", rawText);
           return;
        }

        if (json.transactions) {
          setTransactions(json.transactions);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card py-6 rounded-[2.5rem] shadow-xl border border-border"
    >
      <div className="px-8 py-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors shrink-0"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-blue-500 overflow-hidden shrink-0 flex items-center justify-center text-white font-black text-lg">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.username?.charAt(0) || user.email?.charAt(0)
                    )}
                </div>
                <div>
                   <h2 className="text-xl font-black text-foreground">{user.username || user.full_name}</h2>
                   <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                     {user.email}
                   </p>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-6 px-4 md:px-0">
            <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Tổng số dư</p>
                <p className="text-lg font-black text-primary">{user.balance?.toLocaleString() || 0} VNĐ</p>
            </div>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-medium bg-muted/20 rounded-3xl border border-border/50">
            Người dùng này chưa có giao dịch nào
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border border-border rounded-2xl hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all gap-4">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{tx.note || (isPositive ? "Nhận tiền" : "Trừ tiền")}</p>
                        <div className="flex items-center gap-3 mt-1.5 opacity-60">
                           <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md">{tx.type}</span>
                           <span className="text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between md:flex-col md:items-end gap-1 md:bg-transparent bg-muted/10 p-3 md:p-0 rounded-xl">
                      <div className={`text-lg font-black tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                         {isPositive ? '+' : ''}{tx.amount.toLocaleString()}đ
                      </div>
                      <div className="text-xs font-medium text-muted-foreground/70">
                         Số dư sau: <span className="font-bold text-foreground">{tx.balance_after.toLocaleString()}đ</span>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
