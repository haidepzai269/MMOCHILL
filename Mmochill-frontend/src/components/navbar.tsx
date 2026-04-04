"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Coins, Search, X, LogOut, UserCog, Zap, Wallet, ChevronRight, User as UserIcon, Loader2, LifeBuoy, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getUserProfile, userLogout } from "@/app/actions/auth";
import { globalSearch } from "@/app/actions/search";
import RankBadge, { getRankInfo } from "./rank-badge";
import { useAppearance } from "./appearance-provider";
import { FestiveHeaderOverlay } from "./festive-effects/header-overlay";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { effectiveEvent } = useAppearance();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{tasks: any[], actions: any[]}>({tasks: [], actions: []});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({tasks: [], actions: []});
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await globalSearch(searchQuery);
      setSearchResults(data);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const data = await getUserProfile();
      if (data) setUser(data);
    };
    fetchUser();

    const handleUpdate = () => fetchUser();
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  const handleLogout = async () => {
    await userLogout();
    setUser(null);
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b border-border/50 px-4 h-16 flex items-center justify-between transition-all duration-500 ${effectiveEvent === 'victory_day' ? 'bg-[#da251d] text-white border-none shadow-lg' : 'bg-background/80'}`}>
        <FestiveHeaderOverlay event={effectiveEvent} />
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${effectiveEvent === 'victory_day' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}
          >
            <Coins className="w-6 h-6" />
          </motion.div>
          <div>
            <h1 className={`font-bold text-lg leading-none tracking-tight ${effectiveEvent === 'victory_day' ? 'text-white' : ''}`}>MMOChill</h1>
            <p className={`text-xs font-medium ${effectiveEvent === 'victory_day' ? 'text-white/80' : 'text-muted-foreground'}`}>Earn every tap</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <>
              <button 
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl transition-colors active:scale-95 ${effectiveEvent === 'victory_day' ? 'hover:bg-white/10 text-white' : 'hover:bg-muted text-foreground/80'}`}
              >
                <Search className="w-5 h-5" />
              </button>

              {!user ? (
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-opacity ${effectiveEvent === 'victory_day' ? 'bg-white text-[#da251d]' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                >
                  Login
                </Link>
              ) : (
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsSearchOpen(false);
                  }}
                  className={`w-10 h-10 rounded-xl overflow-hidden border transition-all flex items-center justify-center ${isUserMenuOpen ? (effectiveEvent === 'victory_day' ? 'border-white ring-2 ring-white/20' : 'border-primary ring-2 ring-primary/20') : (effectiveEvent === 'victory_day' ? 'border-white/30 bg-white/10' : 'border-border bg-muted/30')}`}
                >
                   {user.avatar_url ? (
                     <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <UserIcon className={`w-5 h-5 ${effectiveEvent === 'victory_day' ? 'text-white' : 'text-primary'}`} />
                   )}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col pt-2"
          >
            <div className="flex items-center px-4 h-14 shrink-0 gap-3">
              <Search className="w-5 h-5 text-muted-foreground ml-2" />
              <input 
                autoFocus
                placeholder="Tìm nhiệm vụ, rút tiền, hỗ trợ..." 
                className="flex-1 bg-transparent border-none outline-none text-base h-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 custom-scrollbar">
              {!searchQuery.trim() ? (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground text-sm">Nhập từ khóa để bắt đầu tìm kiếm...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Actions results */}
                  {searchResults?.actions?.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Hành động nhanh</h3>
                      <div className="grid grid-cols-1 gap-1">
                        {searchResults.actions.map((action, idx) => (
                          <Link 
                            key={idx}
                            href={action.url}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {action.icon === 'Wallet' && <Wallet className="w-4 h-4" />}
                              {action.icon === 'Zap' && <Zap className="w-4 h-4" />}
                              {action.icon === 'UserCog' && <UserCog className="w-4 h-4" />}
                              {action.icon === 'LifeBuoy' && <LifeBuoy className="w-4 h-4" />}
                              {action.icon === 'Dizzy' && <Trophy className="w-4 h-4" />}
                            </div>
                            <span className="text-sm font-medium">{action.title}</span>
                            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks results */}
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Nhiệm vụ ({searchResults?.tasks?.length || 0})</h3>
                    {searchResults?.tasks?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {searchResults.tasks.map((task) => (
                          <Link 
                            key={task.id}
                            href={`/tasks/${task.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-muted transition-all border border-border/50 group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-xl shrink-0">
                              {task.provider === 'traffic68' ? '🎁' : '⚡'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors">{task.title}</h4>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{task.provider}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-primary font-bold text-xs">+{task.reward.toLocaleString()}đ</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      !isSearching && searchQuery.trim() && (
                        <div className="py-4 text-center">
                          <p className="text-muted-foreground text-xs italic">Không tìm thấy nhiệm vụ nào khớp với "{searchQuery}"</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Menu Overlay */}
      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-[9999] bg-background border-b border-border shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl mb-2">
                 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <UserIcon className="w-6 h-6" />
                    )}
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">{user?.full_name || user?.username || "Thành viên"}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">{user?.email}</p>
                 </div>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Hồ sơ cá nhân</span>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30" />
              </Link>

              <Link
                href="/wallet"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Ví tiền & Rút tiền</span>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30" />
              </Link>

              <div className="h-px bg-border my-2 mx-4" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-4 p-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
