<?php
// server/logout.php
require 'db.php';
require 'utils.php';

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$session_id = isset($input['session_id']) ? (int)$input['session_id'] : 0;

if ($user_id <= 0 || $session_id <= 0) {
    json_response(["error" => "Missing user_id or session_id"], 400);
    exit();
}

try {
    // Only allow closing your own session
    $stmt = $conn->prepare(
        "UPDATE login_sessions
         SET logout_time = NOW(),
             session_duration_seconds = TIMESTAMPDIFF(SECOND, login_time, NOW())
         WHERE id = :sid AND user_id = :uid AND logout_time IS NULL"
    );
    $stmt->execute([':sid' => $session_id, ':uid' => $user_id]);

    json_response(["success" => true]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>
