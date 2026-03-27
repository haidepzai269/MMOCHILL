import { notFound } from "next/navigation";
import { getTaskById } from "@/app/actions/tasks";
import { 
  Clock, 
  ChevronLeft, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  MousePointer2,
  FileText
} from "lucide-react";
import Link from "next/link";
import StartTaskButton from "./start-task-button";

export default async function TaskDetailPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  console.log("Raw ID from params:", id);
  
  const task = await getTaskById(id);
  
  if (!task) {
    console.error(`Task NOT FOUND for ID: ${id}`);
    notFound();
  }

  const steps = [
    {
      title: "Truy cập liên kết",
      description: "Nhấn vào nút bắt đầu bên dưới để mở trang của đối tác.",
      icon: <MousePointer2 className="w-5 h-5" />
    },
    {
      title: "Vượt qua mã xác nhận",
      description: "Hoàn thành Captcha hoặc các bước xác minh nếu được yêu cầu.",
      icon: <ShieldCheck className="w-5 h-5" />
    },
    {
      title: "Nhận mã / Get Link",
      description: "Đợi bộ đếm giây kết thúc và nhấn vào nút 'Lấy link' hoặc 'Tiếp tục'.",
      icon: <ExternalLink className="w-5 h-5" />
    },
    {
      title: "Hoàn tất & Nhận thưởng",
      description: "Sau khi quay lại MMOChill, số tiền sẽ được tự động cộng vào ví của bạn.",
      icon: <CheckCircle2 className="w-5 h-5" />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back Button */}
      <Link 
        href="/tasks" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group mb-2"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Quay lại Center
      </Link>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-primary rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                {task.type}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.time_requirement}s
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{task.title}</h1>
            <p className="text-indigo-100 max-w-md text-sm leading-relaxed">
              {task.description || "Hoàn thành các bước hướng dẫn bên dưới để nhận ngay phần thưởng vào ví điện tử của bạn."}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-center min-w-[160px]">
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Phần thưởng</p>
            <p className="text-4xl font-black text-white">+{task.reward_amount.toLocaleString()}</p>
            <p className="text-xs font-medium text-white/50 uppercase mt-1">VND</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instructions Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Hướng dẫn chi tiết
            </h2>
            
            <div className="space-y-8 relative">
              {/* Stepper Line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
              
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary font-bold shrink-0 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              <strong>Lưu ý:</strong> Vui lòng không đóng trang vượt link quá sớm. Hệ thống chống gian lận sẽ tự động kiểm tra thời gian thực hiện của bạn. Phát hiện gian lận sẽ bị khóa tài khoản vĩnh viễn.
            </p>
          </div>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm text-center sticky top-24">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <ExternalLink className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-lg mb-2">Sẵn sàng chưa?</h3>
             <p className="text-xs text-muted-foreground mb-8">
               Nhấn nút bên dưới để mở liên kết của đối tác và bắt đầu kiếm tiền.
             </p>

             <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
               <div className="text-left overflow-hidden">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Link mục tiêu</p>
                 <p className="text-xs font-medium text-muted-foreground truncate max-w-[180px]">
                   {task.is_completed ? "Đã hoàn thành" : (task.target_url || "Sẽ được cung cấp sau khi claim")}
                 </p>
               </div>
               <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                 <ShieldCheck className="w-4 h-4" />
               </div>
             </div>

             {task.is_completed ? (
               <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-bold">Nhiệm vụ đã hoàn thành!</p>
                    <p className="text-[10px] opacity-80">Phần thưởng đã được cộng vào ví của bạn.</p>
                 </div>
                 <Link 
                   href="/tasks"
                   className="block w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                 >
                   Tìm nhiệm vụ khác
                 </Link>
               </div>
             ) : (
               <StartTaskButton taskId={task.id} />
             )}
             
             <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed">
               Bằng cách nhấn bắt đầu, bạn đồng ý với các quy định về thực hiện nhiệm vụ của MMOChill.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
