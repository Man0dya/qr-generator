<?php
require 'db.php';
require 'utils.php';

// 1. Auth Check - only logged-in users
$user = require_auth();
$user_id = $user['id'];

// 2. Get Input
$input = get_json_input();
$link_id = isset($input['link_id']) ? (int) $input['link_id'] : 0;
$note = trim((string) ($input['note'] ?? ''));

if ($link_id <= 0) {
    json_response(['error' => 'Invalid Link ID'], 400);
}

// 3. Verify Ownership & Status
try {
    // Check if column exists first (safety)
    // In production, you'd know schema is updated.

    $stmt = $conn->prepare(
        "SELECT id, user_id, status, approval_request_status 
         FROM url_links 
         WHERE id = :id AND user_id = :uid"
    );
    $stmt->execute([':id' => $link_id, ':uid' => $user_id]);
    $link = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$link) {
        json_response(['error' => 'Link not found or access denied'], 404);
    }

    // Only allow if status is NOT active (i.e. banned, paused, blocked)
    if ($link['status'] === 'active') {
        json_response(['error' => 'This link is already active.'], 400);
    }

    $reqStatus = $link['approval_request_status'] ?? 'none';

    if ($reqStatus === 'requested') {
        json_response(['error' => 'An approval request is already pending.'], 400);
    }

    if ($reqStatus === 'approved') {
        // Rare case: it was approved but status is still not active? 
        // Allow re-request if it was re-banned.
    }

    // 4. Create Request
    $update = $conn->prepare(
        "UPDATE url_links
         SET approval_request_status = 'requested',
             approval_requested_at = NOW(),
             approval_request_note = :note,
             approval_resolved_at = NULL,
             approval_resolved_by = NULL
         WHERE id = :id"
    );
    $update->execute([
        ':note' => $note,
        ':id' => $link_id
    ]);

    // 5. Audit Log (Optional but good)
    audit_log($conn, $user_id, 'request_approval', 'url_link', $link_id, ['note' => $note]);

    json_response(['success' => true]);

} catch (PDOException $e) {
    error_log("Approval Req Error: " . $e->getMessage());
    json_response(['error' => 'Database error'], 500);
}
?>