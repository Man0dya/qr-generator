<?php
// server/create_qr.php
require 'db.php';
require 'utils.php';

$input = json_decode(file_get_contents("php://input"), true);

// 1. Inputs
$user_id = $input['user_id'] ?? null;
// Support both 'url' and 'destination_url' to be safe
$destination_url = $input['destination_url'] ?? ($input['url'] ?? ''); 

// 2. CRITICAL: Capture the Design Config (Colors, Logo, etc.)
// This is what was deleted in your snippet!
$design_config = isset($input['design_config']) ? json_encode($input['design_config']) : null;

if (!$user_id || empty($destination_url)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields (User ID or URL)"]);
    exit();
}

// 3. Generate Short Code
function generateRandomString($length = 6) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $randomString;
}
$short_code = generateRandomString();

// 4. Automatic moderation flagging (heuristic)
$flag = analyze_url_for_moderation($destination_url);
$is_flagged = $flag['flagged'] ? 1 : 0;
$flag_reason = $flag['flagged'] ? $flag['reason'] : null;
$initial_status = $flag['flagged'] ? 'paused' : 'active';

try {
    // 5. Insert into Database INCLUDING design_config + moderation fields
    $stmt = $conn->prepare(
        "INSERT INTO qr_codes (user_id, destination_url, short_code, design_config, status, is_flagged, flag_reason, flagged_at)
         VALUES (:uid, :url, :code, :design, :status, :is_flagged, :flag_reason, :flagged_at)"
    );
    
    $stmt->execute([
        ':uid' => $user_id,
        ':url' => $destination_url,
        ':code' => $short_code,
        ':design' => $design_config, // Saving the colors/logo here
        ':status' => $initial_status,
        ':is_flagged' => $is_flagged,
        ':flag_reason' => $flag_reason,
        ':flagged_at' => $is_flagged ? date('Y-m-d H:i:s') : null,
    ]);

    echo json_encode([
        "success" => true, 
        "short_code" => $short_code,
        "status" => $initial_status,
        "is_flagged" => (bool)$is_flagged,
        "flag_reason" => $flag_reason,
        "message" => "QR Code saved with custom styles"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>