"use server";

import { db } from "@/lib/db";

export async function getLiveReportCount() {
  try {
    // Counts every row in the reports table that hasn't been cleaned yet
    const [rows]: any = await db.execute(
      "SELECT COUNT(*) as total FROM reports WHERE status = 'pending'"
    );

    return {
      success: true,
      count: rows[0].total || 0,
    };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, count: 0 };
  }
}

// Bin Management Queue
export async function getLiveBins() {
  try {
    const [rows]: any = await db.execute(`
      SELECT 
        MIN(id) as id, 
        building, 
        level, 
        side, 
        COUNT(*) as reports, 
        status, 
        MAX(created_at) as lastUpdated 
      FROM reports 
      WHERE (status = 'pending' OR status = 'Pending') OR (status = 'Cleared' AND DATE(created_at) = CURRENT_DATE)
      GROUP BY building, level, side, status
      ORDER BY status DESC, lastUpdated DESC
    `);
    return { success: true, data: rows };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

// 2. Delete reports when bin is emptied
// export async function markBinEmpty(building: string, level: string, side: string) {
//   try {
//     await db.execute(
//       "DELETE FROM reports WHERE building = ? AND level = ? AND side = ?",
//       [building, level, side]
//     );
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { success: false };
//   }
// }


// Mark as Empty: Deletes from 'reports' and adds to 'collections'
export async function markBinEmpty(building: string, level: string, side: string) {
  console.log(`markBinEmpty CALLED with building: ${building}, level: ${level}, side: ${side}`);
  try {
    // 1. Update the status to 'Cleared' so users can see it in their history
    const [result]: any = await db.execute(
      "UPDATE reports SET status = 'Cleared' WHERE building = ? AND level = ? AND side = ? AND (status = 'Pending' OR status = 'pending')",
      [building, level, side]
    );

    console.log("UPDATE result affectedRows:", result?.affectedRows);

    if (result?.affectedRows > 0) {
      // 2. Add to history for "Today's Collections" count
      await db.execute(
        "INSERT INTO collections (building, level, side) VALUES (?, ?, ?)",
        [building, level, side]
      );
    } else {
      console.warn("WARNING: No rows updated. Query parameters might not match any pending reports.");
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking bin as empty:", error);
    return { success: false };
  }
}


// Fetch count for the current calendar day only
export async function getCollectionCount() {
  try {
    const [rows]: any = await db.execute(
      "SELECT COUNT(*) as total FROM collections WHERE DATE(cleaned_at) = CURRENT_DATE"
    );

    // When the day changes, CURRENT_DATE changes, and this returns 0 automatically
    return {
      success: true,
      count: rows[0].total || 0
    };
  } catch (error) {
    console.error("Error fetching collections:", error);
    return { success: false, count: 0 };
  }
}

