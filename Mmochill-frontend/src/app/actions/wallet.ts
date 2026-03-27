"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1";

export async function requestWithdrawal(formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    const amount = parseInt(formData.get("amount") as string);
    const method = formData.get("method") as string;
    const bank_name = formData.get("bank_name") as string;
    const account_number = formData.get("account_number") as string;
    const account_name = formData.get("account_name") as string;

    try {
        const res = await fetch(`${BACKEND_URL}/withdrawals`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                amount, 
                method,
                bank_name,
                account_number,
                account_name
            })
        });

        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || "Withdrawal failed" };

        return { success: true, message: data.message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
