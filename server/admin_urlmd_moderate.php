<?php
require 'db.php';
require 'utils.php';

$user = require_role('admin');
$actorUserId = (int) $user['id'];
$input = get_json_input();

$linkId = isset($input['id']) ? (int) $input['id'] : 0;
$action = trim((string) ($input['action'] ?? ''));
$reason = trim((string) ($input['reason'] ?? ''));

if ($linkId <= 0 || $action === '') {
    json_response(['error' => 'id and action are required'], 400);
    exit();
}

$status = null;
$flagged = null;
$flagReason = null;
$auditAction = null;

if ($action === 'block') {
    $status = 'blocked';
    $flagged = 1;
    $flagReason = $reason !== '' ? $reason : 'Blocked by admin';
    $auditAction = 'url_block';
} elseif ($action === 'pause') {
    $status = 'paused';
    $flagged = 1;
    $flagReason = $reason !== '' ? $reason : 'Paused by admin';
    $auditAction = 'url_pause';
} elseif ($action === 'activate') {
    $status = 'active';
    $flagged = 0;
    $flagReason = null;
    $auditAction = 'url_activate';
    $auditAction = 'url_activate';
} elseif ($action === 'approve_request') {
    $stmt = $conn->prepare(
        "UPDATE url_links
         SET approval_request_status = 'approved',
             approval_resolved_at = NOW(),
             approval_resolved_by = :rid,
             status = 'active',
             is_flagged = 0,
             flag_reason = NULL,
             updated_at = NOW()
         WHERE id = :id AND COALESCE(approval_request_status, 'none') = 'requested'"
    );
    $stmt->execute([':rid' => $actorUserId, ':id' => $linkId]);

    if ($stmt->rowCount() > 0) {
        audit_log($conn, $actorUserId, 'url_approve_request', 'url_link', $linkId);
        json_response(['success' => true]);
        exit();
    } else {
        json_response(['error' => 'No pending request found or failed to update'], 400);
        exit();
    }

} elseif ($action === 'deny_request') {
    $stmt = $conn->prepare(
        "UPDATE url_links
         SET approval_request_status = 'denied',
             approval_resolved_at = NOW(),
             approval_resolved_by = :rid,
             updated_at = NOW()
         WHERE id = :id AND COALESCE(approval_request_status, 'none') = 'requested'"
    );
    $stmt->execute([':rid' => $actorUserId, ':id' => $linkId]);

    if ($stmt->rowCount() > 0) {
        audit_log($conn, $actorUserId, 'url_deny_request', 'url_link', $linkId);
        json_response(['success' => true]);
        exit();
    } else {
        json_response(['error' => 'No pending request found'], 400);
        exit();
    }

} else {
    json_response(['error' => 'Invalid action'], 400);
    exit();
}

try {
    $stmt = $conn->prepare(
        "UPDATE url_links
         SET status = :status, is_flagged = :flagged, flag_reason = :reason
         WHERE id = :id"
    );
    $stmt->execute([
        ':status' => $status,
        ':flagged' => $flagged,
        ':reason' => $flagReason,
        ':id' => $linkId,
    ]);

    if ($stmt->rowCount() === 0) {
        json_response(['error' => 'Not found'], 404);
        exit();
    }

    audit_log($conn, $actorUserId, $auditAction, 'url_link', $linkId, ['reason' => $flagReason]);
    json_response(['success' => true]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to moderate link'], 500);
}
