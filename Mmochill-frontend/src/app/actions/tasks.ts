"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export type TaskStatus = "active" | "inactive";

export interface DatabaseTask {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  type: string;
  target_url: string; // Map to original_url in backend
  status: TaskStatus;
  time_requirement: number;
  is_completed: boolean;
}

export async function getActiveTasks(): Promise<DatabaseTask[]> {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${BACKEND_URL}/tasks/active`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("Fetch active tasks failed:", res.status);
            return [];
        }
        const data = await res.json();
        console.log("Active tasks data from backend:", data);
        // Map backend original_url to frontend target_url
        return data.map((t: any) => ({
            ...t,
            reward_amount: t.reward,
            target_url: t.original_url,
            time_requirement: t.min_time_seconds,
            status: t.is_active ? "active" : "inactive"
        }));
    } catch (error) {
        console.error("Failed to fetch active tasks:", error);
        return [];
    }
}

export async function getTaskById(id: string): Promise<DatabaseTask | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return null;

    try {
        const res = await fetch(`${BACKEND_URL}/tasks/${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (res.status === 403) {
            const data = await res.json();
            if (data.is_completed) {
                return {
                    id,
                    title: "Nhiệm vụ đã hoàn thành",
                    description: "Bạn đã hoàn thành nhiệm vụ này trước đó.",
                    reward_amount: 0,
                    type: "completed",
                    target_url: "",
                    status: "inactive",
                    time_requirement: 0,
                    is_completed: true
                };
            }
        }

        if (!res.ok) {
            console.error("Fetch failed with status:", res.status);
            return null;
        }
        const task = await res.json();
        
        return {
            ...task,
            reward_amount: task.reward,
            target_url: task.original_url,
            time_requirement: task.min_time_seconds,
            status: task.is_active ? "active" : "inactive",
            is_completed: false
        };
    } catch (error) {
        console.error("Failed to fetch task by id:", error);
        return null;
    }
}

export async function getTasks(): Promise<DatabaseTask[]> {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    const adminMockToken = cookieStore.get("admin_token")?.value;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminMockToken === "demo_admin_token") headers["X-Admin-Token"] = "mmochill-admin-2026";

    try {
        const res = await fetch(`${BACKEND_URL}/admin/tasks`, {
            headers,
            cache: 'no-store'
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.map((t: any) => ({
            ...t,
            reward_amount: t.reward,
            target_url: t.original_url,
            time_requirement: t.min_time_seconds,
            status: t.is_active ? "active" : "inactive"
        }));
    } catch (error) {
        console.error("Failed to fetch all tasks:", error);
        return [];
    }
}

export async function addTask(formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    const adminMockToken = cookieStore.get("admin_token")?.value;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminMockToken === "demo_admin_token") headers["X-Admin-Token"] = "mmochill-admin-2026";

    if (!token && !adminMockToken) return { success: false, error: "Unauthorized" };

    const payload = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || "",
        reward: parseInt(formData.get("reward_amount") as string),
        original_url: formData.get("target_url") as string,
        min_time_seconds: parseInt(formData.get("time_requirement") as string),
        type: formData.get("type") as string || "surf",
        provider: "manual",
        max_completions: -1,
        is_active: formData.get("status") === "active"
    };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/tasks`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error || "Failed to create task" };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTask(id: string, formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    const adminMockToken = cookieStore.get("admin_token")?.value;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminMockToken === "demo_admin_token") headers["X-Admin-Token"] = "mmochill-admin-2026";

    const payload = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || "",
        reward: parseInt(formData.get("reward_amount") as string),
        original_url: formData.get("target_url") as string,
        min_time_seconds: parseInt(formData.get("time_requirement") as string),
        type: formData.get("type") as string || "surf",
        provider: "manual",
        max_completions: -1,
        is_active: formData.get("status") === "active"
    };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/tasks/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error || "Failed to update task" };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteTask(id: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    const adminMockToken = cookieStore.get("admin_token")?.value;

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminMockToken === "demo_admin_token") headers["X-Admin-Token"] = "mmochill-admin-2026";

    try {
        const res = await fetch(`${BACKEND_URL}/admin/tasks/${id}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error || "Failed to delete task" };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTaskStatus(id: string, currentStatus: TaskStatus) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    const adminMockToken = cookieStore.get("admin_token")?.value;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (adminMockToken === "demo_admin_token") headers["X-Admin-Token"] = "mmochill-admin-2026";

    try {
        const res = await fetch(`${BACKEND_URL}/admin/tasks/${id}/toggle`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ is_active: currentStatus !== "active" })
        });

        if (!res.ok) {
            const data = await res.json();
            return { success: false, error: data.error || "Failed to toggle status" };
        }

        const data = await res.json();
        return { success: true, newStatus: currentStatus === "active" ? "inactive" : "active" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function claimTask(taskId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${BACKEND_URL}/tasks/${taskId}/claim`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || "Failed to claim task" };

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
