<?php
// server/get_user_qrs_admin.php
// Returns all QR codes for a given user with scan counts (admin/super admin).

require 'db.php';
require 'utils.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if ($user_id <= 0) {
    json_response(["error" => "user_id required"], 400);
    exit();
}

try {
    $sql = 
        "SELECT 
            q.id,
            q.short_code,
            q.destination_url,
            q.status,
            q.created_at,
            q.updated_at,
            COALESCE(q.is_flagged, 0) as is_flagged,
            q.flag_reason,
            q.flagged_at,
            q.reviewed_by,
            q.reviewed_at,
            COUNT(a.id) as total_scans
         FROM qr_codes q
         LEFT JOIN analytics a ON a.qr_code_id = q.id
         WHERE q.user_id = :uid
         GROUP BY q.id
         ORDER BY q.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':uid' => $user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(["success" => true, "data" => $rows]);
} catch (PDOException $e) {
    json_response(["error" => "Database error"], 500);
}
?>
