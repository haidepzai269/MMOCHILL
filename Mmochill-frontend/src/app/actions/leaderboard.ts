"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getLeaderboardData() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { top_users: [] };

    try {
        const res = await fetch(`${BACKEND_URL}/leaderboard`, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("Fetch leaderboard failed:", res.status);
            return { top_users: [] };
        }
        
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return { top_users: [] };
    }
}
