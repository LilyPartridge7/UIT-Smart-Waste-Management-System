"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getLiveComplaints() {
  try {
    // This selects every row. One row = One card.
    // const [rows]: any = await db.execute("SELECT * FROM complaint");
    const [rows]: any = await db.execute(`
      SELECT 
        id,
        status,
        admin_response,
        user_email, 
        message, 
        image_url, 
        DATE_FORMAT(CONVERT_TZ(report_date, '+00:00', '+06:30'), '%Y-%m-%d') as report_date 
      FROM complaint
      ORDER BY report_date DESC
    `);

    // We stringify the data to ensure the Date objects from MySQL don't disappear
    return {
      success: true,
      data: JSON.parse(JSON.stringify(rows))
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, data: [] };
  }
}

export async function deleteComplaint(email: string, date: string) {
  try {
    // Delete using the composite key (Email + Date)
    await db.execute(
      "DELETE FROM complaint WHERE user_email = ? AND report_date = ?",
      [email, date]
    );
    revalidatePath("/dashboard/alerts");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getUnrepliedComplaintsCount() {
  try {
    const [rows]: any = await db.execute(
      "SELECT COUNT(*) as count FROM complaint WHERE admin_response IS NULL OR admin_response = ''"
    );
    return { success: true, count: rows[0].count };
  } catch (error) {
    console.error("Error fetching unreplied count:", error);
    return { success: false, count: 0 };
  }
}