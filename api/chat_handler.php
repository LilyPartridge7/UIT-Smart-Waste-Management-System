<?php
/**
 * CHAT HANDLER - Complaint-as-Chat System
 * UIT Smart Waste Management System
 *
 * Replaces the old complaint form with real-time conversation.
 *
 * Actions (POST ?action=...):
 *   initiate_chat  — Student/Teacher creates a new chat session
 *   send_message   — Either party sends a message
 *   get_history    — Fetches message history for a session
 *   get_sessions   — Lists all sessions for the current user
 */

require_once __DIR__ . '/session_check.php';
require_once __DIR__ . '/db_config.php';

// ========== ROUTE ACTION ==========
$uit_action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && in_array($uit_action, ['get_history', 'get_sessions'])) {
    // Allow GET for read operations
} elseif ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

$uit_input = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($uit_action) {

    // ========== INITIATE CHAT ==========
    case 'initiate_chat':
        initiate_chat($pdo, $uit_input);
        break;

    // ========== SEND MESSAGE ==========
    case 'send_message':
        send_message($pdo, $uit_input);
        break;

    // ========== GET HISTORY ==========
    case 'get_history':
        get_history($pdo);
        break;

    // ========== GET MY SESSIONS ==========
    case 'get_sessions':
        get_sessions($pdo);
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid action. Use: initiate_chat, send_message, get_history, get_sessions."]);
}

// ======================================================================
//  FUNCTION: initiate_chat
//  Only Students (role=student) and Teachers (role=teacher) can initiate.
//  Creates a chat_session linked to a bin_id.
// ======================================================================
function initiate_chat(PDO $pdo, array $uit_input): void {
    $uit_user = requireRole(['student', 'teacher']);

    $uit_bin_id  = isset($uit_input['bin_id']) ? (int)$uit_input['bin_id'] : null;
    $uit_message = trim($uit_input['message'] ?? '');

    if (empty($uit_message)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Initial message is required."]);
        return;
    }

    // Verify the bin exists (if provided)
    if ($uit_bin_id) {
        $uit_bin_check = $pdo->prepare("SELECT id FROM bins WHERE id = :id");
        $uit_bin_check->execute([':id' => $uit_bin_id]);
        if (!$uit_bin_check->fetch()) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Bin not found."]);
            return;
        }
    }

    // Find an available collector to assign
    $uit_collector_stmt = $pdo->query(
        "SELECT id FROM users WHERE role = 'collector' ORDER BY RAND() LIMIT 1"
    );
    $uit_collector = $uit_collector_stmt->fetch();
    $uit_collector_id = $uit_collector ? $uit_collector['id'] : null;

    // Create the chat session
    $uit_session_stmt = $pdo->prepare(
        "INSERT INTO chat_sessions (reporter_id, collector_id, bin_id, status) VALUES (:reporter, :collector, :bin, 'open')"
    );
    $uit_session_stmt->execute([
        ':reporter'  => $uit_user['id'],
        ':collector' => $uit_collector_id,
        ':bin'       => $uit_bin_id,
    ]);
    $uit_session_id = $pdo->lastInsertId();

    // Insert the initial message
    $uit_msg_stmt = $pdo->prepare(
        "INSERT INTO messages (session_id, sender_id, message) VALUES (:session, :sender, :msg)"
    );
    $uit_msg_stmt->execute([
        ':session' => $uit_session_id,
        ':sender'  => $uit_user['id'],
        ':msg'     => $uit_message,
    ]);

    echo json_encode([
        "success"      => true,
        "session_id"   => (int)$uit_session_id,
        "collector_id" => $uit_collector_id,
        "message"      => "Chat session created successfully."
    ]);
}

