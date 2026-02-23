<?php
/**
 * ANALYTICS PROVIDER - Dashboard Data
 * UIT Smart Waste Management System
 *
 * Aggregates data from reports and bins tables to provide
 * JSON arrays formatted for Chart.js on the frontend.
 *
 * Actions (GET ?action=...):
 *   dashboard_overview         — All-in-one dashboard home page data (no auth)
 *   reports_by_building        — Bar chart data: report counts per building
 *   cleaning_completion_rate   — Pie chart data: cleaned vs pending vs full
 *   reports_over_time          — Line chart data: reports per day (last 30 days)
 *   bin_status_summary         — Summary of all bin statuses
 */

$uit_action = $_GET['action'] ?? '';

// All analytics endpoints are read-only campus data — no login required.
// Set CORS headers for all public analytics endpoints.
$uit_public_actions = [
    'dashboard_overview',
    'reports_by_building',
    'cleaning_completion_rate',
    'reports_over_time',
    'bin_status_summary',
];

if (in_array($uit_action, $uit_public_actions)) {
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Credentials: true");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    require_once __DIR__ . '/db_config.php';

    switch ($uit_action) {
        case 'dashboard_overview':
            get_dashboard_overview($pdo);
            break;
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
    }
    exit;
}

// Fallback for unknown actions
header("Content-Type: application/json");
http_response_code(400);
echo json_encode([
    "success" => false,
    "error"   => "Invalid action. Use: dashboard_overview, reports_by_building, cleaning_completion_rate, reports_over_time, bin_status_summary."
]);

// ======================================================================
//  FUNCTION: get_dashboard_overview
//  All-in-one endpoint for the Dashboard Home page.
//  Returns key metrics, weekly chart, and building chart in one call.
//  Does NOT require authentication — public campus overview data.
// ======================================================================
function get_dashboard_overview(PDO $pdo): void {
    try {
        // --- 1. Campus Cleanliness: (empty bins / total bins) * 100 ---
        $uit_bins_stmt = $pdo->query("
            SELECT status, COUNT(*) as cnt FROM bins GROUP BY status
        ");
        $uit_bin_statuses = $uit_bins_stmt->fetchAll();

        $uit_total_bins = 0;
        $uit_empty_bins = 0;
        $uit_full_bins  = 0;
        foreach ($uit_bin_statuses as $row) {
            $uit_total_bins += (int)$row['cnt'];
            if ($row['status'] === 'empty')  $uit_empty_bins = (int)$row['cnt'];
            if ($row['status'] === 'full')   $uit_full_bins  = (int)$row['cnt'];
        }

        $uit_campus_cleanliness = $uit_total_bins > 0
            ? round(($uit_empty_bins / $uit_total_bins) * 100)
            : 0;

        // --- 2. Total Reports ---
        $uit_total_reports = (int)$pdo->query("SELECT COUNT(*) FROM reports")->fetchColumn();

        // --- 3. Today's Reports ---
        $uit_today_reports = (int)$pdo->query("
            SELECT COUNT(*) FROM reports WHERE DATE(created_at) = CURDATE()
        ")->fetchColumn();

        // --- 4. Weekly Waste Activity (Mon - Sun, current week) ---
        // Day mapping: MySQL DAYOFWEEK: 1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri,7=Sat
        // We want Mon(2) through Sun(1)
        $uit_day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $uit_day_map    = [2 => 0, 3 => 1, 4 => 2, 5 => 3, 6 => 4, 7 => 5, 1 => 6]; // DAYOFWEEK -> index

        $uit_reports_week = array_fill(0, 7, 0);
        $uit_collections_week = array_fill(0, 7, 0);

        // All reports this week grouped by day-of-week
        $uit_weekly_stmt = $pdo->query("
            SELECT DAYOFWEEK(created_at) as dow, COUNT(*) as cnt
            FROM reports
            WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
            GROUP BY DAYOFWEEK(created_at)
        ");
        foreach ($uit_weekly_stmt->fetchAll() as $row) {
            $dow = (int)$row['dow'];
            if (isset($uit_day_map[$dow])) {
                $uit_reports_week[$uit_day_map[$dow]] = (int)$row['cnt'];
            }
        }

        // Completed collections this week (reports with status 'Cleared')
        $uit_coll_stmt = $pdo->query("
            SELECT DAYOFWEEK(created_at) as dow, COUNT(*) as cnt
            FROM reports
            WHERE status = 'Cleared'
              AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
            GROUP BY DAYOFWEEK(created_at)
        ");
        foreach ($uit_coll_stmt->fetchAll() as $row) {
            $dow = (int)$row['dow'];
            if (isset($uit_day_map[$dow])) {
                $uit_collections_week[$uit_day_map[$dow]] = (int)$row['cnt'];
            }
        }

        // --- 5. Reports by Building ---
        $uit_bldg_stmt = $pdo->query("
            SELECT building, COUNT(*) as cnt
            FROM reports
            GROUP BY building
            ORDER BY building ASC
        ");
        $uit_bldg_rows = $uit_bldg_stmt->fetchAll();

        $uit_bldg_labels = [];
        $uit_bldg_data   = [];
        foreach ($uit_bldg_rows as $row) {
            $uit_bldg_labels[] = "Bldg " . $row['building'];
            $uit_bldg_data[]   = (int)$row['cnt'];
        }

        // --- Build response ---
        echo json_encode([
            "success"             => true,
            "campus_cleanliness"  => $uit_campus_cleanliness,
            "active_bins"         => $uit_total_bins,
            "full_bins"           => $uit_full_bins,
            "total_reports"       => $uit_total_reports,
            "today_reports"       => $uit_today_reports,
            "weekly_chart"        => [
                "labels"      => $uit_day_labels,
                "reports"     => $uit_reports_week,
                "collections" => $uit_collections_week,
            ],
            "building_chart"      => [
                "labels" => $uit_bldg_labels,
                "data"   => $uit_bldg_data,
            ],
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error"   => "Dashboard query failed: " . $e->getMessage()
        ]);
    }
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
