"use server";

import { db } from "@/lib/db";

export async function getTotalReportCount() {
  try {
    // We count the total rows in the reports table
    const [rows]: any = await db.execute("SELECT COUNT(*) as total FROM reports");
    
    // We also get today's count specifically
    const [todayRows]: any = await db.execute(
      "SELECT COUNT(*) as today FROM reports WHERE DATE(report_date) = CURDATE()"
    );

    return { 
      success: true, 
      total: rows[0].total || 0,
      today: todayRows[0].today || 0 
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return { success: false, total: 0, today: 0 };
  }
}