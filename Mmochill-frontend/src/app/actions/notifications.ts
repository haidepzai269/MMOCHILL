"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getNotifications(page = 1, limit = 10) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { notifications: [], total: 0 };

    try {
        const res = await fetch(`${BACKEND_URL}/notifications/?page=${page}&limit=${limit}`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) return { notifications: [], total: 0 };
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { notifications: [], total: 0 };
    }
}

export async function markAsRead(id: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        });

        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllNotificationsAsRead() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false };

    try {
        const res = await fetch(`${BACKEND_URL}/notifications/read-all`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        });

        return { success: res.ok };
    } catch (error) {
        return { success: false };
    }
}

export async function getNotificationDetail(id: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return null;

    try {
        const res = await fetch(`${BACKEND_URL}/notifications/${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch notification detail:", error);
        return null;
    }
}
