<?php
// complaint handling stuff for the waste app
// this file is for things that the typescript side doesn't do yet
// (mainly collector replies)

require_once __DIR__ . '/db_config.php';

// Start session if not already started (for optional session check)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CORS headers (needed for cross-origin fetch from Next.js)
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
// Relaxed auth: Next.js routing already restricts this page to collectors.
// If PHP session exists, we verify role; otherwise we trust the frontend.
// ======================================================================
function respond_to_complaint(PDO $pdo, array $uit_input): void {
    // Soft auth check: if session exists, verify collector role
    if (isset($_SESSION['user_id']) && isset($_SESSION['user_role'])) {
        if ($_SESSION['user_role'] !== 'collector') {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "Access denied. Only collectors can respond."]);
            return;
        }
    }

    $uit_complaint_id = isset($uit_input['complaint_id']) ? (int)$uit_input['complaint_id'] : 0;
    $uit_response     = trim($uit_input['response'] ?? '');
    $uit_new_status   = trim($uit_input['status'] ?? 'Responded');

    if ($uit_complaint_id <= 0 || empty($uit_response)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "complaint_id and response are required."]);
        return;
    }

    try {
        $pdo->beginTransaction();

        // 1. Update the complaint table with admin response and new status
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

        // Check if any row was actually updated
        if ($uit_stmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Complaint not found with id: {$uit_complaint_id}"]);
            return;
        }

        // 2. Also insert into messages table if a chat_session exists for this reporter
        //    This ensures the reply appears in the student's Chat History view.
        $uit_complaint_info = $pdo->prepare("SELECT user_email FROM complaint WHERE id = :id");
        $uit_complaint_info->execute([':id' => $uit_complaint_id]);
        $uit_complaint_row = $uit_complaint_info->fetch();

        if ($uit_complaint_row) {
            $uit_reporter_email = $uit_complaint_row['user_email'];

            // Find reporter's user id and any chat session
            $uit_user_stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
            $uit_user_stmt->execute([':email' => $uit_reporter_email]);
            $uit_reporter = $uit_user_stmt->fetch();

            if ($uit_reporter) {
                // Find an existing chat session for this reporter
                $uit_session_stmt = $pdo->prepare("
                    SELECT cs.id, cs.collector_id FROM chat_sessions cs 
                    WHERE cs.reporter_id = :reporter_id 
                    ORDER BY cs.created_at DESC LIMIT 1
                ");
                $uit_session_stmt->execute([':reporter_id' => $uit_reporter['id']]);
                $uit_session = $uit_session_stmt->fetch();

                if ($uit_session) {
                    // Get the collector's user id (from session or from the chat_session)
                    $uit_sender_id = $_SESSION['user_id'] ?? $uit_session['collector_id'];

                    if ($uit_sender_id) {
                        $uit_msg_stmt = $pdo->prepare("
                            INSERT INTO messages (session_id, sender_id, message) 
                            VALUES (:session_id, :sender_id, :message)
                        ");
                        $uit_msg_stmt->execute([
                            ':session_id' => $uit_session['id'],
                            ':sender_id'  => $uit_sender_id,
                            ':message'    => $uit_response,
                        ]);
                    }
                }
            }
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Response sent to the reporter.",
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error"   => "Database error: " . $e->getMessage(),
        ]);
    }
}
?>
