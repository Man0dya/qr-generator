<?php
require 'db.php';
require 'utils.php';
$input = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->query("SELECT * FROM system_settings");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mode = $input['maintenance_mode'];
    $actor_user_id = isset($input['actor_user_id']) ? (int)$input['actor_user_id'] : null;
    $stmt = $conn->prepare("UPDATE system_settings SET setting_value = :val WHERE setting_key = 'maintenance_mode'");
    $stmt->execute([':val' => $mode]);
    audit_log($conn, $actor_user_id, 'system_maintenance_mode', 'system_settings', null, ['maintenance_mode' => $mode]);
    echo json_encode(["success" => true]);
}
?>