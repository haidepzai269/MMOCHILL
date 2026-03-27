"use client";

import { CheckSquare } from "lucide-react";
import { getActiveTasks } from "@/app/actions/tasks";
import TaskCard from "./task-card";
import { useEffect, useState } from "react";
import { useLoading } from "@/lib/contexts/loading-context";

export default function TasksPage() {
  const { showLoading, hideLoading } = useLoading();
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    const res = await getActiveTasks();
    if (res) setActiveTasks(res);
  };

  useEffect(() => {
    const init = async () => {
      showLoading();
      await fetchTasks();
      hideLoading();
    };
    init();

    // SSE Real-time task updates
    const token = document.cookie.split('; ').find(row => row.startsWith('user_token_local='))?.split('=')[1];
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/stream?token=${token}`);

    eventSource.addEventListener("tasks_update", (event) => {
      fetchTasks();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10" />
         <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <CheckSquare className="w-6 h-6" /> Task Center
            </h1>
            <p className="text-indigo-50 text-sm max-w-sm">
              Complete the tasks below to earn rewards. Click a task to open it in a new tab. Anti-cheat timers are enabled.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto w-full">
        {activeTasks.length === 0 ? (
          <div className="col-span-1 sm:grid-cols-2 text-center py-12 text-muted-foreground bg-card rounded-3xl border border-border">
            No active tasks at the moment. Please check back later!
          </div>
        ) : (
          activeTasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
