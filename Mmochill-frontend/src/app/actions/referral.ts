"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getReferralStats() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/referral`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}` 
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Failed to fetch stats" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching referral stats:", error);
    return { success: false, error: error.message };
  }
}
