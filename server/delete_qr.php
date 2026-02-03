<?php
// server/delete_qr.php
require 'db.php';

$input = json_decode(file_get_contents("php://input"), true);
$qr_id = $input['qr_id'] ?? null;
$user_id = $input['user_id'] ?? null;

if (!$qr_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit();
}

try {
    // Security: Only delete if the ID matches AND the User ID matches
    // This prevents User A from deleting User B's links
    $stmt = $conn->prepare("DELETE FROM qr_codes WHERE id = :qid AND user_id = :uid");
    $stmt->execute([':qid' => $qr_id, ':uid' => $user_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "QR Code deleted"]);
    } else {
        http_response_code(403);
        echo json_encode(["error" => "Unauthorized or QR not found"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>