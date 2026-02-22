<?php
// database setup for the waste management app
// gives you both $conn (mysqli) and $pdo (PDO)

// detect environment
$is_localhost = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

// 1. Check if we are on Clever Cloud
if (getenv('MYSQL_ADDON_HOST')) {
    // These variables are injected automatically by Clever Cloud
    $DB_HOST = getenv('MYSQL_ADDON_HOST');
    $DB_USER = getenv('MYSQL_ADDON_USER');
    $DB_PASS = getenv('MYSQL_ADDON_PASSWORD');
    $DB_NAME = getenv('MYSQL_ADDON_DB');
    $DB_PORT = getenv('MYSQL_ADDON_PORT');
} 
// 2. Fallback to Local XAMPP
else {
    $DB_HOST = "localhost";
    $DB_USER = "root";
    $DB_PASS = ""; 
    $DB_NAME = "uit_waste_watch"; 
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

