<?php
require 'db.php';
require 'utils.php';
$input = json_decode(file_get_contents("php://input"), true);

// 0. Auth
// GET: Admin or Super Admin (to view)
// POST: Super Admin only (to change)

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = require_role('admin'); // Admin can view settings
    $stmt = $conn->query("SELECT * FROM system_settings");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = require_role('super_admin'); // Only Super Admin can change
    $actor_user_id = $user['id'];

    $allowedKeys = [
        'maintenance_mode',
        'blocked_domains',
        'blocked_keywords',
        'blocked_tlds',
        'auto_flag_score_threshold',
        'auto_ban_score_threshold',
    ];

    // Accept either { settings: {k:v}} or flat payload with keys.
    $settings = [];
    if (is_array($input) && isset($input['settings']) && is_array($input['settings'])) {
        $settings = $input['settings'];
    } elseif (is_array($input)) {
        $settings = $input;
    }

    $updates = [];
    foreach ($allowedKeys as $key) {
        if (array_key_exists($key, $settings)) {
            $val = (string) ($settings[$key] ?? '');
            $updates[$key] = $val;
        }
    }

    if (count($updates) === 0) {
        json_response(["error" => "No valid settings provided"], 400);
        exit();
    }

    try {
        $stmt = $conn->prepare(
            "INSERT INTO system_settings (setting_key, setting_value) VALUES (:k, :v)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
        );
        foreach ($updates as $k => $v) {
            $stmt->execute([':k' => $k, ':v' => $v]);
        }

        if (array_key_exists('maintenance_mode', $updates)) {
            audit_log($conn, $actor_user_id, 'system_maintenance_mode', 'system_settings', null, ['maintenance_mode' => $updates['maintenance_mode']]);
        }
        audit_log($conn, $actor_user_id, 'system_settings_update', 'system_settings', null, ['keys' => array_keys($updates)]);
        json_response(["success" => true]);
    } catch (Exception $e) {
        json_response(["error" => "Database error"], 500);
    }
}
?>