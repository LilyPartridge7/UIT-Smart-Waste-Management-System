<?php
/**
 * GEOSPATIAL API - Software Intelligence
 * UIT Smart Waste Management System
 *
 * Server-side implementation of the Haversine Formula.
 *
 * Input:  GET ?lat=16.852&lng=96.123
 * Output: Distances to Buildings 1-4 and Canteen, sorted nearest-first.
 *         Identifies the "Nearest Bin" location.
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

// Any logged-in user can query
$uit_current_user = requireRole(['student', 'teacher', 'collector']);

// ========== INPUT VALIDATION ==========
$uit_user_lat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
$uit_user_lng = isset($_GET['lng']) ? (float)$_GET['lng'] : null;

if ($uit_user_lat === null || $uit_user_lng === null) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Latitude (lat) and Longitude (lng) are required."]);
    exit;
}

// Validate coordinate ranges
if ($uit_user_lat < -90 || $uit_user_lat > 90 || $uit_user_lng < -180 || $uit_user_lng > 180) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180."]);
    exit;
}

// ========== UIT HLAING CAMPUS CENTER POINTS ==========
// Approximate GPS coordinates for UIT campus landmarks
$uit_campus_landmarks = [
    [
        "name"        => "Building 1",
        "building_id" => 1,
        "lat"         => 16.8517,
        "lng"         => 96.1227,
        "description" => "Main Administrative Building"
    ],
    [
        "name"        => "Building 2",
        "building_id" => 2,
        "lat"         => 16.8520,
        "lng"         => 96.1230,
        "description" => "Student Affairs & Exams"
    ],
    [
        "name"        => "Building 3",
        "building_id" => 3,
        "lat"         => 16.8523,
        "lng"         => 96.1233,
        "description" => "Library & Lecture Halls"
    ],
    [
        "name"        => "Building 4",
        "building_id" => 4,
        "lat"         => 16.8526,
        "lng"         => 96.1236,
        "description" => "Computer Labs & IT"
    ],
    [
        "name"        => "UIT Canteen",
        "building_id" => null,
        "lat"         => 16.8514,
        "lng"         => 96.1225,
        "description" => "Main Canteen (Basement area)"
    ],
];

// ========== HAVERSINE FORMULA ==========
/**
 * Calculate the great-circle distance between two GPS points.
 *
 * @param float $uit_lat1  Latitude of point 1 (degrees)
 * @param float $uit_lng1  Longitude of point 1 (degrees)
 * @param float $uit_lat2  Latitude of point 2 (degrees)
 * @param float $uit_lng2  Longitude of point 2 (degrees)
 * @return float           Distance in meters
 */
function haversine_distance(float $uit_lat1, float $uit_lng1, float $uit_lat2, float $uit_lng2): float {
    $EARTH_RADIUS_METERS = 6371000; // Earth's radius in meters

    // Convert degrees to radians
    $uit_lat1_rad = deg2rad($uit_lat1);
    $uit_lat2_rad = deg2rad($uit_lat2);
    $uit_dlat     = deg2rad($uit_lat2 - $uit_lat1);
    $uit_dlng     = deg2rad($uit_lng2 - $uit_lng1);

    // Haversine formula
    $uit_a = sin($uit_dlat / 2) * sin($uit_dlat / 2) +
             cos($uit_lat1_rad) * cos($uit_lat2_rad) *
             sin($uit_dlng / 2) * sin($uit_dlng / 2);

    $uit_c = 2 * atan2(sqrt($uit_a), sqrt(1 - $uit_a));

    return $EARTH_RADIUS_METERS * $uit_c;
}

// ========== CALCULATE DISTANCES ==========
$uit_results = [];

foreach ($uit_campus_landmarks as $uit_landmark) {
    $uit_distance_m = haversine_distance(
        $uit_user_lat, $uit_user_lng,
        $uit_landmark['lat'], $uit_landmark['lng']
    );

    $uit_results[] = [
        "name"         => $uit_landmark['name'],
        "building_id"  => $uit_landmark['building_id'],
        "description"  => $uit_landmark['description'],
        "distance_m"   => round($uit_distance_m, 2),
        "distance_km"  => round($uit_distance_m / 1000, 3),
        "lat"          => $uit_landmark['lat'],
        "lng"          => $uit_landmark['lng'],
    ];
}

// Sort by distance (nearest first)
usort($uit_results, fn($a, $b) => $a['distance_m'] <=> $b['distance_m']);

// ========== FIND NEAREST BIN ==========
$uit_nearest_building = $uit_results[0];
$uit_nearest_bin = null;

if ($uit_nearest_building['building_id']) {
    $uit_bin_stmt = $pdo->prepare("
        SELECT id, building_id, level, side, room_code, status
        FROM bins
        WHERE building_id = :bldg AND status != 'full'
        ORDER BY level ASC
        LIMIT 1
    ");
    $uit_bin_stmt->execute([':bldg' => $uit_nearest_building['building_id']]);
    $uit_nearest_bin = $uit_bin_stmt->fetch();
}

// ========== RESPONSE ==========
echo json_encode([
    "success"         => true,
    "user_location"   => ["lat" => $uit_user_lat, "lng" => $uit_user_lng],
    "distances"       => $uit_results,
    "nearest_bin"     => $uit_nearest_bin,
    "nearest_building"=> $uit_nearest_building['name'],
]);
?>
