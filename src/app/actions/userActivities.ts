"use server";

import { db } from "@/lib/db";

// Fetch reports submitted by a specific user
export async function getUserReports(email: string) {
    try {
        const [rows] = await db.execute(
            "SELECT id, building, level, side, status, created_at FROM reports WHERE user_email = ? ORDER BY created_at DESC",
            [email]
        );
        return { success: true, reports: rows };
    } catch (error) {
        console.error("Error fetching user reports:", error);
        return { success: false, error: "Failed to fetch reports" };
    }
}

// Fetch complaints submitted by a specific user
export async function getUserComplaints(email: string) {
    try {
        // Note: The complaint table stores multiple messages concatenated. 
        // We fetch the row corresponding to the user.
        // If you want to show 'requests', maybe we just show the latest status or the whole thread?
        // The prompt says: "what noti is in their complaint". likely "admin_response".
        const [rows]: any = await db.execute(
            "SELECT message, admin_response, status, report_date FROM complaint WHERE user_email = ?",
            [email]
        );

        // If multiple rows exist (though schema suggests unique email/day logic or valid email key), return them.
        return { success: true, complaints: rows };
    } catch (error) {
        console.error("Error fetching user complaints:", error);
        return { success: false, error: "Failed to fetch complaints" };
    }
}
