<?php
// server/logout.php
require 'db.php';
// 0. Auth
require 'utils.php'; // Ensure require_auth is available
// require_auth() checks if user is logged in
$user = require_auth();
$user_id = $user['id'];
$session_id = $_SESSION['db_session_id'] ?? 0;

if ($session_id <= 0) {
    // If no db_session_id, just destroy session and return success
    session_destroy();
    json_response(["success" => true]);
    exit();
}

try {
    // Update db session
    $stmt = $conn->prepare(
        "UPDATE login_sessions
         SET logout_time = NOW(),
             session_duration_seconds = TIMESTAMPDIFF(SECOND, login_time, NOW())
         WHERE id = :sid AND user_id = :uid AND logout_time IS NULL"
    );
    $stmt->execute([':sid' => $session_id, ':uid' => $user_id]);

    session_destroy();
    json_response(["success" => true]);
} catch (PDOException $e) {
    session_destroy(); // Ensure logout happens even if DB fails
    json_response(["error" => "Database error"], 500);
}
?>