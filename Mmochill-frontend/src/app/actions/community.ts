"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function postComment(content: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Bạn cần đăng nhập để bình luận" };

  try {
    const res = await fetch(`${BACKEND_URL}/community/comments`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Gửi bình luận thất bại" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminDeleteComment(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/admin/community/comments/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Xóa thất bại" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminAddBotComment(username: string, avatarURL: string, content: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value || cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/admin/community/comments/bot`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, avatar_url: avatarURL, content })
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Thêm bot thất bại" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

