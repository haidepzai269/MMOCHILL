"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Login failed" };
    }

    if (data.user.role !== "admin") {
      return { success: false, error: "Tài khoản không có quyền Admin!" };
    }

    const cookieStore = await cookies();
    // Lưu cùng lúc user_token (cho API chung) và admin_token (cho middleware admin)
    cookieStore.set("user_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("user_token_local", data.token, {
      httpOnly: false, // Để Client đọc được cho SSE
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    
    cookieStore.set("admin_token", "demo_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminBeginPasskeyLogin(email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/webauthn/login/begin?email=${encodeURIComponent(email)}`, {
      method: "POST",
    });
    if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error };
    }
    const options = await res.json();
    return { success: true, options };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminFinishPasskeyLogin(email: string, credential: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/webauthn/login/finish?email=${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
  
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Passkey login failed" };
      }
  
      const cookieStore = await cookies();
      cookieStore.set("user_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set("user_token_local", data.token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      
      cookieStore.set("admin_token", "demo_admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
      });
  
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

export async function adminBeginPasskeyRegistration() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/webauthn/register/begin`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error };
    }
    const options = await res.json();
    return { success: true, options };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminFinishPasskeyRegistration(credential: any) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return { success: false, error: "Unauthorized" };

    try {
      const res = await fetch(`${BACKEND_URL}/auth/webauthn/register/finish`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(credential),
      });
  
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Passkey registration failed" };
      }
  
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  cookieStore.delete("user_token_local");
  redirect("/admin/login");
}

export async function userLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Login failed" };
    }

    const data = await res.json();
    const cookieStore = await cookies();
    cookieStore.set("user_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.set("user_token_local", data.token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function userLogout() {
    const cookieStore = await cookies();
    cookieStore.delete("user_token");
    cookieStore.delete("user_token_local");
    redirect("/login");
}

export async function userRegister(formData: FormData, referredByCode?: string) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string || email.split('@')[0];
  const full_name = formData.get("full_name") as string || username;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        password, 
        username, 
        full_name,
        referred_by_code: referredByCode 
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Registration failed" };
    }

    const data = await res.json();
    const cookieStore = await cookies();
    cookieStore.set("user_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("user_token_local", data.token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}` 
      },
      next: { revalidate: 60 } // Cache for 1 min
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}
export async function updateProfile(fullName: string, avatarURL: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ full_name: fullName, avatar_url: avatarURL }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Update failed" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadAvatar(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/avatar-upload`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error || "Upload failed" };
    }

    const data = await res.json();
    return { success: true, url: data.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function forgotPassword(email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function changePassword(current: string, next: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function changeEmail(newEmail: string, password: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${BACKEND_URL}/auth/change-email`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ current_password: password, new_email: newEmail }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
