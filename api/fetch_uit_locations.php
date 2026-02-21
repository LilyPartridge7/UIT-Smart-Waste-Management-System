<?php
/**
 * FETCH UIT LOCATIONS - Room Suggestion Engine
 * UIT Smart Waste Management System
 *
 * Input:  GET ?building_id=3&level=4
 * Output: JSON with room suggestions using X-Notation rules
 *
 * X-Notation Rule:
 *   Levels 3-6: Front = "X[Level]2", Behind = "X[Level]5"
 *   Example: Building 3, Level 4 → Front: Room 342, Behind: Room 345
 *
 * Exceptions:
 *   Building 1 or 2, Level 2 → "Theatre Entry Corridor"
 *   Any Building, Level 1    → Landmarks (Student Affairs, Library, etc.)
 *   Any Building, Basement   → Canteen & Parking
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

// Any logged-in user can query locations
$uit_current_user = requireRole(['student', 'teacher', 'collector']);

// ========== VALIDATE INPUT ==========
$uit_bldg_no = isset($_GET['building_id']) ? (int)$_GET['building_id'] : 0;
$uit_level   = isset($_GET['level']) ? strtolower(trim($_GET['level'])) : '';

if ($uit_bldg_no < 1 || $uit_bldg_no > 4) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid building_id. Must be 1-4."]);
    exit;
}

$uit_valid_levels = ['basement', '1', '2', '3', '4', '5', '6'];
if (!in_array($uit_level, $uit_valid_levels)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid level. Must be: basement, 1-6."]);
    exit;
}

// ========== LOCATION LOGIC ==========

$uit_locations = [];

// --- BASEMENT ---
if ($uit_level === 'basement') {
    $uit_locations = [
        ["name" => "Canteen",  "type" => "landmark", "room_code" => null, "side" => "corridor"],
        ["name" => "Parking",  "type" => "landmark", "room_code" => null, "side" => "corridor"],
    ];
}

// --- LEVEL 1 (Ground Floor): Specific landmarks per building ---
elseif ($uit_level === '1') {
    $uit_ground_floor_landmarks = [
        1 => [
            ["name" => "Main Entrance Hall",      "type" => "landmark"],
            ["name" => "Reception & Info Desk",    "type" => "landmark"],
        ],
        2 => [
            ["name" => "Student Affairs Office",   "type" => "landmark"],
            ["name" => "Exam Office",              "type" => "landmark"],
        ],
        3 => [
            ["name" => "Library",                  "type" => "landmark"],
            ["name" => "Reading Room Entrance",    "type" => "landmark"],
        ],
        4 => [
            ["name" => "Computer Lab Entrance",    "type" => "landmark"],
            ["name" => "IT Support Office",        "type" => "landmark"],
        ],
    ];

    $uit_locations = $uit_ground_floor_landmarks[$uit_bldg_no] ?? [];

    // Add common bin location
    foreach ($uit_locations as &$loc) {
        $loc["room_code"] = null;
        $loc["side"]      = "front";
    }
    unset($loc);
}

// --- LEVEL 2: Theatre Exception for Buildings 1 & 2 ---
elseif ($uit_level === '2') {
    $theatre_floor_exception = ($uit_bldg_no === 1 || $uit_bldg_no === 2);

    if ($theatre_floor_exception) {
        $uit_locations = [
            [
                "name"      => "Theatre Entry Corridor",
                "type"      => "exception",
                "room_code" => null,
                "side"      => "corridor",
                "note"      => "Buildings 1 & 2 Level 2 share a theatre corridor layout.",
            ],
        ];
    } else {
        // Standard X-Notation for Bldg 3-4 Level 2
        $uit_front_room  = "{$uit_bldg_no}22";
        $uit_behind_room = "{$uit_bldg_no}25";

        $uit_locations = [
            ["name" => "Room {$uit_front_room} (Front)",   "type" => "room", "room_code" => $uit_front_room,  "side" => "front"],
            ["name" => "Room {$uit_behind_room} (Behind)", "type" => "room", "room_code" => $uit_behind_room, "side" => "behind"],
        ];
    }
}

// --- LEVELS 3-6: Standard X-Notation ---
else {
    $uit_front_room  = "{$uit_bldg_no}{$uit_level}2";
    $uit_behind_room = "{$uit_bldg_no}{$uit_level}5";

    $uit_locations = [
        ["name" => "Room {$uit_front_room} (Front)",   "type" => "room", "room_code" => $uit_front_room,  "side" => "front"],
        ["name" => "Room {$uit_behind_room} (Behind)", "type" => "room", "room_code" => $uit_behind_room, "side" => "behind"],
    ];
}

// ========== FETCH MATCHING BINS FROM DATABASE ==========
$uit_bin_stmt = $pdo->prepare(
    "SELECT id, room_code, status, side FROM bins WHERE building_id = :bldg AND level = :lvl"
);
$uit_bin_stmt->execute([':bldg' => $uit_bldg_no, ':lvl' => $uit_level]);
$uit_bins = $uit_bin_stmt->fetchAll();

// ========== RESPONSE ==========
echo json_encode([
    "success"     => true,
    "building_id" => $uit_bldg_no,
    "level"       => $uit_level,
    "locations"   => $uit_locations,
    "bins"        => $uit_bins,
]);
?>
