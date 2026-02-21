<?php
// complaint handling stuff for the waste app
// this file is for things that the typescript side doesn't do yet
// (mainly collector replies)

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
// handler for when a collector writes back to a user
// typescript doesn't have an equivalent for this right now
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
