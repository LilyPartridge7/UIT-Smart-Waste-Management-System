<?php
/**
 * COMPLAINT HANDLER - UIT Smart Waste Management
 *
 * PHP-ONLY actions that TypeScript server actions don't have.
 * 
 * NOTE: Loading complaints, deleting complaints, collector bin queue,
 * mark-as-empty, report counts, and collection counts are ALL handled
 * by TypeScript server actions (collector.ts, getComplaints.ts).
 * This file ONLY handles collector responses.
 *
 * Actions:
 *   respond  — Collector sends a response to a complaint
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

$uit_action = $_GET['action'] ?? '';
$uit_input  = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($uit_action) {
    case 'respond':
        respond_to_complaint($pdo, $uit_input);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error"   => "Invalid action. Available: respond."
        ]);
}

// ======================================================================
//  respond_to_complaint — Collector writes a response to a complaint
//  This is UNIQUE to PHP — TypeScript has no equivalent.
// ======================================================================
function respond_to_complaint(PDO $pdo, array $uit_input): void {
    $uit_user = requireRole(['collector']);

    $uit_complaint_id = isset($uit_input['complaint_id']) ? (int)$uit_input['complaint_id'] : 0;
    $uit_response     = trim($uit_input['response'] ?? '');
    $uit_new_status   = trim($uit_input['status'] ?? 'Responded');

    if ($uit_complaint_id <= 0 || empty($uit_response)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "complaint_id and response are required."]);
        return;
    }

    $uit_stmt = $pdo->prepare("
        UPDATE complaint
        SET admin_response = :response, status = :status
        WHERE id = :id
    ");
    $uit_stmt->execute([
        ':response' => $uit_response,
        ':status'   => $uit_new_status,
        ':id'       => $uit_complaint_id,
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Response sent to the reporter.",
    ]);
}
?>
