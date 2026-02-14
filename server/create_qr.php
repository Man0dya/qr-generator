<?php
// server/create_qr.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];

$input = json_decode(file_get_contents("php://input"), true);

// 1. Inputs
// $user_id is now from session, not input

// Support both 'url' and 'destination_url' to be safe
$destination_url = $input['destination_url'] ?? ($input['url'] ?? '');
$url_link_id = isset($input['url_link_id']) ? (int) $input['url_link_id'] : null;

// New Fields for Phase 2
$custom_domain_id = isset($input['custom_domain_id']) ? (int) $input['custom_domain_id'] : null;
$qr_type = $input['qr_type'] ?? 'url'; // url, vcard, bio, wifi
$qr_data = isset($input['qr_data']) ? json_encode($input['qr_data']) : null;

// Validate Domain Ownership if set
if ($custom_domain_id) {
    $domCheck = $conn->prepare("SELECT id FROM custom_domains WHERE id = :id AND user_id = :uid AND status = 'active'");
    $domCheck->execute([':id' => $custom_domain_id, ':uid' => $user_id]);
    if (!$domCheck->fetch()) {
        $custom_domain_id = null; // Invalid or not owned, fallback to default
    }
}

// Validate attached URLMD link ownership and derive destination chain if present.
if ($url_link_id !== null && $url_link_id > 0) {
    $linkStmt = $conn->prepare("SELECT id, short_code, destination_url, status FROM url_links WHERE id = :id AND user_id = :uid LIMIT 1");
    $linkStmt->execute([':id' => $url_link_id, ':uid' => $user_id]);
    $link = $linkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$link) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid url_link_id"]);
        exit();
    }

    // Chain QR -> URLMD short link so both systems can track.
    $destination_url = 'redirect.php?c=' . $link['short_code'];
}

// 2. CRITICAL: Capture the Design Config (Colors, Logo, etc.)
// This is what was deleted in your snippet!
$design_config = isset($input['design_config']) ? json_encode($input['design_config']) : null;

if (!$user_id || (empty($destination_url) && $qr_type === 'url')) {
    // For non-URL types, destination_url is optional/generated? 
    // Actually, we still need a destination_url for the redirect to work if we want to fallback?
    // But for vCard/Bio, the redirect logic uses qr_data.
    // So we can relax this check if qr_type != 'url'.
    if ($qr_type === 'url' && empty($destination_url)) {
        http_response_code(400);
        echo json_encode(["error" => "Missing destination URL"]);
        exit();
    }
    // For others, we might want to set a dummy destination_url or leave empty?
    // Let's set it to empty string if not provided, but ensure schema allows it (it does not? checks schema...)
    // Schema says `destination_url TEXT NOT NULL`. So we must provide something.
    if (empty($destination_url)) {
        $destination_url = "dynamic"; // Placeholder
    }
}

// 3. Generate Short Code
function generateRandomString($length = 6)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $randomString;
}
$short_code = generateRandomString();

// 4. Automatic moderation: allow | pause | ban
// Only moderate if it's a URL type or if we have a URL in data?
// For vCard/Bio, we might moderate fields? For now, skip strict moderation for non-URL or moderate the placeholder.
$mod = ['action' => 'allow'];
if ($qr_type === 'url') {
    $mod = moderate_destination_url($conn, $destination_url);
}

$is_flagged = ($mod['action'] !== 'allow') ? 1 : 0;
$flag_reason = ($mod['action'] !== 'allow') ? ($mod['reason'] ?? 'Moderation triggered') : null;

// Unwanted links are auto-banned; suspicious links are paused for review.
$initial_status = $mod['action'] === 'ban' ? 'banned' : ($mod['action'] === 'pause' ? 'paused' : 'active');

try {
    $sql = "INSERT INTO qr_codes (user_id, destination_url, short_code, design_config, status, is_flagged, flag_reason, flagged_at, custom_domain_id, qr_type, qr_data, url_link_id) VALUES (:uid, :url, :code, :design, :status, :is_flagged, :flag_reason, :flagged_at, :cd_id, :type, :data, :url_link_id)";

    // 5. Insert into Database INCLUDING design_config + moderation fields
    $stmt = $conn->prepare($sql);

    $params = [
        ':uid' => $user_id,
        ':url' => $destination_url,
        ':code' => $short_code,
        ':design' => $design_config, // Saving the colors/logo here
        ':status' => $initial_status,
        ':is_flagged' => $is_flagged,
        ':flag_reason' => $flag_reason,
        ':flagged_at' => $is_flagged ? date('Y-m-d H:i:s') : null,
        ':cd_id' => $custom_domain_id,
        ':type' => $qr_type,
        ':data' => $qr_data,
        ':url_link_id' => ($url_link_id !== null && $url_link_id > 0) ? $url_link_id : null,
    ];

    $stmt->execute($params);

    // Best-effort audit entry for automated actions
    if ($initial_status === 'banned') {
        audit_log($conn, null, 'qr_auto_ban', 'qr_code', (int) $conn->lastInsertId(), ['reason' => $flag_reason]);
    } elseif ($initial_status === 'paused') {
        audit_log($conn, null, 'qr_auto_flag', 'qr_code', (int) $conn->lastInsertId(), ['reason' => $flag_reason]);
    }

    echo json_encode([
        "success" => true,
        "short_code" => $short_code,
        "status" => $initial_status,
        "is_flagged" => (bool) $is_flagged,
        "flag_reason" => $flag_reason,
        "message" => "QR Code saved with custom styles"
    ]);

} catch (PDOException $e) {
    error_log('QR creation error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Database error"]);
}
?>