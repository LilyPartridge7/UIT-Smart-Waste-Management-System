<?php
// session management helper
// can be used as a standalone check OR included in other files

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CORS stuff
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// makes sure the user has the right role
// checks if user has one of the allowed roles
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

// if this file is called directly, just return the session info
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
