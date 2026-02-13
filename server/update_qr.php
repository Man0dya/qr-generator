<?php
// server/update_qr.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];

$input = json_decode(file_get_contents("php://input"), true);
$qr_id = $input['qr_id'] ?? null;
$new_url = $input['url'] ?? null;
// User ID is from session

if (!$qr_id || !$new_url || !$user_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing fields"]);
    exit();
}

try {
    // 1. Security: Ensure the QR belongs to this user
    $check = $conn->prepare("SELECT id FROM qr_codes WHERE id = :qid AND user_id = :uid");
    $check->execute([':qid' => $qr_id, ':uid' => $user_id]);

    if ($check->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(["error" => "Unauthorized"]);
        exit();
    }

    // 2. Update the URL + re-run moderation (allow | pause | ban)
    $mod = moderate_destination_url($conn, $new_url);
    $is_flagged = ($mod['action'] !== 'allow') ? 1 : 0;
    $flag_reason = ($mod['action'] !== 'allow') ? ($mod['reason'] ?? 'Moderation triggered') : null;
    $new_status = $mod['action'] === 'ban' ? 'banned' : ($mod['action'] === 'pause' ? 'paused' : 'active');

    $update = $conn->prepare(
        "UPDATE qr_codes
         SET destination_url = :url,
             status = :status,
             is_flagged = :is_flagged,
             flag_reason = :flag_reason,
             flagged_at = CASE WHEN :is_flagged = 1 THEN NOW() ELSE NULL END,
             reviewed_by = NULL,
             reviewed_at = NULL
         WHERE id = :qid"
    );
    $update->execute([
        ':url' => $new_url,
        ':status' => $new_status,
        ':is_flagged' => $is_flagged,
        ':flag_reason' => $flag_reason,
        ':qid' => $qr_id,
    ]);

    if ($new_status === 'banned') {
        audit_log($conn, null, 'qr_auto_ban', 'qr_code', (int) $qr_id, ['reason' => $flag_reason]);
    } elseif ($new_status === 'paused') {
        audit_log($conn, null, 'qr_auto_flag', 'qr_code', (int) $qr_id, ['reason' => $flag_reason]);
    }

    echo json_encode([
        "success" => true,
        "message" => $new_status === 'banned'
            ? "Link updated but automatically banned (unwanted link)"
            : ($is_flagged ? "Link updated but flagged for review" : "Link updated successfully"),
        "status" => $new_status,
        "is_flagged" => (bool) $is_flagged,
        "flag_reason" => $flag_reason,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>