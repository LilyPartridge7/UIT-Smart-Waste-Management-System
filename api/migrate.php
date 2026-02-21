<?php
/**
 * DATABASE MIGRATION - UIT Smart Waste Management
 * 
 * Run once to create required tables: bins, chat_sessions, messages.
 * Also seeds initial bin locations for UIT Hlaing Campus (4 buildings).
 *
 * Usage: http://localhost/uit_smart_waste_management/api/migrate.php
 */

header("Content-Type: application/json");

require_once __DIR__ . '/db_config.php';

$uit_migration_results = [];

try {
    // ========== TABLE: bins ==========
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS bins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            building_id INT NOT NULL COMMENT 'UIT Building 1-4',
            level VARCHAR(20) NOT NULL COMMENT 'basement, 1, 2, 3, 4, 5, 6',
            side VARCHAR(50) NOT NULL COMMENT 'front, behind, corridor',
            room_code VARCHAR(20) COMMENT 'X-Notation code e.g. 342',
            status ENUM('empty', 'full', 'maintenance') DEFAULT 'empty',
            lat DECIMAL(10, 8) DEFAULT NULL,
            lng DECIMAL(11, 8) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $uit_migration_results[] = "✅ Table 'bins' created/verified.";

    // ========== TABLE: chat_sessions ==========
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporter_id INT NOT NULL COMMENT 'Student or Teacher who initiated',
            collector_id INT DEFAULT NULL COMMENT 'Assigned collector',
            bin_id INT DEFAULT NULL COMMENT 'Related bin',
            status ENUM('open', 'resolved') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $uit_migration_results[] = "✅ Table 'chat_sessions' created/verified.";

    // ========== TABLE: messages ==========
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            attachment_url VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $uit_migration_results[] = "✅ Table 'messages' created/verified.";

    // ========== SEED: Initial bins for 4 UIT buildings ==========
    $uit_check_bins = $pdo->query("SELECT COUNT(*) as cnt FROM bins")->fetch();

    if ((int)$uit_check_bins['cnt'] === 0) {
        $uit_seed_stmt = $pdo->prepare(
            "INSERT INTO bins (building_id, level, side, room_code, lat, lng) VALUES (?, ?, ?, ?, ?, ?)"
        );

        // UIT Hlaing Campus approximate coordinates
        $uit_building_coords = [
            1 => ['lat' => 16.8517, 'lng' => 96.1227],
            2 => ['lat' => 16.8520, 'lng' => 96.1230],
            3 => ['lat' => 16.8523, 'lng' => 96.1233],
            4 => ['lat' => 16.8526, 'lng' => 96.1236],
        ];

        $uit_bin_count = 0;

        foreach ($uit_building_coords as $uit_bldg_no => $uit_coords) {
            // Basement bins (every building)
            $uit_seed_stmt->execute([$uit_bldg_no, 'basement', 'corridor', null, $uit_coords['lat'], $uit_coords['lng']]);
            $uit_bin_count++;

            // Ground floor (Level 1) bins
            $uit_seed_stmt->execute([$uit_bldg_no, '1', 'front', null, $uit_coords['lat'], $uit_coords['lng']]);
            $uit_bin_count++;

            // Levels 2-6 bins (front and behind)
            for ($uit_floor = 2; $uit_floor <= 6; $uit_floor++) {
                $uit_front_code = "{$uit_bldg_no}{$uit_floor}2";
                $uit_behind_code = "{$uit_bldg_no}{$uit_floor}5";

                $uit_seed_stmt->execute([$uit_bldg_no, (string)$uit_floor, 'front', $uit_front_code, $uit_coords['lat'], $uit_coords['lng']]);
                $uit_seed_stmt->execute([$uit_bldg_no, (string)$uit_floor, 'behind', $uit_behind_code, $uit_coords['lat'], $uit_coords['lng']]);
                $uit_bin_count += 2;
            }
        }

        $uit_migration_results[] = "✅ Seeded {$uit_bin_count} bins across 4 buildings.";
    } else {
        $uit_migration_results[] = "ℹ️ Bins already seeded ({$uit_check_bins['cnt']} exist). Skipping.";
    }

    echo json_encode(["success" => true, "results" => $uit_migration_results]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage(), "results" => $uit_migration_results]);
}
?>
