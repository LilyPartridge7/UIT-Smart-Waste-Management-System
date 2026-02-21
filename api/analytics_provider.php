<?php
/**
 * ANALYTICS PROVIDER - Dashboard Data
 * UIT Smart Waste Management System
 *
 * Aggregates data from reports and bins tables to provide
 * JSON arrays formatted for Chart.js on the frontend.
 *
 * Actions (GET ?action=...):
 *   reports_by_building       — Bar chart data: report counts per building
 *   cleaning_completion_rate  — Pie chart data: cleaned vs pending vs full
 *   reports_over_time         — Line chart data: reports per day (last 30 days)
 *   bin_status_summary        — Summary of all bin statuses
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

// All roles can view analytics
$uit_current_user = requireRole(['student', 'teacher', 'collector']);

$uit_action = $_GET['action'] ?? '';

switch ($uit_action) {
    case 'reports_by_building':
        get_reports_by_building($pdo);
        break;

    case 'cleaning_completion_rate':
        get_cleaning_completion_rate($pdo);
        break;

    case 'reports_over_time':
        get_reports_over_time($pdo);
        break;

    case 'bin_status_summary':
        get_bin_status_summary($pdo);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error"   => "Invalid action. Use: reports_by_building, cleaning_completion_rate, reports_over_time, bin_status_summary."
        ]);
}

// ======================================================================
//  FUNCTION: get_reports_by_building
//  Returns report counts grouped by building — ready for Chart.js bar chart.
//
//  Output format:
//  { labels: ["Building 1", ...], datasets: [{ data: [12, 8, ...] }] }
// ======================================================================
function get_reports_by_building(PDO $pdo): void {

    $uit_stmt = $pdo->query("
        SELECT building, COUNT(*) as uit_report_count
        FROM reports
        GROUP BY building
        ORDER BY building ASC
    ");
    $uit_rows = $uit_stmt->fetchAll();

    // Format for Chart.js
    $uit_labels = [];
    $uit_data   = [];

    foreach ($uit_rows as $uit_row) {
        $uit_labels[] = "Building " . $uit_row['building'];
        $uit_data[]   = (int)$uit_row['uit_report_count'];
    }

    echo json_encode([
        "success" => true,
        "chart"   => [
            "labels"   => $uit_labels,
            "datasets" => [
                [
                    "label"           => "Reports per Building",
                    "data"            => $uit_data,
                    "backgroundColor" => ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"],
                ]
            ]
        ]
    ]);
}

// ======================================================================
//  FUNCTION: get_cleaning_completion_rate
//  Returns bin status distribution — ready for Chart.js pie/doughnut chart.
//
//  Output format:
//  { labels: ["Empty", "Full", "Maintenance"], datasets: [{ data: [...] }] }
// ======================================================================
function get_cleaning_completion_rate(PDO $pdo): void {

    $uit_stmt = $pdo->query("
        SELECT status, COUNT(*) as uit_bin_count
        FROM bins
        GROUP BY status
    ");
    $uit_rows = $uit_stmt->fetchAll();

    $uit_labels = [];
    $uit_data   = [];
    $uit_colors = [
        'empty'       => '#22c55e',  // Green
        'full'        => '#ef4444',  // Red
        'maintenance' => '#f59e0b',  // Amber
    ];

    $uit_bg_colors = [];

    foreach ($uit_rows as $uit_row) {
        $uit_status_label = ucfirst($uit_row['status']);
        $uit_labels[]     = $uit_status_label;
        $uit_data[]       = (int)$uit_row['uit_bin_count'];
        $uit_bg_colors[]  = $uit_colors[$uit_row['status']] ?? '#6b7280';
    }

    // Calculate completion rate (percentage of bins that are 'empty' = cleaned)
    $uit_total = array_sum($uit_data);
    $uit_empty_count = 0;
    foreach ($uit_rows as $uit_row) {
        if ($uit_row['status'] === 'empty') {
            $uit_empty_count = (int)$uit_row['uit_bin_count'];
        }
    }
    $uit_completion_rate = $uit_total > 0 ? round(($uit_empty_count / $uit_total) * 100, 1) : 0;

    echo json_encode([
        "success"         => true,
        "completion_rate"  => $uit_completion_rate,
        "chart"           => [
            "labels"   => $uit_labels,
            "datasets" => [
                [
                    "label"           => "Bin Status Distribution",
                    "data"            => $uit_data,
                    "backgroundColor" => $uit_bg_colors,
                ]
            ]
        ]
    ]);
}

// ======================================================================
//  FUNCTION: get_reports_over_time
//  Returns daily report counts for the last 30 days — for Chart.js line chart.
// ======================================================================
function get_reports_over_time(PDO $pdo): void {

    $uit_stmt = $pdo->query("
        SELECT DATE(created_at) as uit_date, COUNT(*) as uit_count
        FROM reports
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY uit_date ASC
    ");
    $uit_rows = $uit_stmt->fetchAll();

    $uit_labels = [];
    $uit_data   = [];

    foreach ($uit_rows as $uit_row) {
        $uit_labels[] = $uit_row['uit_date'];
        $uit_data[]   = (int)$uit_row['uit_count'];
    }

    echo json_encode([
        "success" => true,
        "chart"   => [
            "labels"   => $uit_labels,
            "datasets" => [
                [
                    "label"       => "Reports (Last 30 Days)",
                    "data"        => $uit_data,
                    "borderColor" => "#0d9488",
                    "fill"        => false,
                ]
            ]
        ]
    ]);
}

// ======================================================================
//  FUNCTION: get_bin_status_summary
//  Quick summary of all bins with current status.
// ======================================================================
function get_bin_status_summary(PDO $pdo): void {

    $uit_stmt = $pdo->query("
        SELECT b.id, b.building_id, b.level, b.side, b.room_code, b.status, b.updated_at
        FROM bins b
        ORDER BY b.building_id, b.level, b.side
    ");

    $uit_summary_stmt = $pdo->query("SELECT COUNT(*) as total FROM bins");
    $uit_total        = $uit_summary_stmt->fetch()['total'];

    $uit_full_stmt = $pdo->query("SELECT COUNT(*) as cnt FROM bins WHERE status = 'full'");
    $uit_full      = $uit_full_stmt->fetch()['cnt'];

    echo json_encode([
        "success"    => true,
        "total_bins" => (int)$uit_total,
        "full_bins"  => (int)$uit_full,
        "bins"       => $uit_stmt->fetchAll(),
    ]);
}
?>
