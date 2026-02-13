<?php
// server/get_login_history.php
require 'db.php';
require 'utils.php';

$user = require_auth();
$user_id = $user['id'];

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 25;
if ($limit <= 0 || $limit > 200)
    $limit = 25;

try {
    $stmt = $conn->prepare(
        "SELECT id, login_time, logout_time, session_duration_seconds, ip_address, country, device_type, os, browser
         FROM login_sessions
         WHERE user_id = :uid
         ORDER BY login_time DESC
         LIMIT $limit"
    );
    $stmt->execute([':uid' => $user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(["success" => true, "data" => $rows]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>