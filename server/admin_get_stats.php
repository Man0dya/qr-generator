<?php
require 'db.php';

// Security Check: In a real app, you'd check a session token here.
// For now, we trust the frontend sends a request (make sure to secure this in production).

try {
    // 1. Get All Users
    $usersStmt = $conn->query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
    $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get All QR Codes (For moderation)
    $qrsStmt = $conn->query("
        SELECT 
            q.id,
            q.short_code,
            q.destination_url,
            q.status,
            COALESCE(q.is_flagged, 0) as is_flagged,
            q.flag_reason,
            q.flagged_at,
            q.reviewed_at,
            u.email as creator 
        FROM qr_codes q
        JOIN users u ON q.user_id = u.id
        ORDER BY q.created_at DESC
    ");
    $qrs = $qrsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "users" => $users,
        "qrs" => $qrs
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>