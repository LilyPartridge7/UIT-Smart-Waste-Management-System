<?php
/**
 * REPORT HANDLER - UIT Smart Waste Management
 *
 * PHP-ONLY actions that TypeScript server actions don't have.
 *
 * NOTE: Submitting reports and fetching user's own reports are handled
 * by TypeScript server actions (report.ts, userActivities.ts).
 * This file ONLY provides the collector "view all reports" endpoint.
 *
 * Actions:
 *   get_all_reports — Collector views ALL submitted reports
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

$uit_action = $_GET['action'] ?? '';

switch ($uit_action) {
    case 'get_all_reports':
        get_all_reports($pdo);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error"   => "Invalid action. Available: get_all_reports."
        ]);
}

// ======================================================================
//  get_all_reports — Collectors can view ALL submitted reports.
//  This is UNIQUE to PHP — TypeScript only has per-user reports.
// ======================================================================
function get_all_reports(PDO $pdo): void {
    $uit_user = requireRole(['collector']);

    $uit_stmt = $pdo->query("
        SELECT r.id, r.building, r.level, r.side, r.user_email, r.image_url, r.status, r.created_at
        FROM reports r
        ORDER BY r.created_at DESC
    ");

    echo json_encode([
        "success" => true,
        "reports" => $uit_stmt->fetchAll(),
    ]);
}
?>
