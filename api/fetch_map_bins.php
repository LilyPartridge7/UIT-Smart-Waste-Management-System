<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// deal with prep stuff (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php'; 

// Grab bins and check if they're full based on reports.
// FYI: If no lat/lng, they won't show up on the map.
$sql = "SELECT b.id, b.lat, b.lng, b.building_id, b.level, 
        IF(COUNT(r.id) > 0, 'Full', 'Functional') as status 
        FROM bins b
        LEFT JOIN reports r 
          ON b.building_id = r.building 
         AND b.level = r.level 
         AND b.side = r.side 
         AND r.status = 'Pending'
        GROUP BY b.id";

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
