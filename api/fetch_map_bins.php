<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php'; 

// Fetch the "bins" with lat/lng, simulating full status based on pending reports.
// Note: If no lat/lng exists in the bins table, they won't render. Make sure your bins table has lat/lng.
$sql = "SELECT b.id, b.lat, b.lng, 
        CASE 
            WHEN r.status = 'Pending' THEN 'Full' 
            ELSE 'Functional' 
        END as status 
        FROM bins b
        LEFT JOIN reports r ON b.location_id = r.location_id AND r.status = 'Pending'";

$result = $conn->query($sql);
$bins = [];

if ($result) {
    while($row = $result->fetch_assoc()) {
        $bins[] = $row;
    }
    echo json_encode(["success" => true, "bins" => $bins]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
?>
