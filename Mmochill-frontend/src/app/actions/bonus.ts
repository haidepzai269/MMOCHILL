"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function getBonusStatus() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/bonus/status`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Failed to fetch bonus status" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/bonus/check-in`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Check-in failed" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function spinLuckyWheel() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/bonus/spin`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Spin failed" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
