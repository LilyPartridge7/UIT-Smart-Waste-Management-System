<?php
/**
 * LOGIN API - UIT Smart Waste Management
 */

session_start();

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

$email        = trim($input['email'] ?? '');
$password     = $input['password'] ?? '';
$selectedRole = trim($input['role'] ?? '');

// ========== VALIDATION ==========
if (empty($email) || empty($password) || empty($selectedRole)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Email, password, and role are required."]);
    exit;
}

// ========== FIND USER BY EMAIL ==========
$stmt = $conn->prepare("SELECT id, name, email, password, role, identifier FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid email or password."]);
    $stmt->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// ========== VERIFY PASSWORD ==========
// password_verify() works with both PHP's password_hash() and Node's bcryptjs hashes
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid email or password."]);
    exit;
}

// ========== ROLE ENFORCEMENT ==========
// If user selected "student" but DB says "collector", REJECT the login
if ($user['role'] !== $selectedRole) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "error" => "Access denied. Your account is registered as \"{$user['role']}\", not \"{$selectedRole}\". Please select the correct role."
    ]);
    exit;
}

// ========== SUCCESS: CREATE SESSION ==========
$_SESSION['user_id']    = $user['id'];
$_SESSION['user_name']  = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role']  = $user['role'];

http_response_code(200);
echo json_encode([
    "success" => true,
    "user" => [
        "id"    => $user['id'],
        "name"  => $user['name'],
        "email" => $user['email'],
        "role"  => $user['role']
    ]
]);

$conn->close();
?>
