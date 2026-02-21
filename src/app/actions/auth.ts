"use server"; // This tells Next.js: "Run this code ONLY on the server"

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function registerUser(values: any, role: string) {
  try {
    // 1. Encrypt the password so it's not readable in the DB
    const hashedPassword = await bcrypt.hash(values.password, 10);

    // 2. Extract the specific ID based on the user's role
    // This matches the "identifier" column we'll use in phpMyAdmin
    let identifier = "";
    if (role === 'student') identifier = values.rollNumber;
    else if (role === 'teacher') identifier = values.faculty;
    else if (role === 'collector') identifier = values.staffId;

    // 3. Execute the SQL Query
    // We use '?' placeholders to prevent SQL Injection attacks (Security best practice)
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, role, identifier) VALUES (?, ?, ?, ?, ?)",
      [
        values.name,
        values.email,
        hashedPassword,
        role,
        identifier
      ]
    );

    // return { success: true };
    return {
      success: true,
      user: {
        name: values.name,
        email: values.email,
        role: role
      }
    };

  } catch (error: any) {
    console.error("Database Error:", error);

    // Handle common MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "This email is already registered." };
    }

    return { success: false, error: "Something went wrong with the database connection." };
  }
}



// check login 
export async function loginUser(values: any, selectedRole: string) {
  try {
    // 1. Find the user by email
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [values.email]
    );

    const user = rows[0];

    // 2. Check if user exists
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    // 3. Compare the provided password with the hashed password in DB
    const isPasswordValid = await bcrypt.compare(values.password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password." };
    }

    // 4. ROLE ENFORCEMENT: Reject if selected role doesn't match DB role
    if (user.role !== selectedRole) {
      return {
        success: false,
        error: `Access denied. Your account is registered as "${user.role}", not "${selectedRole}". Please select the correct role.`
      };
    }

    // 5. Return success and user info (excluding password)
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: "Database connection failed." };
  }
}


