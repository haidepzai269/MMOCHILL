"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getNotifications() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return [];

    try {
        const res = await fetch(`${BACKEND_URL}/notifications/`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
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
