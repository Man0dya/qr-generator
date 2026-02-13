<?php
require 'db.php';
require 'utils.php';
require 'urlmd_common.php';

$user = require_auth();
$userId = (int) $user['id'];
$input = get_json_input();

$destinationUrl = trim((string) ($input['destination_url'] ?? ''));
$requestedCode = trim((string) ($input['short_code'] ?? ''));
$title = trim((string) ($input['title'] ?? ''));
$note = trim((string) ($input['note'] ?? ''));
$expiresAt = trim((string) ($input['expires_at'] ?? ''));
$redirectType = (string) ($input['redirect_type'] ?? '302');
$customDomainId = isset($input['custom_domain_id']) ? (int) $input['custom_domain_id'] : null;

if ($destinationUrl === '') {
    json_response(['error' => 'destination_url is required'], 400);
    exit();
}

if (!filter_var($destinationUrl, FILTER_VALIDATE_URL)) {
    json_response(['error' => 'Invalid destination URL'], 400);
    exit();
}

if (!in_array($redirectType, ['301', '302'], true)) {
    $redirectType = '302';
}

if ($requestedCode !== '' && !preg_match('/^[a-zA-Z0-9_-]{4,32}$/', $requestedCode)) {
    json_response(['error' => 'short_code must be 4-32 chars and only letters, numbers, - or _'], 400);
    exit();
}

if ($customDomainId !== null && $customDomainId > 0) {
    $domainStmt = $conn->prepare("SELECT id FROM custom_domains WHERE id = :id AND user_id = :uid AND status = 'active'");
    $domainStmt->execute([':id' => $customDomainId, ':uid' => $userId]);
    if (!$domainStmt->fetch()) {
        json_response(['error' => 'Invalid custom_domain_id'], 400);
        exit();
    }
}

$moderation = moderate_destination_url($conn, $destinationUrl);
$status = 'active';
$isFlagged = 0;
$flagReason = null;
if ($moderation['action'] === 'ban') {
    $status = 'blocked';
    $isFlagged = 1;
    $flagReason = $moderation['reason'] ?? 'Blocked by moderation';
} elseif ($moderation['action'] === 'pause') {
    $status = 'paused';
    $isFlagged = 1;
    $flagReason = $moderation['reason'] ?? 'Flagged by moderation';
}

$shortCode = $requestedCode;
if ($shortCode === '') {
    $tries = 0;
    $hasCollision = false;
    do {
        $shortCode = urlmd_generate_code(7);
        $exists = $conn->prepare("SELECT id FROM url_links WHERE short_code = :c LIMIT 1");
        $exists->execute([':c' => $shortCode]);
        $hasCollision = (bool) $exists->fetch();
        $tries++;
    } while ($hasCollision && $tries < 8);

    if ($tries >= 8 && $hasCollision) {
        json_response(['error' => 'Unable to allocate short code'], 500);
        exit();
    }
} else {
    $exists = $conn->prepare("SELECT id FROM url_links WHERE short_code = :c LIMIT 1");
    $exists->execute([':c' => $shortCode]);
    if ($exists->fetch()) {
        json_response(['error' => 'short_code already exists'], 409);
        exit();
    }
}

$expiresSql = null;
if ($expiresAt !== '') {
    $dt = date_create($expiresAt);
    if (!$dt) {
        json_response(['error' => 'Invalid expires_at datetime'], 400);
        exit();
    }
    $expiresSql = $dt->format('Y-m-d H:i:s');
}

try {
    $stmt = $conn->prepare(
        "INSERT INTO url_links (user_id, custom_domain_id, short_code, destination_url, title, note, status, redirect_type, expires_at, is_flagged, flag_reason)
         VALUES (:uid, :cd, :code, :dest, :title, :note, :status, :rtype, :expires, :flagged, :reason)"
    );
    $stmt->execute([
        ':uid' => $userId,
        ':cd' => $customDomainId,
        ':code' => $shortCode,
        ':dest' => $destinationUrl,
        ':title' => $title !== '' ? $title : null,
        ':note' => $note !== '' ? $note : null,
        ':status' => $status,
        ':rtype' => $redirectType,
        ':expires' => $expiresSql,
        ':flagged' => $isFlagged,
        ':reason' => $flagReason,
    ]);

    $linkId = (int) $conn->lastInsertId();

    if ($status === 'blocked') {
        audit_log($conn, null, 'url_auto_block', 'url_link', $linkId, ['reason' => $flagReason]);
    } elseif ($status === 'paused') {
        audit_log($conn, null, 'url_auto_flag', 'url_link', $linkId, ['reason' => $flagReason]);
    }

    json_response([
        'success' => true,
        'data' => [
            'id' => $linkId,
            'short_code' => $shortCode,
            'status' => $status,
            'is_flagged' => (bool) $isFlagged,
            'flag_reason' => $flagReason,
        ]
    ]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to create link'], 500);
}
