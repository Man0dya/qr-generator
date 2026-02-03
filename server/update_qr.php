<?php
// server/update_qr.php
require 'db.php';
require 'utils.php';

$input = json_decode(file_get_contents("php://input"), true);
$qr_id = $input['qr_id'] ?? null;
$new_url = $input['url'] ?? null;
$user_id = $input['user_id'] ?? null; // For security check

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

    // 2. Update the URL + re-run moderation
    $flag = analyze_url_for_moderation($new_url);
    $is_flagged = $flag['flagged'] ? 1 : 0;
    $flag_reason = $flag['flagged'] ? $flag['reason'] : null;

    // If flagged, pause the link until reviewed.
    $new_status = $flag['flagged'] ? 'paused' : 'active';

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

    echo json_encode([
        "success" => true,
        "message" => $is_flagged ? "Link updated but flagged for review" : "Link updated successfully",
        "status" => $new_status,
        "is_flagged" => (bool)$is_flagged,
        "flag_reason" => $flag_reason,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>