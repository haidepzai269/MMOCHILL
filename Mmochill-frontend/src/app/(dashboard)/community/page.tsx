"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Newspaper, 
  MessageSquare, 
  Send, 
  User, 
  Calendar,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  X,
  BookOpen,
  DollarSign,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  BookMarked
} from "lucide-react";
import { postComment } from "@/app/actions/community";
import { getUserProfile } from "@/app/actions/auth";

interface Weather {
  city: string;
  temperature: number;
  description: string;
  icon: string;
}

interface News {
  id: string;
  source: string;
  category: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  published_at: string;
}

interface Comment {
  id: string;
  username: string;
  avatar_url: string;
  content: string;
  is_bot: boolean;
  created_at: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  category: string;
}

interface Chapter {
  id: string;
  book_id: string;
  chapter_index: number;
  title: string;
  content: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

const categories = [
  { id: "finance", name: "Tin Kinh Tế", icon: DollarSign },
  { id: "academy", name: "Học Viện Sách", icon: GraduationCap },
];

export default function CommunityPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCategory, setActiveCategory] = useState("finance");
  const [commentInput, setCommentInput] = useState("");
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // News Reader State
  const [selectedArticle, setSelectedArticle] = useState<{
    title: string;
    content: string[];
    images: string[];
    url: string;
  } | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Book Reader State
  const [isReadingBook, setIsReadingBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapterIndex, setChapterIndex] = useState(1);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await getUserProfile();
        const isVipRank = (profile?.peak_balance || 0) >= 2000000;
        
        if (profile && (profile.role === "admin" || profile.is_vip || isVipRank)) {
          setIsAuthorized(true);
          fetchWeather();
          fetchComments();
        } else {
          setIsAuthorized(false);
          toast.error("Tính năng này chỉ dành cho thành viên VIP!");
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (activeCategory === "finance") {
      fetchNews();
    } else if (activeCategory === "academy") {
      fetchBooks();
    }
  }, [activeCategory]);

  const fetchWeather = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/community/weather`);
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      // API hiện tại đã được gộp nguồn tin tại backend/news/vietnam
      const res = await fetch(`${BACKEND_URL}/community/news/vietnam?category=finance`);
      const data = await res.json();
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  const fetchBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const res = await fetch(`${BACKEND_URL}/community/books`);
      const data = await res.json();
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const fetchChapter = async (bookId: string, index: number) => {
    setIsLoadingChapter(true);
    try {
      const res = await fetch(`${BACKEND_URL}/community/books/${bookId}/chapters/${index}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentChapter(data);
        setChapterIndex(index);
        // Lưu tiến trình đọc
        localStorage.setItem(`read_progress_${bookId}`, index.toString());
      } else {
        alert("Bản thảo chương này đang được cập nhật hoặc bạn đã đọc hết sách.");
        if (index > 1) setChapterIndex(index - 1);
      }
    } catch (error) {
      console.error("Error fetching chapter:", error);
    } finally {
      setIsLoadingChapter(false);
    }
  };

  const startReadingBook = (book: Book) => {
    setSelectedBook(book);
    setIsReadingBook(true);
    const savedProgress = localStorage.getItem(`read_progress_${book.id}`);
    const startIdx = savedProgress ? parseInt(savedProgress) : 1;
    fetchChapter(book.id, startIdx);
  };

  const fetchArticleContent = async (url: string) => {
    setIsLoadingContent(true);
    setIsReading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/community/news/content?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedArticle(data);
      } else {
        alert("Không thể lấy nội dung bài báo này. Bạn có thể xem tại trang gốc.");
        setIsReading(false);
      }
    } catch (error) {
      console.error("Error fetching article content:", error);
      setIsReading(false);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/community/comments`);
      const data = await res.json();
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await postComment(commentInput);
      if (res.success) {
        setCommentInput("");
        fetchComments();
      } else {
        alert(res.error || "Bạn cần đăng nhập để bình luận");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getWeatherIcon = (code: string) => {
    const c = parseInt(code);
    if (c === 0) return <Sun className="w-8 h-8 text-yellow-400" />;
    if (c >= 1 && c <= 3) return <Sun className="w-8 h-8 text-orange-300" />;
    if (c >= 51 && c <= 65) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (c >= 95) return <CloudLightning className="w-8 h-8 text-purple-400" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  if (isAuthorized === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest italic opacity-50">Checking Access Rights...</p>
      </div>
    );
  }

  if (isAuthorized === false) return null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Weather Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 shadow-xl"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-primary/80 font-bold uppercase tracking-widest text-xs mb-2">
              <MapPin className="w-3 h-3" />
              <span>Current Weather</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-1">
              MMOChill <span className="text-primary">Academy</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Nâng tầm tư duy tài chính và cập nhật dòng chảy kinh tế toàn cầu cùng MMOChill.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {weather ? (
              <motion.div 
                key="weather"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-6 bg-background/40 backdrop-blur-md rounded-2xl p-6 border border-white/10"
              >
                <div className="p-3 bg-primary/10 rounded-xl">
                  {getWeatherIcon(weather.icon)}
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">{weather.temperature}°C</span>
                  <span className="text-xs font-bold text-primary uppercase">{weather.description}</span>
                  <span className="text-[10px] text-muted-foreground">{weather.city}, VN</span>
                </div>
              </motion.div>
            ) : (
              <div key="loader" className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium opacity-50 italic">Fetching sky data...</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Categories Navigator */}
      <div className="flex flex-wrap gap-2 md:gap-4 p-2 bg-card/30 rounded-3xl border border-border/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeCategory === cat.id 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
              : "bg-background/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* News & Academy Section */}
      <div className="flex flex-col gap-6">
        {activeCategory === "finance" ? (
          <>
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold italic uppercase tracking-tight">Tin Tức Tài Chính</h2>
            </div>

            {isLoadingNews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-muted/20 animate-pulse border border-border/50" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {news.map((item, index) => (
                    <motion.div
                      key={item.id || item.url}
                      onClick={() => fetchArticleContent(item.url)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="group cursor-pointer flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden hover:border-primary/30 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-muted/30">
                        {item.thumbnail ? (
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Globe className="w-12 h-12 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                          {item.source}
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </div>
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-2">
                          {item.description}
                        </p>
                        <div className="mt-auto flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-2 transition-all">
                          Đọc toàn bộ <BookOpen className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
                <Newspaper className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest italic">Hôm nay chưa có tin tức mới.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold italic uppercase tracking-tight">Học Viện Sách</h2>
            </div>

             {isLoadingBooks ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-80 rounded-3xl bg-muted/20 animate-pulse border border-border/50" />
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {books.map((book, idx) => (
                   <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => startReadingBook(book)}
                    className="group cursor-pointer flex flex-col bg-card border border-border/50 rounded-[2rem] overflow-hidden hover:border-primary/40 transition-all shadow-lg hover:shadow-primary/10"
                   >
                     <div className="relative aspect-[3/4] overflow-hidden bg-muted/50">
                        {book.thumbnail ? (
                          <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-4">
                             <BookMarked className="w-12 h-12 text-primary/30" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{book.title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                           <span className="text-[10px] font-bold text-primary-foreground/70 uppercase mb-1">{book.author}</span>
                           <h4 className="text-white font-bold text-sm leading-tight">{book.title}</h4>
                        </div>
                     </div>
                     <div className="p-5 flex flex-col gap-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{book.author}</span>
                        <h3 className="font-bold text-xs line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed italic">{book.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[8px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md uppercase tracking-tighter">FREE ACCESS</span>
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                               <BookOpen className="w-3.5 h-3.5" />
                            </div>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>

      {/* Community Feedback Section */}
      <div className="flex flex-col gap-6 mt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold italic uppercase tracking-tight">Community Feedback</h2>
        </div>

        <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-xl p-6 lg:p-10 flex flex-col gap-8">
          {/* Post Comment Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Share your thoughts</h3>
            <div className="relative group">
              <textarea 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="How do you feel about MMOChill today? Tell us everything..."
                className="w-full bg-muted/20 border border-border/50 rounded-2xl p-5 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none group-hover:bg-muted/30"
              />
              <button 
                onClick={handlePostComment}
                disabled={isSubmittingComment || !commentInput.trim()}
                className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    POST COMMENT <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Comment List */}
          <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
            {comments.length > 0 ? (
              <div className="flex flex-col gap-6">
                {comments.map((comment, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={comment.id} 
                    className="flex gap-4 group"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-muted/30 border border-border/50 overflow-hidden shadow-inner flex items-center justify-center">
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt={comment.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-tighter ${comment.is_bot ? 'text-primary' : 'text-foreground'}`}>
                          {comment.username}
                          {comment.is_bot && <span className="ml-2 px-1.5 py-0.5 bg-primary/10 rounded text-[8px] italic">OFFICIAL BOT</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-50">• {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="bg-muted/20 border border-border/30 rounded-2xl rounded-tl-none p-4 shadow-sm group-hover:border-primary/20 transition-all">
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest italic">No comments yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* News Reader Modal */}
      <AnimatePresence>
        {isReading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReading(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border/50 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-border/30 bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">MMOChill Smart Reader</span>
                </div>
                <button 
                  onClick={() => setIsReading(false)}
                  className="p-3 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-16 no-scrollbar">
                {isLoadingContent ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-40">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest italic">Extracting article content...</p>
                  </div>
                ) : selectedArticle ? (
                  <div className="max-w-2xl mx-auto flex flex-col gap-10">
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase leading-[1.1] tracking-tighter">
                      {selectedArticle.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 py-6 border-y border-border/30">
                       <span className="text-[10px] font-black px-3 py-1.5 bg-primary/10 rounded-xl text-primary uppercase">Reader Mode Active</span>
                       <a href={selectedArticle.url} target="_blank" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group">
                         {selectedArticle.url} <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                       </a>
                    </div>

                    <div className="flex flex-col gap-8">
                      {selectedArticle.content.map((para, i) => (
                        <p key={i} className="text-xl leading-relaxed text-foreground/80 first-letter:text-5xl first-letter:font-black first-letter:mr-2 first-letter:float-left first:mt-2 selection:bg-primary/20">
                          {para}
                        </p>
                      ))}
                    </div>

                    {selectedArticle.images && selectedArticle.images.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        {selectedArticle.images.slice(0, 4).map((img, i) => (
                          <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.02 }}
                            className="rounded-[2rem] overflow-hidden border border-border/50 aspect-video shadow-lg"
                          >
                            <img src={img} alt="Article image" className="w-full h-full object-cover" />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div className="mt-16 p-12 bg-muted/20 border border-border/30 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-bold opacity-50 italic uppercase tracking-widest">You have reached the end</p>
                        <a 
                          href={selectedArticle.url} 
                          target="_blank" 
                          className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Show Support on Original Site
                        </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-center opacity-40">
                    <X className="w-12 h-12 mb-4" />
                    <p className="font-bold uppercase tracking-widest italic">Content synchronization failed.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Reader Modal */}
      <AnimatePresence>
        {isReadingBook && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReadingBook(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 50 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-card border border-border/50 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Reader Header */}
              <div className="flex items-center justify-between p-6 px-8 border-b border-border/30 bg-muted/10">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">MMO Academy Reader</span>
                    <h2 className="text-sm font-black uppercase italic tracking-tighter truncate max-w-[200px] md:max-w-md">
                      {selectedBook?.title}
                    </h2>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsReadingBook(false)}
                      className="p-2.5 hover:bg-muted rounded-2xl transition-colors border border-border/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Reader Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-8 lg:p-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                 {isLoadingChapter ? (
                   <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <BookOpen className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Lấy dữ liệu từ tri thức nhân loại...</p>
                   </div>
                 ) : currentChapter ? (
                   <div className="max-w-2xl mx-auto flex flex-col gap-12">
                      <div className="flex flex-col items-center text-center gap-4">
                         <span className="px-3 py-1 bg-primary/10 rounded-full text-[9px] font-black text-primary uppercase tracking-widest">
                           Chương {currentChapter?.chapter_index}
                         </span>
                         <h1 className="text-3xl md:text-5xl font-black italic uppercase leading-none tracking-tighter selection:bg-primary/20">
                            {currentChapter?.title}
                         </h1>
                         <div className="w-16 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>

                      <div className="prose prose-invert max-w-none">
                         <div className="text-lg md:text-xl leading-[1.8] text-foreground/90 font-medium whitespace-pre-wrap selection:bg-primary/20">
                           {currentChapter?.content}
                         </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-12 py-8 border-t border-border/30">
                         <button
                           disabled={chapterIndex <= 1}
                           onClick={() => fetchChapter(selectedBook!.id, chapterIndex - 1)}
                           className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-muted/40 hover:bg-muted font-bold text-xs transition-all disabled:opacity-20"
                         >
                           <ChevronLeft className="w-4 h-4" /> TRƯỚC ĐÓ
                         </button>

                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Tiến trình</span>
                            <span className="text-xs font-black text-primary italic">Chương {chapterIndex}</span>
                         </div>

                         <button
                           onClick={() => fetchChapter(selectedBook!.id, chapterIndex + 1)}
                           className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                         >
                           TIẾP THEO <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
