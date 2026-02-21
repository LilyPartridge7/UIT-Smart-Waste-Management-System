<?php
/**
 * CHANGE PASSWORD API - UIT Smart Waste Management
 * 
 * Accepts POST with JSON body:
 *   { user_id, current_password, new_password }
 * 
 * - Verifies current_password
 * - Updates database with hashed new_password
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

require_once __DIR__ . '/db_config.php';

// Read JSON body
$input = json_decode(file_get_contents("php://input"), true);

$user_id = trim($input['user_id'] ?? '');
$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';

// Check required fields
if (empty($user_id) || empty($current_password) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "All fields (user_id, current_password, new_password) are required."]);
    exit;
}

// ========== NEW PASSWORD REGEX VALIDATION ==========
// Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
$passwordRegex = '/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\'":\\|,.<>\/?`~]).{8,}$/';

if (!preg_match($passwordRegex, $new_password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "New password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character."
    ]);
    exit;
}

// ========== VERIFY CURRENT PASSWORD ==========
$stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "User not found."]);
    $stmt->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($current_password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Incorrect current password."]);
    exit;
}

// ========== HASH AND UPDATE PASSWORD ==========
$hashedPassword = password_hash($new_password, PASSWORD_BCRYPT);

$updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
$updateStmt->bind_param("ss", $hashedPassword, $user_id);

if ($updateStmt->execute()) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Password successfully updated."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: Failed to update password."]);
}

$updateStmt->close();
$conn->close();
?>
