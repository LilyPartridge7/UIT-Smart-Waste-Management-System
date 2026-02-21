<?php
/**
 * MEDIA HANDLER - Security-Checked File Uploads
 * UIT Smart Waste Management System
 *
 * Dedicated file to process $_FILES for reports and chat attachments.
 *
 * Security Features:
 *   - MIME type verification (only .jpg, .png)
 *   - Filename hashing (SHA-256) for server safety
 *   - Size limit: 5MB maximum
 *
 * Can be used in two ways:
 *   1. Included by other scripts: call process_upload($file, $subdirectory)
 *   2. Direct POST: Upload via multipart/form-data with field name "file"
 */

// ========== CONSTANTS ==========
define('UIT_UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UIT_MAX_FILE_SIZE', 5 * 1024 * 1024);  // 5MB in bytes
define('UIT_ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png']);
define('UIT_ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png']);

/**
 * Process a single file upload with full security checks.
 *
 * @param array  $uit_file      The $_FILES['field_name'] array
 * @param string $uit_subdir    Subdirectory inside uploads/ (e.g., 'reports', 'chat')
 * @return array                { success: bool, file_url?: string, error?: string }
 */
function process_upload(array $uit_file, string $uit_subdir = 'general'): array {

    // ========== CHECK 1: Upload error ==========
    if ($uit_file['error'] !== UPLOAD_ERR_OK) {
        $uit_error_messages = [
            UPLOAD_ERR_INI_SIZE   => "File exceeds server upload limit.",
            UPLOAD_ERR_FORM_SIZE  => "File exceeds form upload limit.",
            UPLOAD_ERR_PARTIAL    => "File was only partially uploaded.",
            UPLOAD_ERR_NO_FILE    => "No file was uploaded.",
            UPLOAD_ERR_NO_TMP_DIR => "Server missing temporary folder.",
            UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk.",
        ];
        return [
            "success" => false,
            "error"   => $uit_error_messages[$uit_file['error']] ?? "Unknown upload error."
        ];
    }

    // ========== CHECK 2: File size (5MB limit) ==========
    if ($uit_file['size'] > UIT_MAX_FILE_SIZE) {
        return [
            "success" => false,
            "error"   => "File too large. Maximum size is 5MB. Your file: " . round($uit_file['size'] / 1024 / 1024, 2) . "MB."
        ];
    }

    // ========== CHECK 3: Extension validation ==========
    $uit_original_name = basename($uit_file['name']);
    $uit_extension     = strtolower(pathinfo($uit_original_name, PATHINFO_EXTENSION));

    if (!in_array($uit_extension, UIT_ALLOWED_EXTENSIONS)) {
        return [
            "success" => false,
            "error"   => "Invalid file type '.{$uit_extension}'. Only .jpg and .png are allowed."
        ];
    }

    // ========== CHECK 4: MIME type verification (most critical) ==========
    $uit_finfo     = new finfo(FILEINFO_MIME_TYPE);
    $uit_mime_type = $uit_finfo->file($uit_file['tmp_name']);

    if (!in_array($uit_mime_type, UIT_ALLOWED_MIME_TYPES)) {
        return [
            "success" => false,
            "error"   => "Invalid MIME type '{$uit_mime_type}'. Only image/jpeg and image/png are allowed."
        ];
    }

    // ========== CHECK 5: Verify it's actually an image ==========
    $uit_image_info = getimagesize($uit_file['tmp_name']);
    if ($uit_image_info === false) {
        return [
            "success" => false,
            "error"   => "File is not a valid image."
        ];
    }

    // ========== PROCESS: Hash filename for security ==========
    $uit_hash      = hash('sha256', $uit_original_name . microtime(true) . random_bytes(8));
    $uit_safe_name = $uit_hash . '.' . $uit_extension;

    // Create destination directory if it doesn't exist
    $uit_dest_dir = UIT_UPLOAD_DIR . $uit_subdir . '/';
    if (!is_dir($uit_dest_dir)) {
        mkdir($uit_dest_dir, 0755, true);
    }

    $uit_dest_path = $uit_dest_dir . $uit_safe_name;

    // ========== MOVE FILE ==========
    if (!move_uploaded_file($uit_file['tmp_name'], $uit_dest_path)) {
        return [
            "success" => false,
            "error"   => "Failed to save file. Check server permissions."
        ];
    }

    // Return relative URL for database storage
    $uit_relative_url = "uploads/{$uit_subdir}/{$uit_safe_name}";

    return [
        "success"       => true,
        "file_url"      => $uit_relative_url,
        "original_name" => $uit_original_name,
        "size_bytes"    => $uit_file['size'],
        "mime_type"     => $uit_mime_type,
    ];
}


// ========== STANDALONE MODE (direct upload endpoint) ==========
if (basename($_SERVER['SCRIPT_FILENAME']) === 'media_handler.php') {

    require_once __DIR__ . '/session_check.php';
    $uit_user = requireRole(['student', 'teacher', 'collector']);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed. Use POST."]);
        exit;
    }

    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "No file provided. Use field name 'file'."]);
        exit;
    }

    $uit_subdir = $_POST['category'] ?? 'general';
    $uit_result = process_upload($_FILES['file'], $uit_subdir);

    http_response_code($uit_result['success'] ? 200 : 400);
    echo json_encode($uit_result);
}
?>