// ======================================================================
//  FUNCTION: send_message
//  Any participant in the session can send a message.
// ======================================================================
function send_message(PDO $pdo, array $uit_input): void {
    $uit_user = requireRole(['student', 'teacher', 'collector']);

    $uit_session_id    = isset($uit_input['session_id']) ? (int)$uit_input['session_id'] : 0;
    $uit_message_text  = trim($uit_input['message'] ?? '');
    $uit_attachment_url = trim($uit_input['attachment_url'] ?? '');

    if ($uit_session_id <= 0 || empty($uit_message_text)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "session_id and message are required."]);
        return;
    }

    // Verify user is part of this session
    $uit_auth_stmt = $pdo->prepare(
        "SELECT id FROM chat_sessions WHERE id = :id AND (reporter_id = :uid OR collector_id = :uid2)"
    );
    $uit_auth_stmt->execute([':id' => $uit_session_id, ':uid' => $uit_user['id'], ':uid2' => $uit_user['id']]);

    if (!$uit_auth_stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "You are not a participant in this chat session."]);
        return;
    }

    // Insert message
    $uit_insert_msg = $pdo->prepare(
        "INSERT INTO messages (session_id, sender_id, message, attachment_url) VALUES (:sess, :sender, :msg, :attach)"
    );
    $uit_insert_msg->execute([
        ':sess'   => $uit_session_id,
        ':sender' => $uit_user['id'],
        ':msg'    => $uit_message_text,
        ':attach' => $uit_attachment_url ?: null,
    ]);

    echo json_encode([
        "success"    => true,
        "message_id" => (int)$pdo->lastInsertId(),
    ]);
}

// ======================================================================
//  FUNCTION: get_history
//  Fetches full message history for a session. Both participants see same data.
// ======================================================================
function get_history(PDO $pdo): void {
    $uit_user = requireRole(['student', 'teacher', 'collector']);

    $uit_session_id = isset($_GET['session_id']) ? (int)$_GET['session_id'] : 0;

    if ($uit_session_id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "session_id is required."]);
        return;
    }

    // Verify access
    $uit_auth_stmt = $pdo->prepare(
        "SELECT id FROM chat_sessions WHERE id = :id AND (reporter_id = :uid OR collector_id = :uid2)"
    );
    $uit_auth_stmt->execute([':id' => $uit_session_id, ':uid' => $uit_user['id'], ':uid2' => $uit_user['id']]);

    if (!$uit_auth_stmt->fetch()) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Access denied to this chat session."]);
        return;
    }

    // Fetch messages with sender names
    $uit_history_stmt = $pdo->prepare("
        SELECT m.id, m.message, m.attachment_url, m.created_at,
               m.sender_id, u.name AS sender_name, u.role AS sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.session_id = :sess
        ORDER BY m.created_at ASC
    ");
    $uit_history_stmt->execute([':sess' => $uit_session_id]);
    $uit_messages = $uit_history_stmt->fetchAll();

    echo json_encode([
        "success"    => true,
        "session_id" => $uit_session_id,
        "messages"   => $uit_messages,
    ]);
}

// ======================================================================
//  FUNCTION: get_sessions
//  Lists all chat sessions for the current user.
// ======================================================================
function get_sessions(PDO $pdo): void {
    $uit_user = requireRole(['student', 'teacher', 'collector']);

    $uit_sessions_stmt = $pdo->prepare("
        SELECT cs.id, cs.status, cs.created_at, cs.bin_id,
               reporter.name AS reporter_name,
               collector.name AS collector_name
        FROM chat_sessions cs
        JOIN users reporter ON cs.reporter_id = reporter.id
        LEFT JOIN users collector ON cs.collector_id = collector.id
        WHERE cs.reporter_id = :uid OR cs.collector_id = :uid2
        ORDER BY cs.created_at DESC
    ");
    $uit_sessions_stmt->execute([':uid' => $uit_user['id'], ':uid2' => $uit_user['id']]);
    $uit_sessions = $uit_sessions_stmt->fetchAll();

    echo json_encode([
        "success"  => true,
        "sessions" => $uit_sessions,
    ]);
}
?>
