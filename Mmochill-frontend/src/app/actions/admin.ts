"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getAdminStats() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return null;

    try {
        const res = await fetch(`${BACKEND_URL}/admin/stats`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            },
            cache: 'no-store'
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return null;
    }
}

export async function getAdminUsers(page = 1, limit = 10, search = "") {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { users: [], total: 0 };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/users?page=${page}&limit=${limit}&search=${search}`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            },
            cache: 'no-store'
        });

        if (!res.ok) return { users: [], total: 0 };
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch admin users:", error);
        return { users: [], total: 0 };
    }
}

export async function banUser(userId: string, action: "ban" | "unban") {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/users/${userId}/ban`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action })
        });

        console.log(`[AdminAction] banUser status: ${res.status} ${res.statusText}`);
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`[AdminAction] banUser error details:`, errorData);
            return { success: false, error: errorData.error || "Request failed" };
        }

        return { success: true };
    } catch (error) {
        console.error(`[AdminAction] banUser fetch exception:`, error);
        return { success: false, error: "Network or server error" };
    }
}

export async function getAdminWithdrawals(status = "") {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${BACKEND_URL}/admin/withdrawals?status=${status}`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            },
            cache: 'no-store'
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch admin withdrawals:", error);
        return [];
    }
}

export async function approveWithdrawal(id: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/withdrawals/${id}/approve`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            }
        });
        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}

export async function rejectWithdrawal(id: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/withdrawals/${id}/reject`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            }
        });
        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}

export async function sendGlobalNotification(req: { title: string; message: string; type?: string; category?: string }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/notifications/global`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req)
        });

        const data = await res.json();
        return { success: res.ok, error: data.error };
    } catch (error) {
        return { success: false, error: "Internal Server Error" };
    }
}

export async function getSentNotifications() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${BACKEND_URL}/admin/notifications`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            },
            cache: 'no-store'
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch sent notifications:", error);
        return [];
    }
}

export async function deleteNotification(id?: string, groupId?: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const queryParams = new URLSearchParams();
        if (id) queryParams.set("id", id);
        if (groupId) queryParams.set("group_id", groupId);

        const res = await fetch(`${BACKEND_URL}/admin/notifications?${queryParams.toString()}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026"
            }
        });

        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}

export async function bulkDeleteNotifications(req: { ids?: string[], group_ids?: string[] }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/admin/notifications/bulk-delete`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "X-Admin-Token": "mmochill-admin-2026",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req)
        });

        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}
