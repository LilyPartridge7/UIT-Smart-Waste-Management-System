<?php
/**
 * Database Configuration - UIT Smart Waste Management
 * Provides both $conn (mysqli) and $pdo (PDO) connections.
 */

$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "";
$DB_NAME = "db";
$DB_PORT = 3306;

// ========== MYSQLI CONNECTION (legacy, used by login/register) ==========
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "mysqli connection failed: " . $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// ========== PDO CONNECTION (used by all new backend modules) ==========
$dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Throw exceptions on error
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Return associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                    // Use real prepared statements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "PDO connection failed: " . $e->getMessage()]);
    exit;
}
?>
