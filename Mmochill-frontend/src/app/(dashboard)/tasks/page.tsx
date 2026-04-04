"use client";

import { CheckSquare } from "lucide-react";
import { getActiveTasks } from "@/app/actions/tasks";
import TaskCard from "./task-card";
import { useEffect, useState, Suspense } from "react";
import { useLoading } from "@/lib/contexts/loading-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";

function TasksContent() {
  const { showLoading, hideLoading } = useLoading();
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const { lastTaskUpdate } = useNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchTasks = async () => {
    let res = await getActiveTasks();
    if (!res) res = [];

    const completedTaskId = searchParams?.get("completed_task_id");
    if (completedTaskId) {
      // Tìm xem task vừa làm có còn trong danh sách Active (trả về từ Backend) không?
      const originalTask = res.find(t => t.id === completedTaskId);
      
      // Nếu là Nhiệm vụ Đa lượt (taplayma/nhapma/traffic68) và VẪN CÒN LƯỢT (Backend vẫn trả về)
      // thì KHÔNG chạy hiệu ứng "trượt xuống đáy", chỉ hiện thị bình thường ở vị trí cũ
      if (originalTask && (originalTask.provider === "taplayma" || originalTask.provider === "nhapma" || originalTask.provider === "traffic68")) {
         setActiveTasks(res);
         
         // Dọn dẹp URL ngay
         const params = new URLSearchParams(window.location.search);
         params.delete("completed_task_id");
         params.delete("status");
         router.replace(window.location.pathname + (params.toString() ? `?${params.toString()}` : ""), { scroll: false });
         return;
      }

      // TRƯỜNG HỢP: Nhiệm vụ đã hết lượt (3/3) hoặc Nhiệm vụ 1 lần (Manual)
      // Chạy hiệu ứng "Bóng mượt trượt xuống đáy"
      const completedTask = {
        ...(originalTask || {}),
        id: completedTaskId,
        title: originalTask?.title || "Nhiệm vụ vừa thực hiện",
        description: "Bạn đã hoàn thành nhiệm vụ này và nhận thưởng thành công.",
        _isJustCompleted: true
      };

      const otherTasks = res.filter(t => t.id !== completedTaskId);
      setActiveTasks([completedTask, ...otherTasks]);

      setTimeout(() => {
        setActiveTasks((prev) => {
          const arr = [...prev];
          const taskIdx = arr.findIndex(t => t.id === completedTaskId);
          if (taskIdx >= 0) {
            const [t] = arr.splice(taskIdx, 1);
            arr.push(t);
          }
          return arr;
        });

        const params = new URLSearchParams(window.location.search);
        params.delete("completed_task_id");
        params.delete("status");
        router.replace(window.location.pathname + (params.toString() ? `?${params.toString()}` : ""), { scroll: false });
      }, 1200);

    } else {
      setActiveTasks(res);
    }
  };

  useEffect(() => {
    const init = async () => {
      showLoading();
      await fetchTasks();
      hideLoading();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastTaskUpdate > 0) {
      if (!searchParams?.get("completed_task_id")) {
         fetchTasks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTaskUpdate]);

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10" />
         <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <CheckSquare className="w-6 h-6" /> Task Center
            </h1>
            <p className="text-indigo-50 text-sm max-w-sm">
              Hoàn thành các nhiệm vụ bên dưới để nhận phần thưởng. Click vào nhiệm vụ để nhận hướng dẫn.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto w-full pb-10">
        {activeTasks.length === 0 ? (
          <div className="col-span-1 sm:grid-cols-2 text-center py-12 text-muted-foreground bg-card rounded-3xl border border-border">
            Chưa có nhiệm vụ mới. Vui lòng quay lại sau!
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activeTasks.map((task, index) => (
              <TaskCard 
                 key={task.id} 
                 task={task} 
                 index={task._isJustCompleted ? 0 : index} 
                 isJustCompleted={task._isJustCompleted} 
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
       <Suspense fallback={<div className="h-[200px] w-full bg-muted/20 animate-pulse rounded-3xl"></div>}>
         <TasksContent />
       </Suspense>
    </div>
  );
}
