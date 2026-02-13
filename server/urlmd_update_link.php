<?php
require 'db.php';
require 'utils.php';

$user = require_auth();
$userId = (int) $user['id'];
$input = get_json_input();

$linkId = isset($input['id']) ? (int) $input['id'] : 0;
if ($linkId <= 0) {
    json_response(['error' => 'id is required'], 400);
    exit();
}

$ownStmt = $conn->prepare("SELECT id FROM url_links WHERE id = :id AND user_id = :uid");
$ownStmt->execute([':id' => $linkId, ':uid' => $userId]);
if (!$ownStmt->fetch()) {
    json_response(['error' => 'Not found'], 404);
    exit();
}

$fields = [];
$params = [':id' => $linkId];

if (array_key_exists('destination_url', $input)) {
    $destinationUrl = trim((string) $input['destination_url']);
    if (!filter_var($destinationUrl, FILTER_VALIDATE_URL)) {
        json_response(['error' => 'Invalid destination URL'], 400);
        exit();
    }

    $mod = moderate_destination_url($conn, $destinationUrl);
    $status = 'active';
    $flagged = 0;
    $reason = null;

    if ($mod['action'] === 'ban') {
        $status = 'blocked';
        $flagged = 1;
        $reason = $mod['reason'] ?? 'Blocked by moderation';
    } elseif ($mod['action'] === 'pause') {
        $status = 'paused';
        $flagged = 1;
        $reason = $mod['reason'] ?? 'Flagged by moderation';
    }

    $fields[] = 'destination_url = :dest';
    $fields[] = 'status = :status';
    $fields[] = 'is_flagged = :flagged';
    $fields[] = 'flag_reason = :reason';
    $params[':dest'] = $destinationUrl;
    $params[':status'] = $status;
    $params[':flagged'] = $flagged;
    $params[':reason'] = $reason;
}

if (array_key_exists('title', $input)) {
    $title = trim((string) $input['title']);
    $fields[] = 'title = :title';
    $params[':title'] = $title !== '' ? $title : null;
}

if (array_key_exists('note', $input)) {
    $note = trim((string) $input['note']);
    $fields[] = 'note = :note';
    $params[':note'] = $note !== '' ? $note : null;
}

if (array_key_exists('status', $input)) {
    $status = (string) $input['status'];
    if (!in_array($status, ['active', 'paused', 'expired', 'blocked'], true)) {
        json_response(['error' => 'Invalid status'], 400);
        exit();
    }
    $fields[] = 'status = :manual_status';
    $params[':manual_status'] = $status;
}

if (array_key_exists('redirect_type', $input)) {
    $redirectType = (string) $input['redirect_type'];
    if (!in_array($redirectType, ['301', '302'], true)) {
        json_response(['error' => 'Invalid redirect_type'], 400);
        exit();
    }
    $fields[] = 'redirect_type = :rtype';
    $params[':rtype'] = $redirectType;
}

if (array_key_exists('expires_at', $input)) {
    $expiresAt = trim((string) $input['expires_at']);
    if ($expiresAt === '') {
        $fields[] = 'expires_at = NULL';
    } else {
        $dt = date_create($expiresAt);
        if (!$dt) {
            json_response(['error' => 'Invalid expires_at datetime'], 400);
            exit();
        }
        $fields[] = 'expires_at = :expires';
        $params[':expires'] = $dt->format('Y-m-d H:i:s');
    }
}

if (!$fields) {
    json_response(['error' => 'No updatable fields provided'], 400);
    exit();
}

$sql = 'UPDATE url_links SET ' . implode(', ', $fields) . ' WHERE id = :id';

try {
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    json_response(['success' => true]);
} catch (Exception $e) {
    json_response(['error' => 'Failed to update link'], 500);
}
