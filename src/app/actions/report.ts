"use server";

import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function submitReport(formData: FormData) {
  try {
    const building = formData.get("building") as string;
    const level = formData.get("level") as string;
    const side = formData.get("side") as string;
    const userEmail = formData.get("email") as string; // NEW
    const file = formData.get("image") as File | null;

    let imageUrl = "";

    if (file && file.size > 0) {
      // 1. Create a unique filename
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name}`;

      // 2. Save to the 'public/uploads' folder
      const path = join(process.cwd(), "public/uploads", filename);
      await writeFile(path, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    // 3. Insert path into Database
    await db.execute(
      "INSERT INTO reports (building, level, side, image_url, user_email) VALUES (?, ?, ?, ?, ?)",
      [building, level, side, imageUrl, userEmail]
    );

    return { success: true };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: "Failed to save report." };
  }
}