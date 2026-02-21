// "use server";

// import { db } from "@/lib/db";
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";
// import { existsSync } from "fs";

// export async function submitComplaintMessage(formData: FormData) {
//   try {
//     const newMessage = formData.get("message") as string;
//     const userEmail = formData.get("email") as string;
//     const file = formData.get("image") as File | null;

//     let newImageUrl = "";

//     // 1. Handle Image Upload
//     if (file && file.size > 0) {
//       const uploadDir = join(process.cwd(), "public", "uploads", "complaints");
//       if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

//       // --- THE FIX IS HERE ---
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes); // Defined the buffer variable
//       // -----------------------

//       const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
//       const path = join(uploadDir, filename);

//       await writeFile(path, buffer);
//       newImageUrl = `/uploads/complaints/${filename}`;
//     }

//     // 2. The "Append" Logic (One Row per Gmail)
//     // await db.execute(
//     //   `INSERT INTO complaints (user_email, message, image_url) 
//     //    VALUES (?, ?, ?) 
//     //    ON DUPLICATE KEY UPDATE 
//     //    message = CONCAT(message, '\n---\n', VALUES(message)),
//     //    image_url = IF(VALUES(image_url) != '', 
//     //                   IF(image_url IS NULL OR image_url = '', 
//     //                      VALUES(image_url), 
//     //                      CONCAT_WS(',', image_url, VALUES(image_url))), 
//     //                   image_url)`,
//     //   [userEmail, newMessage, newImageUrl]
//     // );


//     return { success: true, imageUrl: newImageUrl };
//   } catch (error) {
//     console.error("Complaint Error:", error);
//     return { success: false, error: "Database update failed" };
//   }
// }






"use server";

import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function submitComplaintMessage(formData: FormData) {
  try {
    const newMessage = formData.get("message") as string;
    const userEmail = formData.get("email") as string;
    const file = formData.get("image") as File | null;

    let newImageUrl = "";

    // 1. Handle Image Upload
    if (file && file.size > 0) {
      const uploadDir = join(process.cwd(), "public", "uploads", "complaints");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(uploadDir, filename);

      await writeFile(path, buffer);
      newImageUrl = `/uploads/complaints/${filename}`;
    }

    // 2. The Logic: One Row per Gmail per Day
    // We use CURRENT_DATE for the report_date column
    await db.execute(
      `INSERT INTO complaint (user_email, message, image_url, report_date) 
       VALUES (?, ?, ?, CURRENT_DATE) 
       ON DUPLICATE KEY UPDATE 
       message = CONCAT(message, '\n', VALUES(message)),
       image_url = IF(VALUES(image_url) != '', 
                     IF(image_url IS NULL OR image_url = '', 
                        VALUES(image_url), 
                        CONCAT_WS(',', image_url, VALUES(image_url))), 
                     image_url)`,
      [userEmail, newMessage, newImageUrl]
    );

    return { success: true, imageUrl: newImageUrl };
  } catch (error) {
    console.error("Complaint Error:", error);
    return { success: false, error: "Database update failed" };
  }
}