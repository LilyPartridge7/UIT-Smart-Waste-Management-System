<?php
// database setup for the waste management app
// gives you both $conn (mysqli) and $pdo (PDO)

// detect environment
$is_localhost = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

if ($is_localhost) {
    $DB_HOST = "localhost";
    $DB_USER = "root";
    $DB_PASS = "";
    $DB_NAME = "db";
    $DB_PORT = 3306;
} else {
    // CLOUD / PRODUCTION SETTINGS
    $DB_HOST = "your_cloud_host";
    $DB_USER = "your_cloud_user";
    $DB_PASS = "your_cloud_password";
    $DB_NAME = "your_cloud_dbname";
    $DB_PORT = 3306;
}

// MYSQLI (old school, used for login/register)
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "mysqli connection failed: " . $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// PDO (for all the newer stuff)
$dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // throw errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // return arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                    // keep it secure
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "PDO connection failed: " . $e->getMessage()]);
    exit;
}
?>
