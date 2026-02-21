<?php
/**
 * SESSION ENFORCEMENT MIDDLEWARE - UIT Smart Waste Management
 *
 * Two modes:
 *   1. Standalone GET: Returns { loggedIn: true/false, user?: {...} }
 *   2. Included by other scripts: Provides requireRole() function
 *
 * Role Constants:
 *   Student  = 'student'
 *   Teacher  = 'teacher'
 *   Collector = 'collector'
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ========== CORS HEADERS ==========
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ========== ROLE ENFORCEMENT FUNCTION ==========

/**
 * Verifies that the current session user has one of the allowed roles.
 * If not logged in or role mismatch, returns 403 JSON and exits.
 *
 * @param array $uit_allowed_roles  e.g. ['student', 'teacher']
 * @return array  The current user's session data
 */
function requireRole(array $uit_allowed_roles): array {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error"   => "Unauthorized. Please log in first."
        ]);
        exit;
    }

    $uit_user_role = $_SESSION['user_role'];

    if (!in_array($uit_user_role, $uit_allowed_roles)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "error"   => "Access denied. Role '{$uit_user_role}' is not allowed for this action."
        ]);
        exit;
    }

    return [
        "id"    => $_SESSION['user_id'],
        "name"  => $_SESSION['user_name'],
        "email" => $_SESSION['user_email'],
        "role"  => $_SESSION['user_role']
    ];
}

// ========== STANDALONE MODE (direct GET request) ==========
// Only output JSON if this script is called directly (not included)
if (basename($_SERVER['SCRIPT_FILENAME']) === 'session_check.php') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "loggedIn" => true,
            "user" => [
                "id"    => $_SESSION['user_id'],
                "name"  => $_SESSION['user_name'],
                "email" => $_SESSION['user_email'],
                "role"  => $_SESSION['user_role']
            ]
        ]);
    } else {
        echo json_encode(["loggedIn" => false]);
    }
}
?>
