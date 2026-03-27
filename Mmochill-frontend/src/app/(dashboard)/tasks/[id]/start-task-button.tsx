"use client";

import { useState, useTransition } from "react";
import { claimTask } from "@/app/actions/tasks";
import { useLoading } from "@/lib/contexts/loading-context";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

export default function StartTaskButton({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const handleStart = () => {
    showLoading();
    startTransition(async () => {
      try {
        const result = await claimTask(taskId);
        if (result.success && result.data?.bypass_url) {
          toast.success("Đã tạo liên kết! Đang chuyển hướng...");
          window.open(result.data.bypass_url, "_blank");
        } else {
          toast.error(result.error || "Không thể khởi tạo nhiệm vụ");
        }
      } catch (err) {
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại sau.");
      } finally {
        hideLoading();
      }
    });
  };

  return (
    <button
      onClick={handleStart}
      disabled={isPending}
      className={`w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-4 rounded-2xl text-base font-black hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${
        isPending ? "cursor-wait" : ""
      }`}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Zap className="w-5 h-5 fill-current" />
      )}
      Bắt đầu vượt link ngay
    </button>
  );
}
