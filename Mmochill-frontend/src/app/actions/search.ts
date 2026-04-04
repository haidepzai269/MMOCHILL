"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function globalSearch(query: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { tasks: [], actions: [] };

  try {
    const res = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}` 
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) return { tasks: [], actions: [] };

    return await res.json();
  } catch (error) {
    console.error("Error searching:", error);
    return { tasks: [], actions: [] };
  }
}
