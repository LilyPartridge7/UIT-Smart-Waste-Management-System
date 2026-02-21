<?php
/**
 * REGISTER API - UIT Smart Waste Management
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

// Extract fields
$name       = trim($input['name'] ?? '');
$email      = trim($input['email'] ?? '');
$password   = $input['password'] ?? '';
$role       = trim($input['role'] ?? '');
$identifier = trim($input['identifier'] ?? '');

// ========== VALIDATION ==========

// Check required fields
if (empty($name) || empty($email) || empty($password) || empty($role)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "All fields are required."]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid email address."]);
    exit;
}

// Validate role
$allowedRoles = ['student', 'teacher', 'collector'];
if (!in_array($role, $allowedRoles)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid role selected."]);
    exit;
}

// ========== PASSWORD REGEX VALIDATION ==========
// Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
$passwordRegex = '/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\'":\\|,.<>\/?`~]).{8,}$/';

if (!preg_match($passwordRegex, $password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character."
    ]);
    exit;
}

// ========== CHECK FOR DUPLICATE EMAIL ==========
$checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["success" => false, "error" => "This email is already registered."]);
    $checkStmt->close();
    exit;
}
$checkStmt->close();

// ========== HASH PASSWORD & INSERT ==========
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$insertStmt = $conn->prepare(
    "INSERT INTO users (name, email, password, role, identifier, created_at) VALUES (?, ?, ?, ?, ?, NOW())"
);
$insertStmt->bind_param("sssss", $name, $email, $hashedPassword, $role, $identifier);

if ($insertStmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "success" => true,
        "user" => [
            "id"    => $insertStmt->insert_id,
            "name"  => $name,
            "email" => $email,
            "role"  => $role
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Registration failed: " . $insertStmt->error]);
}

$insertStmt->close();
$conn->close();
?>
